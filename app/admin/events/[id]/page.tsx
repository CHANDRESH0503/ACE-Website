import { notFound } from 'next/navigation';
import { isUuid } from '@/lib/api-auth';
import { loadEventReport } from '@/lib/admin';
import EventReportClient from './EventReportClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminEventReportPage({ params }: Props) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const report = await loadEventReport(id);
  if (!report) notFound();
  return <EventReportClient {...report} />;
}
