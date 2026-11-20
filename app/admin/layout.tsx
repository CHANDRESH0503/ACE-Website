import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin';

export const metadata: Metadata = {
  title: 'Admin · ACE SASTRA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="mx-auto max-w-[1600px] px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14 print:max-w-none print:p-0">{children}</div>;
}
