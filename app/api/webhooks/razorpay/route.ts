// app/api/webhooks/razorpay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, isValidOrderId, isValidPaymentId } from '@/lib/razorpay';
import {
  getPaymentByOrderId,
  settlePayment,
  updateRegistrationPaymentStatus,
} from '@/lib/supabase-service';
import type { WebhookEvent } from '@/lib/types/payment';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 100_000;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false }, { status: 413 });
    }

    const signature = request.headers.get('x-razorpay-signature');
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      console.warn('Rejected webhook: invalid signature');
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { event, payload } = JSON.parse(rawBody) as WebhookEvent;
    const entity = payload?.payment?.entity;

    if ((event === 'payment.captured' || event === 'payment.failed') && entity) {
      const orderId = entity.order_id;
      const paymentId = entity.id;
      if (!isValidOrderId(orderId) || !isValidPaymentId(paymentId)) {
        return NextResponse.json({ success: true, message: 'Ignored' });
      }

      const dbPayment = await getPaymentByOrderId(orderId);
      if (!dbPayment) {
        // Not one of ours. Acknowledge it so Razorpay stops retrying.
        console.warn('Webhook for unknown order', { orderId });
        return NextResponse.json({ success: true, message: 'Ignored' });
      }

      if (event === 'payment.captured') {
        const expectedPaise = Math.round(Number(dbPayment.amount) * 100);
        if (entity.amount !== expectedPaise || entity.currency !== 'INR') {
          console.error('Webhook amount mismatch', { orderId, paymentId });
          return NextResponse.json({ success: true, message: 'Amount mismatch' });
        }
        const updated = await settlePayment(dbPayment.id, 'completed', paymentId);
        if (updated) {
          await updateRegistrationPaymentStatus(updated.registrationId, updated.id, 'completed');
        }
      } else {
        const updated = await settlePayment(dbPayment.id, 'failed', paymentId);
        if (updated) {
          await updateRegistrationPaymentStatus(updated.registrationId, updated.id, 'failed');
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error instanceof Error ? error.message : error);
    // 500 makes Razorpay retry.
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
