'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpRight, Check, Copy, Download, Pencil, Printer, RotateCw, Search, X } from 'lucide-react';
import { useAuth } from '@/components/context/AuthContext';
import type { EventReport, ReportRow } from '@/lib/admin';
import { EVENT_STATUS_NAME, EVENT_TYPE_NAME, feeOf, formatStamp, formatWhen, participationLabel } from '@/lib/event-display';
import { cn } from '@/lib/utils';

type SortKey = 'registeredAt' | 'name' | 'registrationNumber' | 'department' | 'year' | 'teamName';
type AttendanceFilter = 'all' | 'present' | 'absent';
type PaymentFilter = 'all' | 'paid' | 'pending';

const yearName = (y: number | null) => (y ? `Year ${y}` : 'Year not set');

function toCsv(rows: ReportRow[], order: Map<string, number>, withPayment: boolean, isTeam: boolean): string {
  // Team events: one row per team, lead first, then fixed columns for members 2–4.
  const teamHead = isTeam ? ['Team name', 'Team size', ...[2, 3, 4].flatMap((n) => [`Member ${n} name`, `Member ${n} register number`])] : [];
  const head = ['#', ...teamHead, isTeam ? 'Lead name' : 'Name', isTeam ? 'Lead register number' : 'Register number', 'Email', 'Mobile', 'Department', 'Year', 'Registered at (IST)', ...(withPayment ? ['Payment'] : []), 'Attended', 'Points'];
  const cell = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [
      order.get(r.registrationId) ?? '',
      ...(isTeam
        ? [
            r.team?.name ?? '',
            r.team?.size ?? '',
            ...[0, 1, 2].flatMap((i) => [r.team?.members[i]?.name ?? '', r.team?.members[i]?.registrationNumber ?? '']),
          ]
        : []),
      r.name,
      r.registrationNumber,
      r.email ?? '',
      r.mobile ?? '',
      r.department,
      r.year ?? '',
      formatStamp(r.registeredAt),
      ...(withPayment ? [r.paymentStatus === 'completed' ? 'Paid' : 'Pending'] : []),
      r.attended ? 'Yes' : 'No',
      r.points ?? '',
    ]
      .map(cell)
      .join(',')
  );
  return '﻿' + [head.join(','), ...lines].join('\r\n');
}

function slug(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'event';
}

