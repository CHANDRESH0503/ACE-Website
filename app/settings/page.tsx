import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';
import UpdateContactForm from './UpdateContactForm';

type UserProfile = Tables<'UserProfile'>;

export const metadata: Metadata = { title: 'Settings · ACE SASTRA' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) redirect('/');

  const { data: userProfile, error: profileError } = await supabase
    .from('UserProfile')
    .select('*')
    .eq('id', authUser.id)
    .single<UserProfile>();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching user profile:', profileError);
    return (
      <SettingsShell>
        <StateBlock
          title="We couldn’t load your settings."
          body="Check your connection and reload the page. If it keeps happening, tell an ACE admin."
          action={{ href: '/settings', label: 'Try again' }}
        />
      </SettingsShell>
    );
  }

  if (!userProfile) {
    return (
      <SettingsShell>
        <StateBlock
          title="Your ACE profile isn’t set up yet."
          body={`You’re signed in as ${authUser.email ?? 'your SASTRA account'}, but no member profile is linked to it. Sign out and sign in again to finish setting it up.`}
          action={{ href: '/', label: 'Back to home' }}
        />
      </SettingsShell>
    );
  }

  const record: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Name', value: userProfile.name },
    { label: 'Register number', value: userProfile.registrationNumber, mono: true },
    { label: 'Department', value: userProfile.department },
    { label: userProfile.year != null && userProfile.year > 10 ? 'Batch' : 'Year', value: userProfile.year != null ? String(userProfile.year) : '', mono: true },
    { label: 'Email', value: authUser.email ?? '' },
    {
      label: 'Rating',
      value: userProfile.currentRating != null ? String(userProfile.currentRating) : 'Not rated yet',
      mono: userProfile.currentRating != null,
    },
  ];

  return (
    <SettingsShell>
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
        {/* Member record */}
        <section aria-labelledby="record-heading" className="lg:col-span-7">
          <div className="flex items-baseline justify-between gap-6 border-b border-foreground pb-4">
            <h2 id="record-heading" className="text-2xl font-semibold tracking-[-0.02em]">
              Member record
            </h2>
            <Link
              href={`/user/${userProfile.id}`}
              className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-foreground"
            >
              Public profile
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <dl>
            {record.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] items-baseline gap-4 border-b border-border py-5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:py-6"
              >
                <dt className="label text-muted-foreground">{row.label}</dt>
                <dd className={row.mono ? 'min-w-0 break-words font-mono text-lg tabular' : 'min-w-0 break-words text-lg font-semibold'}>
                  {row.value || <span className="font-normal text-muted-foreground">Not on record</span>}
                </dd>
                <Lock aria-hidden="true" className="hidden size-3.5 text-muted-foreground sm:block" />
              </div>
            ))}
          </dl>

          <p className="mt-5 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
            <Lock aria-hidden="true" className="mr-1.5 inline size-3.5 align-[-2px]" />
            These come from your SASTRA records and only an ACE admin can change them. If something is wrong, use the
            contact form on the{' '}
            <Link href="/#contact" className="font-semibold text-foreground underline decoration-1 underline-offset-4 hover:text-primary">
              home page
            </Link>
            .
          </p>
        </section>

        {/* Editable */}
        <section aria-labelledby="contact-heading" className="lg:col-span-4 lg:col-start-9">
          <div className="lg:sticky lg:top-28">
            <h2 id="contact-heading" className="border-b border-foreground pb-4 text-2xl font-semibold tracking-[-0.02em]">
              Contact
            </h2>
            <p className="mt-5 max-w-[44ch] leading-relaxed text-muted-foreground">
              Organisers use this number to reach you about events you register for. It is never shown on your public profile.
            </p>
            <UpdateContactForm userId={userProfile.id} initialContactNumber={userProfile.contactNumber} />
          </div>
        </section>
      </div>
    </SettingsShell>
  );
}

function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1600px] px-5 pb-24 sm:px-8 sm:pb-36">
      <header className="mb-12 border-b border-border pb-10 pt-10 sm:mb-16 sm:pt-16">
        <h1 className="font-display text-[clamp(3rem,8vw,7.5rem)]">Settings</h1>
      </header>
      {children}
    </div>
  );
}

function StateBlock({ title, body, action }: { title: string; body: string; action: { href: string; label: string } }) {
  return (
    <div className="grid gap-8 border-b border-border pb-16 lg:grid-cols-12">
      <p className="text-[clamp(1.75rem,4vw,3.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] [font-stretch:110%] lg:col-span-7">
        {title}
      </p>
      <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
        <p className="text-lg leading-snug text-muted-foreground">{body}</p>
        <Link
          href={action.href}
          className="group mt-6 inline-flex h-12 items-center justify-between gap-8 border border-foreground/25 px-5 font-semibold transition-colors hover:bg-foreground hover:text-background"
        >
          {action.label}
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
