// lib/supabase-service.ts — server-only data access using the service-role key.
// Bypasses RLS: callers MUST do their own authorisation checks first.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  throw new Error('lib/supabase-service must only be imported on the server');
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentRow {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
}

export interface RegistrationRow {
  id: string;
  eventId: string;
  userId: string;
  paymentId: string | null;
  paymentStatus: PaymentStatus | null;
}

export interface EventRow {
  id: string;
  name: string;
  status: 'OPEN' | 'CLOSED' | 'DONE' | 'CANCELLED';
  isFeeRequired: boolean | null;
  registrationFee: number | string | null;
}

let client: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase service credentials are not configured');
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

const PAYMENT_COLUMNS = 'id, registrationId, eventId, userId, amount, status, razorpayOrderId, razorpayPaymentId';

export async function getEvent(eventId: string): Promise<EventRow | null> {
  const { data, error } = await admin()
    .from('Event')
    .select('id, name, status, isFeeRequired, registrationFee')
    .eq('id', eventId)
    .maybeSingle();
  if (error) throw error;
  return data as EventRow | null;
}

export async function getRegistration(registrationId: string): Promise<RegistrationRow | null> {
  const { data, error } = await admin()
    .from('Registration')
    .select('id, eventId, userId, paymentId, paymentStatus')
    .eq('id', registrationId)
    .maybeSingle();
  if (error) throw error;
  return data as RegistrationRow | null;
}

export async function getPaymentByOrderId(orderId: string): Promise<PaymentRow | null> {
  const { data, error } = await admin()
    .from('Payment')
    .select(PAYMENT_COLUMNS)
    .eq('razorpayOrderId', orderId)
    .maybeSingle();
  if (error) throw error;
  return data as PaymentRow | null;
}

export async function savePayment(paymentData: {
  registrationId: string;
  eventId: string;
  userId: string;
  amount: number;
  razorpayOrderId: string;
}): Promise<PaymentRow> {
  const { data, error } = await admin()
    .from('Payment')
    .insert({ ...paymentData, status: 'pending', paymentMethod: 'razorpay' })
    .select(PAYMENT_COLUMNS)
    .single();
  if (error) throw error;
  return data as PaymentRow;
}

/**
 * Marks a payment completed/failed. Only moves rows that are still `pending`
 * (or `failed` → `completed` on retry), so replays and webhook races are no-ops.
 * Returns the updated row, or null if nothing changed.
 */
export async function settlePayment(
  paymentId: string,
  status: 'completed' | 'failed',
  razorpayPaymentId: string,
  razorpaySignature?: string
): Promise<PaymentRow | null> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status, razorpayPaymentId, updatedAt: now };
  if (razorpaySignature) update.razorpaySignature = razorpaySignature;
  if (status === 'completed') update.paymentDate = now;

  const fromStatuses: PaymentStatus[] = status === 'completed' ? ['pending', 'failed'] : ['pending'];

  const { data, error } = await admin()
    .from('Payment')
    .update(update)
    .eq('id', paymentId)
    .in('status', fromStatuses)
    .select(PAYMENT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data as PaymentRow | null;
}

export async function updateRegistrationPaymentStatus(
  registrationId: string,
  paymentId: string,
  paymentStatus: 'completed' | 'failed'
): Promise<void> {
  let query = admin()
    .from('Registration')
    .update({ paymentId, paymentStatus })
    .eq('id', registrationId);
  // Never downgrade a registration that is already paid.
  if (paymentStatus === 'failed') query = query.or('paymentStatus.is.null,paymentStatus.neq.completed');
  const { error } = await query;
  if (error) throw error;
}
