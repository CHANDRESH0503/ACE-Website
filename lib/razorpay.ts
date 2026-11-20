// lib/razorpay.ts — server-only Razorpay helpers.
import axios from 'axios';
import crypto from 'crypto';

if (typeof window !== 'undefined') {
  throw new Error('lib/razorpay must only be imported on the server');
}

const RAZORPAY_API = 'https://api.razorpay.com/v1';
const ORDER_ID_RE = /^order_[A-Za-z0-9]{6,40}$/;
const PAYMENT_ID_RE = /^pay_[A-Za-z0-9]{6,40}$/;
const SIGNATURE_RE = /^[a-f0-9]{64}$/;

function credentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }
  return { keyId, keySecret };
}

export const isValidOrderId = (id: unknown): id is string =>
  typeof id === 'string' && ORDER_ID_RE.test(id);
export const isValidPaymentId = (id: unknown): id is string =>
  typeof id === 'string' && PAYMENT_ID_RE.test(id);

function safeEqualHex(expected: string, received: string): boolean {
  if (!SIGNATURE_RE.test(received)) return false;
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(received, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

interface CreateOrderParams {
  amount: number; // paise
  currency: 'INR';
  receipt: string;
  notes: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
}

export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
  const { keyId, keySecret } = credentials();
  try {
    const response = await axios.post(`${RAZORPAY_API}/orders`, params, {
      auth: { username: keyId, password: keySecret },
      headers: { 'Content-Type': 'application/json' },
      timeout: 15_000,
    });
    return response.data;
  } catch (error: unknown) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    console.error('Razorpay order creation failed', { status });
    throw new Error('Failed to create Razorpay order');
  }
}

export async function fetchPaymentDetails(paymentId: string): Promise<RazorpayPayment> {
  if (!isValidPaymentId(paymentId)) throw new Error('Invalid payment id');
  const { keyId, keySecret } = credentials();
  try {
    const response = await axios.get(`${RAZORPAY_API}/payments/${encodeURIComponent(paymentId)}`, {
      auth: { username: keyId, password: keySecret },
      timeout: 15_000,
    });
    return response.data;
  } catch (error: unknown) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    console.error('Razorpay fetch payment failed', { status });
    throw new Error('Failed to fetch payment details');
  }
}

/** Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  try {
    const { keySecret } = credentials();
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return safeEqualHex(expected, signature);
  } catch {
    return false;
  }
}

/** Webhook signature: HMAC_SHA256(raw_body, webhook_secret). This secret is separate from the API key secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}
