// app/api/payments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPaymentSignature,
  fetchPaymentDetails,
  isValidOrderId,
  isValidPaymentId,
} from '@/lib/razorpay';
import {
  getPaymentByOrderId,
  settlePayment,
  updateRegistrationPaymentStatus,
} from '@/lib/supabase-service';
import { getAuthenticatedUser, isSameOrigin, readJson } from '@/lib/api-auth';
import type { RazorpayPaymentVerification, PaymentResponse } from '@/lib/types/payment';

export const dynamic = 'force-dynamic';

const fail = (message: string, status: number) =>
  NextResponse.json<PaymentResponse>({ success: false, message }, { status });

export async function POST(request: NextRequest): Promise<NextResponse<PaymentResponse>> {
  try {
    if (!isSameOrigin(request)) return fail('Forbidden', 403);

    const user = await getAuthenticatedUser();
    if (!user) return fail('Please sign in to continue', 401);

    const body = await readJson<Partial<RazorpayPaymentVerification>>(request);
    const orderId = body?.razorpay_order_id;
    const paymentId = body?.razorpay_payment_id;
    const signature = body?.razorpay_signature;

    if (!isValidOrderId(orderId) || !isValidPaymentId(paymentId) || typeof signature !== 'string') {
      return fail('Missing or invalid verification data', 400);
    }

    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      console.warn('Invalid payment signature', { orderId });
      return fail('Payment verification failed', 401);
    }

    // The order was stored when it was created; look it up by order id.
    const payment = await getPaymentByOrderId(orderId);
    if (!payment || payment.userId !== user.id) return fail('Payment not found', 404);

    if (payment.status === 'completed') {
      return NextResponse.json<PaymentResponse>({ success: true, message: 'Payment already verified' });
    }

    // Ask Razorpay directly: the payment must be captured, for this order, for the full amount.
    const details = await fetchPaymentDetails(paymentId);
    const expectedPaise = Math.round(Number(payment.amount) * 100);
    if (
      details.order_id !== orderId ||
      details.currency !== 'INR' ||
      details.amount !== expectedPaise
    ) {
      console.warn('Payment details mismatch', { orderId, paymentId });
      return fail('Payment verification failed', 400);
    }
    if (details.status !== 'captured') {
      return fail('Payment has not been captured yet. It will be confirmed automatically once it is.', 202);
    }

    const updated = await settlePayment(payment.id, 'completed', paymentId, signature);
    if (updated) {
      await updateRegistrationPaymentStatus(updated.registrationId, updated.id, 'completed');
    }

    return NextResponse.json<PaymentResponse>({
      success: true,
      message: 'Payment verified and registration confirmed',
    });
  } catch (error) {
    console.error('Payment verification error:', error instanceof Error ? error.message : error);
    return fail('Payment verification failed', 500);
  }
}
