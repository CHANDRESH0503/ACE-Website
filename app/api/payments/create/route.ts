// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/razorpay';
import { savePayment, getEvent, getRegistration } from '@/lib/supabase-service';
import { getAuthenticatedUser, isSameOrigin, isUuid, readJson } from '@/lib/api-auth';
import type { PaymentResponse } from '@/lib/types/payment';

export const dynamic = 'force-dynamic';

const fail = (message: string, status: number) =>
  NextResponse.json<PaymentResponse>({ success: false, message }, { status });

export async function POST(request: NextRequest): Promise<NextResponse<PaymentResponse>> {
  try {
    if (!isSameOrigin(request)) return fail('Forbidden', 403);

    const user = await getAuthenticatedUser();
    if (!user) return fail('Please sign in to continue', 401);

    const body = await readJson<{ registrationId?: unknown }>(request);
    const registrationId = body?.registrationId;
    if (!isUuid(registrationId)) return fail('Invalid registration', 400);

    // The client only says which registration to pay for. Owner, event and
    // amount all come from the database.
    const registration = await getRegistration(registrationId);
    if (!registration || registration.userId !== user.id) return fail('Registration not found', 404);
    if (registration.paymentStatus === 'completed') return fail('This registration is already paid', 409);

    const event = await getEvent(registration.eventId);
    if (!event) return fail('Event not found', 404);
    if (event.status !== 'OPEN') return fail('Registration is closed for this event', 409);

    const fee = Number(event.registrationFee ?? 0);
    if (!event.isFeeRequired || !Number.isFinite(fee) || fee <= 0) {
      return fail('This event does not require payment', 400);
    }

    const amountInPaise = Math.round(fee * 100);
    const order = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `reg_${registration.id.replace(/-/g, '').slice(0, 32)}`,
      notes: { eventId: event.id, userId: user.id, registrationId: registration.id },
    });

    await savePayment({
      registrationId: registration.id,
      eventId: event.id,
      userId: user.id,
      amount: fee,
      razorpayOrderId: order.id,
    });

    return NextResponse.json<PaymentResponse>({
      success: true,
      message: 'Order created successfully',
      orderId: order.id,
      amount: amountInPaise,
    });
  } catch (error) {
    console.error('Payment creation error:', error instanceof Error ? error.message : error);
    return fail('Failed to create payment order', 500);
  }
}