export default function EventReportClient({ event, rows: initialRows, emailsAvailable }: EventReport) {
  const { supabase } = useAuth();
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  const [rows, setRows] = useState(initialRows);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [year, setYear] = useState<string>('all');
  const [dept, setDept] = useState<string>('all');
  const [attendance, setAttendance] = useState<AttendanceFilter>('all');
  const [payment, setPayment] = useState<PaymentFilter>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'registeredAt', dir: 1 });

  // Keep server data in sync after a refresh.
  const [seed, setSeed] = useState(initialRows);
  if (seed !== initialRows) {
    setSeed(initialRows);
    setRows(initialRows);
  }

  const fee = feeOf(event);
  const capacity = event.maxCapacity ?? null;
  const isTeam = event.participationMode === 'TEAM';

  // Registration order is the stable "#": it doesn't change with sorting or filters.
  const order = useMemo(() => new Map(rows.map((r, i) => [r.registrationId, i + 1])), [rows]);

  const stats = useMemo(() => {
    const present = rows.filter((r) => r.attended).length;
    const paid = rows.filter((r) => r.paymentStatus === 'completed').length;
    const count = <K extends string>(key: (r: ReportRow) => K) => {
      const m = new Map<K, number>();
      for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
      return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
    };
    return {
      total: rows.length,
      people: rows.reduce((n, r) => n + (r.team?.size ?? 1), 0),
      present,
      paid,
      byYear: count((r) => String(r.year ?? '')).sort((a, b) => (a[0] || '9').localeCompare(b[0] || '9')),
      byDept: count((r) => r.department || 'Not set'),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (year !== 'all' && String(r.year ?? '') !== year) return false;
      if (dept !== 'all' && (r.department || 'Not set') !== dept) return false;
      if (attendance === 'present' && !r.attended) return false;
      if (attendance === 'absent' && r.attended) return false;
      if (payment === 'paid' && r.paymentStatus !== 'completed') return false;
      if (payment === 'pending' && r.paymentStatus === 'completed') return false;
      if (!q) return true;
      return [r.name, r.registrationNumber, r.email, r.mobile, r.team?.name, ...(r.team?.members.flatMap((m) => [m.name, m.registrationNumber]) ?? [])].some(
        (v) => v?.toLowerCase().includes(q)
      );
    });
    const { key, dir } = sort;
    return list.sort((a, b) => {
      const av = (key === 'teamName' ? a.team?.name : a[key]) ?? '';
      const bv = (key === 'teamName' ? b.team?.name : b[key]) ?? '';
      const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'en', { numeric: true });
      return c * dir || a.registeredAt.localeCompare(b.registeredAt);
    });
  }, [rows, query, year, dept, attendance, payment, sort]);

  const filtersOn = query !== '' || year !== 'all' || dept !== 'all' || attendance !== 'all' || payment !== 'all';
  const clearFilters = () => {
    setQuery('');
    setYear('all');
    setDept('all');
    setAttendance('all');
    setPayment('all');
  };

  async function toggleAttendance(row: ReportRow) {
    const next = !row.attended;
    const id = row.registrationId;
    setSaving((s) => new Set(s).add(id));
    setRows((rs) => rs.map((r) => (r.registrationId === id ? { ...r, attended: next } : r)));
    const { data, error } = await supabase.from('Registration').update({ attended: next }).eq('id', id).select('id');
    setSaving((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    if (error || !data?.length) {
      setRows((rs) => rs.map((r) => (r.registrationId === id ? { ...r, attended: row.attended } : r)));
      toast.error(`Couldn't update ${row.name}. Check your connection and try again.`);
    }
  }

  function exportCsv() {
    const blob = new Blob([toCsv(filtered, order, fee > 0, isTeam)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug(event.name)}-registrations${filtersOn ? '-filtered' : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyFormLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}/register`);
      toast.success('Registration form link copied.');
    } catch {
      toast.error('Copy failed. The link is /events/' + event.id + '/register');
    }
  }

  const sortBy = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  const statusName = EVENT_STATUS_NAME[event.status] ?? event.status;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link href="/admin" className="group inline-flex min-h-11 items-center gap-2 label text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" /> All events
        </Link>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
        >
          <RotateCw className={cn('size-4', refreshing && 'animate-spin')} /> {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {/* Header */}
      <header className="mt-4 border-b border-border pb-8 print:mt-0 print:pb-4">
        <h1 className="max-w-[24ch] text-balance text-4xl font-extrabold leading-[0.95] tracking-[-0.04em] [font-stretch:110%] sm:text-5xl print:text-3xl">
          {event.name.trim()}
        </h1>
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
          <span className="font-mono text-sm tabular">{formatWhen(event.startTime, event.endTime)}</span>
          <span aria-hidden="true">·</span>
          <span>{event.location || 'Venue TBA'}</span>
          <span aria-hidden="true">·</span>
          <span>{EVENT_TYPE_NAME[event.type] ?? event.type}</span>
          <span aria-hidden="true">·</span>
          <span>{participationLabel(event)}</span>
          <span aria-hidden="true">·</span>
          <span className={cn(event.status === 'OPEN' && 'text-primary')}>{statusName}</span>
        </p>

        <div className="mt-6 flex flex-wrap gap-2 print:hidden">
          <ActionButton onClick={exportCsv} primary disabled={filtered.length === 0}>
            <Download className="size-4" /> Export CSV
            <span className="font-mono text-xs tabular opacity-80">{filtered.length}</span>
          </ActionButton>
          <ActionButton onClick={() => window.print()} disabled={rows.length === 0}>
            <Printer className="size-4" /> Print sign-in sheet
          </ActionButton>
          <ActionButton onClick={copyFormLink}>
            <Copy className="size-4" /> Copy form link
          </ActionButton>
          <Link
            href={`/admin/events/${event.id}/edit`}
            className="inline-flex h-11 items-center gap-2 border border-foreground/25 px-4 text-sm font-semibold transition-colors hover:bg-foreground hover:text-background"
          >
            <Pencil className="size-4" /> Edit event
          </Link>
          <Link
            href={`/events/${event.id}`}
            className="inline-flex h-11 items-center gap-2 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Public page <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* Summary */}
      <dl className="grid grid-cols-2 border-b border-border lg:grid-cols-4 print:hidden">
        <Stat label={isTeam ? 'Teams' : 'Registered'} value={stats.total} of={capacity} />
        <Stat
          label="Checked in"
          value={stats.present}
          note={stats.total ? `${Math.round((stats.present / stats.total) * 100)}%` : undefined}
          accent
        />
        {isTeam ? (
          <Stat label="Participants" value={stats.people} note="incl. teammates" />
        ) : (
          <Stat label="Not checked in" value={stats.total - stats.present} />
        )}
        {fee > 0 ? (
          <Stat label={`Paid · ₹${fee}`} value={stats.paid} note={`${stats.total - stats.paid} pending`} />
        ) : (
          <Stat label={isTeam ? 'Team places left' : 'Seats left'} value={capacity != null ? Math.max(capacity - stats.total, 0) : null} note={capacity == null ? 'No limit set' : undefined} />
        )}
      </dl>

      {rows.length > 0 && (
        <div className="grid gap-x-8 border-b border-border py-8 md:grid-cols-2 print:hidden">
          <Breakdown
            title={isTeam ? 'Team leads by year' : 'By year'}
            items={stats.byYear.map(([k, n]) => ({ key: k, label: yearName(k ? Number(k) : null), n }))}
            total={stats.total}
            active={year}
            onPick={(k) => setYear((y) => (y === k ? 'all' : k))}
          />
          <Breakdown
            title={isTeam ? 'Team leads by department' : 'By department'}
            items={stats.byDept.map(([k, n]) => ({ key: k, label: k, n }))}
            total={stats.total}
            active={dept}
            onPick={(k) => setDept((d) => (d === k ? 'all' : k))}
            className="mt-8 md:mt-0"
          />
        </div>
      )}

      {!emailsAvailable && rows.length > 0 && (
        <p className="mt-6 border-l border-primary pl-3 text-sm text-muted-foreground print:hidden">
          Emails are hidden until the <span className="font-mono">admin_event_registrant_emails</span> database function is installed
          (migration <span className="font-mono">20261120120000</span>).
        </p>
      )}

      {/* Toolbar */}
      {rows.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-[minmax(16rem,1.6fr)_repeat(4,minmax(0,1fr))] print:hidden">
          <label className="col-span-2 block lg:col-span-1">
            <span className="label text-muted-foreground">Search</span>
            <span className="mt-1 flex items-center gap-2 border-b border-foreground/30 transition-colors focus-within:border-primary">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, register no., email or mobile"
                className="w-full bg-transparent py-2.5 outline-none placeholder:text-muted-foreground/70 focus-visible:outline-none"
              />
            </span>
          </label>
          <Filter label="Year" value={year} onChange={setYear} options={[['all', 'All years'], ...stats.byYear.map(([k]) => [k, yearName(k ? Number(k) : null)] as [string, string])]} />
          <Filter label="Department" value={dept} onChange={setDept} options={[['all', 'All departments'], ...stats.byDept.map(([k]) => [k, k] as [string, string])]} />
          <Filter
            label="Attendance"
            value={attendance}
            onChange={(v) => setAttendance(v as AttendanceFilter)}
            options={[['all', 'Everyone'], ['present', 'Checked in'], ['absent', 'Not checked in']]}
          />
          {fee > 0 ? (
            <Filter
              label="Payment"
              value={payment}
              onChange={(v) => setPayment(v as PaymentFilter)}
              options={[['all', 'Any status'], ['paid', 'Paid'], ['pending', 'Pending']]}
            />
          ) : null}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-6 flex min-h-11 items-center justify-between gap-4 print:hidden">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing <span className="font-mono tabular text-foreground">{filtered.length}</span> of{' '}
            <span className="font-mono tabular">{rows.length}</span>
          </p>
          {filtersOn && (
            <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:text-foreground">
              <X className="size-4" /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Empty states */}
      {rows.length === 0 ? (
        <div className="mt-10 grid gap-6 border-t border-border pt-8 lg:grid-cols-12">
          <p className="text-2xl font-semibold tracking-[-0.02em] lg:col-span-6">No one has registered yet.</p>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="text-muted-foreground">
              {event.status === 'OPEN'
                ? 'Share the registration form link. Members sign in with their SASTRA account and their details are filled in for them.'
                : 'Registration is not open for this event, so no one can sign up from the site.'}
            </p>
            {event.status === 'OPEN' && (
              <div className="mt-5">
                <ActionButton onClick={copyFormLink} primary>
                  <Copy className="size-4" /> Copy form link
                </ActionButton>
              </div>
            )}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-2 border-t border-border py-10">
          <p className="text-lg font-semibold">No registrations match these filters.</p>
          <button type="button" onClick={clearFilters} className="mt-3 min-h-11 font-semibold text-primary underline decoration-1 underline-offset-4 hover:text-foreground">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Phones: check-in list */}
          <ul className="mt-2 border-t border-border md:hidden print:hidden">
            {filtered.map((r) => (
              <li key={r.registrationId} className="flex items-center gap-4 border-b border-border py-4">
                <span className="w-8 shrink-0 font-mono text-xs tabular text-muted-foreground">{order.get(r.registrationId)}</span>
                <div className="min-w-0 grow">
                  {r.team && (
                    <p className="truncate text-sm font-semibold text-primary">
                      {r.team.name} <span className="font-mono text-xs tabular text-muted-foreground">· {r.team.size}</span>
                    </p>
                  )}
                  <p className="truncate font-semibold">
                    {r.name}
                    {r.team && <span className="font-normal text-muted-foreground"> · lead</span>}
                  </p>
                  <p className="truncate font-mono text-xs tabular text-muted-foreground">
                    {r.registrationNumber} · {r.department} · Y{r.year ?? '–'}
                  </p>
                  {r.mobile && (
                    <a href={`tel:+91${r.mobile}`} className="mt-0.5 inline-block font-mono text-xs tabular text-primary">
                      {r.mobile}
                    </a>
                  )}
                  {r.team && r.team.members.length > 0 && (
                    <ul className="mt-2 space-y-0.5 border-l border-border pl-3 text-sm">
                      {r.team.members.map((m) => (
                        <li key={m.registrationNumber} className="truncate">
                          {m.name} <span className="font-mono text-xs tabular text-muted-foreground">{m.registrationNumber}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <AttendanceToggle row={r} busy={saving.has(r.registrationId)} onToggle={toggleAttendance} />
              </li>
            ))}
          </ul>

          {/* Desktop + print: table */}
          <div className="mt-2 hidden overflow-x-auto md:block print:block print:overflow-visible">
            <table className={cn("w-full border-collapse text-left text-sm print:min-w-0 print:text-[10pt]", isTeam ? "min-w-[80rem]" : "min-w-[60rem]")}>
              <caption className="sr-only">Registrations for {event.name.trim()}</caption>
              <thead>
                <tr className="border-y border-foreground/40">
                  <Th className="w-12">#</Th>
                  {isTeam && (
                    <SortTh k="teamName" sort={sort} onSort={sortBy}>
                      Team
                    </SortTh>
                  )}
                  <SortTh k="name" sort={sort} onSort={sortBy}>{isTeam ? 'Lead' : 'Name'}</SortTh>
                  <SortTh k="registrationNumber" sort={sort} onSort={sortBy}>Register no.</SortTh>
                  <Th className="print:hidden">Email</Th>
                  <Th>Mobile</Th>
                  <SortTh k="department" sort={sort} onSort={sortBy}>Dept</SortTh>
                  <SortTh k="year" sort={sort} onSort={sortBy}>Year</SortTh>
                  {isTeam && <Th>Teammates</Th>}
                  <SortTh k="registeredAt" sort={sort} onSort={sortBy} className="print:hidden">Registered</SortTh>
                  {fee > 0 && <Th className="print:hidden">Payment</Th>}
                  <Th className="text-right print:hidden">Attendance</Th>
                  <Th className="hidden w-48 print:table-cell">Signature</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.registrationId} className="border-b border-border transition-colors hover:bg-muted/40 print:hover:bg-transparent">
                    <td className="py-3 pr-4 font-mono text-xs tabular text-muted-foreground">{order.get(r.registrationId)}</td>
                    {isTeam && (
                      <td className="py-3 pr-4">
                        <span className="font-semibold">{r.team?.name ?? '—'}</span>
                        {r.team && <span className="ml-1.5 font-mono text-xs tabular text-muted-foreground">{r.team.size}</span>}
                      </td>
                    )}
                    <td className="py-3 pr-4 font-semibold">
                      <Link href={`/user/${r.userId}`} className="hover:text-primary print:no-underline">
                        {r.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-mono tabular">{r.registrationNumber}</td>
                    <td className="max-w-[16rem] truncate py-3 pr-4 print:hidden">
                      {r.email ? (
                        <a href={`mailto:${r.email}`} className="hover:text-primary">
                          {r.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono tabular">
                      {r.mobile ? (
                        <a href={`tel:+91${r.mobile}`} className="hover:text-primary">
                          {r.mobile}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{r.department || '—'}</td>
                    <td className="py-3 pr-4 font-mono tabular">{r.year ?? '—'}</td>
                    {isTeam && (
                      <td className="py-3 pr-4">
                        {r.team?.members.length ? (
                          <ul className="space-y-0.5">
                            {r.team.members.map((m) => (
                              <li key={m.registrationNumber} className="whitespace-nowrap">
                                {m.name} <span className="font-mono text-xs tabular text-muted-foreground">{m.registrationNumber}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    )}
                    <td className="py-3 pr-4 font-mono text-xs tabular text-muted-foreground print:hidden">{formatStamp(r.registeredAt)}</td>
                    {fee > 0 && (
                      <td className="py-3 pr-4 print:hidden">
                        {r.paymentStatus === 'completed' ? (
                          <span className="font-semibold">Paid</span>
                        ) : (
                          <span className="text-muted-foreground">{r.paymentStatus === 'failed' ? 'Failed' : 'Pending'}</span>
                        )}
                      </td>
                    )}
                    <td className="py-2 text-right print:hidden">
                      <AttendanceToggle row={r} busy={saving.has(r.registrationId)} onToggle={toggleAttendance} />
                    </td>
                    <td className="hidden border-l border-border print:table-cell" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ActionButton({ children, onClick, primary, disabled }: { children: React.ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-11 items-center gap-2 px-4 text-sm font-semibold transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        primary ? 'bg-primary text-primary-foreground hover:bg-foreground hover:text-background' : 'border border-foreground/25 hover:bg-foreground hover:text-background'
      )}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, of, note, accent }: { label: string; value: number | null; of?: number | null; note?: string; accent?: boolean }) {
  return (
    <div className="border-border py-5 odd:border-r odd:pr-4 even:pl-4 [&:nth-child(-n+2)]:border-b lg:border-r lg:px-5 lg:first:pl-0 lg:last:border-r-0 lg:[&:nth-child(-n+2)]:border-b-0">
      <dt className="label text-muted-foreground">{label}</dt>
      <dd className="mt-2 flex items-baseline gap-2">
        <span className={cn('font-mono text-3xl font-semibold tabular sm:text-4xl', accent && 'text-primary')}>{value ?? '—'}</span>
        {of != null && <span className="font-mono tabular text-muted-foreground">/ {of}</span>}
        {note && <span className="text-sm text-muted-foreground">{note}</span>}
      </dd>
    </div>
  );
}

function Breakdown({
  title,
  items,
  total,
  active,
  onPick,
  className,
}: {
  title: string;
  items: { key: string; label: string; n: number }[];
  total: number;
  active: string;
  onPick: (key: string) => void;
  className?: string;
}) {
  const max = Math.max(...items.map((i) => i.n), 1);
  return (
    <div className={className}>
      <h2 className="label text-muted-foreground">{title}</h2>
      <ul className="mt-3 border-t border-border">
        {items.map((i) => {
          const on = active === i.key;
          return (
            <li key={i.key} className="border-b border-border">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onPick(i.key)}
                title={on ? 'Clear this filter' : `Show only ${i.label}`}
                className={cn('grid min-h-11 w-full grid-cols-[minmax(0,10rem)_1fr_4.5rem] items-center gap-4 py-2 text-left text-sm transition-colors hover:text-foreground', on ? 'text-primary' : 'text-foreground/85')}
              >
                <span className={cn('truncate', on && 'font-semibold')}>{i.label}</span>
                <span className="h-1.5 bg-border" aria-hidden="true">
                  <span className={cn('block h-full transition-[width] duration-300', on ? 'bg-primary' : 'bg-foreground/60')} style={{ width: `${(i.n / max) * 100}%` }} />
                </span>
                <span className="text-right font-mono tabular">
                  {i.n}
                  <span className="ml-1.5 text-xs text-muted-foreground">{Math.round((i.n / total) * 100)}%</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="label text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'mt-1 w-full cursor-pointer appearance-none rounded-none border-0 border-b bg-transparent bg-[length:12px] bg-[right_2px_center] bg-no-repeat py-2.5 pr-6 outline-none transition-colors focus:border-primary focus-visible:outline-none',
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='%23888' stroke-width='1.5'%3E%3Cpath d='M2 4.5l4 4 4-4'/%3E%3C/svg%3E\")]",
          value === 'all' ? 'border-foreground/30' : 'border-primary font-semibold'
        )}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v} className="bg-background text-foreground">
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th scope="col" className={cn('py-3 pr-4 label font-semibold text-muted-foreground', className)}>{children}</th>;
}

function SortTh({
  k,
  sort,
  onSort,
  children,
  className,
}: {
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const on = sort.key === k;
  const Icon = sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={cn('py-1 pr-4', className)}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn('inline-flex min-h-10 items-center gap-1 label font-semibold transition-colors hover:text-foreground print:pointer-events-none', on ? 'text-foreground' : 'text-muted-foreground')}
      >
        {children}
        <Icon className={cn('size-3 print:hidden', on ? 'opacity-100' : 'opacity-0')} />
      </button>
    </th>
  );
}

function AttendanceToggle({ row, busy, onToggle }: { row: ReportRow; busy: boolean; onToggle: (r: ReportRow) => void }) {
  const on = !!row.attended;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `${row.name} is checked in. Undo check-in` : `Check in ${row.name}`}
      onClick={() => onToggle(row)}
      disabled={busy}
      className={cn(
        'inline-flex h-11 min-w-32 shrink-0 items-center justify-between gap-3 px-3 text-sm font-semibold transition-colors duration-200 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60',
        on ? 'bg-primary text-primary-foreground hover:bg-foreground hover:text-background' : 'border border-foreground/25 hover:border-foreground'
      )}
    >
      {on ? 'Checked in' : 'Check in'}
      <span className={cn('grid size-4 place-items-center border', on ? 'border-current' : 'border-foreground/40')}>
        {on && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}
