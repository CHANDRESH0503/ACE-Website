"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/components/context/AuthContext";
import { clusters } from "@/lib/ace-content";
import { ParticleMark } from "@/components/landing/particle-mark";
import { Preloader } from "@/components/landing/preloader";
import { SurveyFrame } from "@/components/landing/survey-frame";
import { eventTypeLabel, formatEventDate, useOpenEvents } from "@/components/landing/use-open-events";

function useCampusClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Kolkata",
        hour12: false,
      });
    setNow(fmt());
    const id = window.setInterval(() => setNow(fmt()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function NextEventLine() {
  const { status, events } = useOpenEvents(1);
  const next = events[0];

  if (status === "loading") {
    return (
      <span className="label text-muted-foreground">
        Checking the calendar…
      </span>
    );
  }

  if (!next) {
    return (
      <Link
        href="/events"
        className="group inline-flex items-center gap-2 label text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="size-1.5 bg-muted-foreground" />
        No open registrations right now. See past events
        <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
    );
  }

  const d = formatEventDate(next.startTime);
  return (
    <Link
      href={`/events/${next.id}`}
      className="group inline-flex max-w-full items-center gap-3 label"
    >
      <span className="live-dot size-1.5 shrink-0 bg-primary" />
      <span className="text-primary">Open</span>
      <span className="truncate text-foreground">
        {eventTypeLabel[next.type] ?? next.type} · {next.name}
      </span>
      <span className="hidden shrink-0 font-mono font-normal tracking-[0.06em] text-muted-foreground sm:inline">
        {d.day} {d.month} · {d.time} IST
      </span>
      <ArrowUpRight className="size-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

export const HeroSection = () => {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const clock = useCampusClock();

  const primaryLabel = user ? "View your profile" : "Sign in with SASTRA";
  const onPrimary = () => (user ? router.push(`/user/${user.id}`) : login());

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative -mt-16 flex min-h-[100svh] flex-col overflow-hidden"
    >
      <Preloader />
      <SurveyFrame />
      <ParticleMark className="pointer-events-none absolute inset-0" />

      {/* Corner data */}
      <div data-field-top className="relative z-10 mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-4 px-5 pt-24 label text-muted-foreground sm:px-8 lg:grid-cols-4 lg:pt-28">
        <p data-hero-fade style={{ ["--d" as string]: ".15s" }}>
          School of Computing
          <br />
          SASTRA Deemed University
        </p>
        <p data-hero-fade className="text-right lg:text-left" style={{ ["--d" as string]: ".25s" }}>
          <span className="font-mono font-normal tracking-[0.06em]">10.73° N, 79.02° E</span>
          <br />
          Thanjavur, Tamil Nadu
        </p>
        <p data-hero-fade className="hidden lg:block" style={{ ["--d" as string]: ".35s" }}>
          Campus time
          <br />
          <span className="font-mono font-normal tabular tracking-[0.06em] text-foreground">{clock ?? "--:--:--"} IST</span>
        </p>
        <p data-hero-fade className="hidden text-right lg:block" style={{ ["--d" as string]: ".45s" }}>
          Code · Build · Progress
          <br />
          A student-run club
        </p>
      </div>

      <div data-exit className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col items-center justify-center px-5 pb-6 pt-6 text-center sm:px-8">
        <div data-mark-slot aria-hidden="true" className="pointer-events-none aspect-square w-[min(68vw,36svh,380px)]" />
        <h1
          id="hero-title"
          data-reveal
          className="hero-title diag-reveal mt-2 font-display text-[11.6vw] text-foreground sm:text-[clamp(2.4rem,6.2vw,6.25rem)]"
        >
          <span className="reveal-line">
            <span>
              Association<span className="hidden sm:inline"> of</span>
            </span>
          </span>
          <span className="reveal-line">
            <span>
              <span className="sm:hidden">of </span>Computing <span className="text-primary">Engineers</span>
            </span>
          </span>
        </h1>
        <p
          data-hero-fade
          style={{ ["--d" as string]: ".55s" }}
          className="mx-auto mt-5 max-w-xl text-lg leading-snug text-foreground/85"
        >
          The official club of SASTRA&apos;s School of Computing: a student-run home for contests,
          workshops, talks and research, with {clusters.length} clusters to grow in.
        </p>
        <div data-hero-fade style={{ ["--d" as string]: ".7s" }} className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={onPrimary}
            disabled={loading}
            className="group inline-flex h-14 items-center justify-between gap-6 bg-primary px-6 text-base font-semibold text-primary-foreground transition-[background-color,transform] duration-300 hover:bg-foreground hover:text-background active:scale-[0.98] disabled:opacity-60 sm:min-w-64"
          >
            {primaryLabel}
            <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <Link
            href="/events/upcoming"
            className="group inline-flex h-14 items-center justify-between gap-6 border border-foreground/25 bg-background/60 px-6 text-base font-semibold transition-colors duration-300 hover:border-foreground hover:bg-foreground hover:text-background sm:min-w-56"
          >
            Upcoming events
            <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div
        data-hero-fade
        style={{ ["--d" as string]: ".85s" }}
        className="relative z-10 mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-5 pb-8 sm:px-8"
      >
        <NextEventLine />
        <a
          href="#about"
          className="hidden shrink-0 items-center gap-2 label text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          Scroll to explore
          <ArrowDownRight className="size-3.5" />
        </a>
      </div>
    </section>
  );
};
