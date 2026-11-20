"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { eventTypeLabel, formatEventDate, useOpenEvents } from "./use-open-events";

export function OpenEvents() {
  const { status, events } = useOpenEvents(4);

  if (status === "loading") {
    return (
      <ul aria-busy="true" aria-label="Loading open events" className="border-t border-border">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-6 border-b border-border py-6">
            <span className="h-12 w-14 animate-pulse bg-muted" />
            <span className="h-6 flex-1 animate-pulse bg-muted" />
          </li>
        ))}
      </ul>
    );
  }

  if (events.length === 0) {
    return (
      <div className="border-y border-border py-10">
        <p className="text-2xl font-semibold tracking-[-0.02em]">
          {status === "error" ? "We couldn't load the calendar just now." : "Nothing is open for registration right now."}
        </p>
        <p className="mt-3 max-w-md text-muted-foreground">
          {status === "error"
            ? "The full events page may have more. Try again in a moment."
            : "New events land here first. Sign in so your registrations and attendance are tracked when they do."}
        </p>
        <Link
          href="/events"
          className="group mt-6 inline-flex items-center gap-2 font-semibold underline decoration-border underline-offset-4 transition-colors hover:decoration-primary"
        >
          Browse past events
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    );
  }

  return (
    <ul className="border-t border-border">
      {events.map((e) => {
        const d = formatEventDate(e.startTime);
        return (
          <li key={e.id} className="border-b border-border">
            <Link
              href={`/events/${e.id}`}
              className="group grid grid-cols-[3.5rem_1fr_auto] items-center gap-5 py-6 transition-colors sm:grid-cols-[4.5rem_7rem_1fr_auto] sm:gap-8"
            >
              <span className="font-mono tabular leading-none">
                <span className="block text-3xl font-medium sm:text-4xl">{d.day}</span>
                <span className="mt-1 block text-[11px] tracking-[0.1em] text-muted-foreground">{d.month}</span>
              </span>
              <span className="hidden label text-primary sm:block">
                {eventTypeLabel[e.type] ?? e.type}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xl font-semibold tracking-[-0.02em] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 sm:text-2xl">
                  {e.name}
                </span>
                <span className="mt-1 block truncate font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  <span className="sm:hidden">{eventTypeLabel[e.type] ?? e.type} · </span>
                  {d.weekday} {d.time} IST · {e.location}
                </span>
              </span>
              <ArrowUpRight className="size-6 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
