"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseEvent } from "@/lib/services/events";
import { ArchiveReadout } from "@/components/events/archive-readout";
import { EventsArchive } from "@/components/events/events-archive";
import { VelocityMarquee } from "@/components/landing/velocity-marquee";

interface EventsClientPageProps {
  initialEvents: SupabaseEvent[];
  errorFetching?: string | null;
}

export default function EventsClientPage({ initialEvents, errorFetching }: EventsClientPageProps) {
  const supabase = createClient();

  const posterUrl = useCallback(
    (raw: string | null) => {
      const imgUrl = raw?.trim();
      return imgUrl ? (/^https?:\/\//.test(imgUrl) ? imgUrl : supabase.storage.from("event-images").getPublicUrl(imgUrl).data.publicUrl) : null;
    },
    [supabase.storage]
  );

  const events = useMemo(
    () =>
      (initialEvents ?? [])
        .slice()
        .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime))
        .map((e) => ({ ...e, poster: posterUrl(e.imgUrl) })),
    [initialEvents, posterUrl]
  );

  const since = events.length ? new Date(events[events.length - 1].startTime).getFullYear() : null;

  if (errorFetching) {
    return (
      <div className="mx-auto flex min-h-[70svh] max-w-[1600px] flex-col justify-center px-5 sm:px-8">
        <h1 className="font-display text-[clamp(3rem,10vw,8rem)]">Events</h1>
        <p className="mt-6 text-2xl font-semibold tracking-[-0.02em]">We couldn&apos;t load past events.</p>
        <p className="mt-2 text-muted-foreground">Check your connection and refresh the page in a moment.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-clip">
      {/* Hero: headline and actions on top, the archive as a scanned time axis below */}
      <section
        aria-labelledby="events-title"
        className="relative mx-auto flex w-full max-w-[1600px] flex-col px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:min-h-[calc(100svh-4rem)] lg:pb-20 lg:pt-16"
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <h1 id="events-title" data-reveal className="font-display text-[clamp(3.1rem,13vw,4.75rem)] leading-[0.86] [font-stretch:100%] sm:text-[clamp(4rem,9vw,6.5rem)] sm:[font-stretch:112%] lg:col-span-8 lg:text-[clamp(5rem,7.4vw,8rem)]">
            <span className="reveal-line">
              <span>Every event,</span>
            </span>
            <span className="reveal-line">
              <span className="text-primary">on record.</span>
            </span>
          </h1>
          <div className="lg:col-span-4 lg:pb-2">
            <p data-fade style={{ ["--d" as string]: ".1s" }} className="max-w-[34rem] text-lg leading-snug text-muted-foreground sm:text-xl">
              {events.length > 0 ? (
                <>
                  <span className="text-foreground">
                    <span className="font-mono tabular">{events.length}</span> contests, workshops and talks
                  </span>{" "}
                  since <span className="font-mono tabular">{since}</span>, run by ACE for the School of Computing.
                </>
              ) : (
                "Contests, workshops and talks run by ACE for the School of Computing."
              )}
            </p>
            <div data-fade style={{ ["--d" as string]: ".2s" }} className="mt-8 flex flex-col gap-3 sm:flex-row lg:max-w-[22rem] lg:flex-col">
              <Link
                href="/events/upcoming"
                className="group inline-flex h-14 items-center whitespace-nowrap justify-between sm:flex-1 lg:flex-none gap-6 bg-primary px-6 font-semibold text-primary-foreground transition-[background-color,color,transform] duration-300 hover:bg-foreground hover:text-background active:scale-[0.98]"
              >
                See what&apos;s open
                <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#archive"
                className="group inline-flex h-14 items-center whitespace-nowrap justify-between sm:flex-1 lg:flex-none gap-6 border border-foreground/25 px-6 font-semibold transition-colors duration-300 hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Browse the archive
                <ArrowDown className="size-5 transition-transform duration-300 group-hover:translate-y-1" />
              </a>
            </div>
          </div>
        </div>

        {events.length > 0 && (
          <div data-fade style={{ ["--d" as string]: ".3s" }} className="mt-16 lg:mt-auto lg:pt-16">
            <ArchiveReadout events={events} />
          </div>
        )}
      </section>

      {/* Tilted ticker of real event names */}
      {events.length > 0 && (
        <div aria-hidden="true" className="relative z-10 -mx-4 -rotate-2 select-none overflow-hidden bg-signal py-4 text-signal-foreground">
          <VelocityMarquee base={70}>
            {events.slice(0, 14).map((e) => (
              <span key={e.id} className="flex items-center gap-8 pr-8">
                <span className="whitespace-nowrap text-[clamp(1.5rem,3vw,2.75rem)] font-extrabold tracking-[-0.04em] [font-stretch:112%]">
                  {e.name.trim()}
                </span>
                <span className="size-2.5 bg-signal-foreground" />
              </span>
            ))}
          </VelocityMarquee>
        </div>
      )}

      <div id="archive" className="mx-auto max-w-[1600px] scroll-mt-16 px-5 pb-24 pt-20 sm:px-8 sm:pb-36 sm:pt-28">
        {events.length === 0 ? (
          <p className="border-y border-border py-16 text-2xl font-semibold tracking-[-0.02em]">
            No past events yet. The first ones will appear here.
          </p>
        ) : (
          <EventsArchive events={events} />
        )}
      </div>
    </div>
  );
}
