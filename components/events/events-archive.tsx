"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { SupabaseEvent } from "@/lib/services/events";

const TYPES = [
  { key: "ALL", label: "All" },
  { key: "CONTEST", label: "Contests" },
  { key: "WORKSHOP", label: "Workshops" },
  { key: "TALK", label: "Talks" },
] as const;

const typeLabel: Record<string, string> = { CONTEST: "Contest", WORKSHOP: "Workshop", TALK: "Talk" };

const IST = "Asia/Kolkata";
function fmt(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-GB", { day: "2-digit", timeZone: IST }),
    month: d.toLocaleDateString("en-GB", { month: "short", timeZone: IST }).toUpperCase(),
    year: Number(d.toLocaleDateString("en-GB", { year: "numeric", timeZone: IST })),
  };
}

type Ev = SupabaseEvent & { poster: string | null };

/** Columns that drift at different speeds as the wall scrolls. */
function ParallaxColumns({ children, count }: { children: React.ReactNode[]; count: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cols = Array.from(wrap.children) as HTMLElement[];
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const p = (window.innerHeight - r.top) / (window.innerHeight + r.height); // 0..1 through view
      cols.forEach((c, i) => {
        const speed = [0, -90, 40][i % 3];
        c.style.transform = `translate3d(0, ${(p - 0.5) * speed * 2}px, 0)`;
      });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, [count]);
  const cols: React.ReactNode[][] = [[], [], []];
  children.forEach((c, i) => cols[i % 3].push(c));
  return (
    <div ref={wrapRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cols.map((col, i) => (
        <div key={i} className={`flex flex-col gap-10 will-change-transform ${i === 2 ? "hidden lg:flex" : ""} ${i === 1 ? "lg:pt-24" : ""}`}>
          {col}
        </div>
      ))}
    </div>
  );
}

export function EventsArchive({ events }: { events: Ev[] }) {
  const [type, setType] = useState<(typeof TYPES)[number]["key"]>("ALL");
  const [year, setYear] = useState<number | "ALL">("ALL");
  const [view, setView] = useState<"index" | "posters">("index");
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const markFailed = (src: string | null) =>
    src && setFailed((f) => (f.has(src) ? f : new Set(f).add(src)));
  const ok = (src: string | null) => (src && !failed.has(src) ? src : null);

  // The row crossing the middle of the viewport drives each chapter's pinned poster.
  const [activeId, setActiveId] = useState<string | null>(null);
  const indexRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = indexRef.current;
    if (!root) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActiveId((e.target as HTMLElement).dataset.row ?? null);
      },
      { rootMargin: "-48% 0px -48% 0px" }
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, [view, type, year]);

  const years = useMemo(
    () => Array.from(new Set(events.map((e) => fmt(e.startTime).year))).sort((a, b) => b - a),
    [events]
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: events.length };
    events.forEach((e) => (c[e.type] = (c[e.type] ?? 0) + 1));
    return c;
  }, [events]);

  const filtered = useMemo(
    () =>
      events.filter(
        (e) => (type === "ALL" || e.type === type) && (year === "ALL" || fmt(e.startTime).year === year)
      ),
    [events, type, year]
  );

  const byYear = useMemo(() => {
    const m = new Map<number, Ev[]>();
    filtered.forEach((e) => {
      const y = fmt(e.startTime).year;
      m.set(y, [...(m.get(y) ?? []), e]);
    });
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  // Wall columns need a third column on wide screens; on two-column screens fold it back in.
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const chip = (on: boolean) =>
    `h-10 shrink-0 border px-4 text-sm font-semibold transition-colors ${
      on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
    }`;

  return (
    <section aria-labelledby="archive-title" className="relative">
      <h2 id="archive-title" className="sr-only">
        Event archive
      </h2>

      {/* Filters */}
      <div className="below-nav sticky z-20 -mx-5 border-y border-border bg-background px-5 py-3 sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:justify-between">
          <div className="scrollbar-hide -mx-1 order-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pr-8 [mask-image:linear-gradient(to_right,#000_85%,transparent)] sm:w-auto sm:pr-1 sm:[mask-image:none]" role="group" aria-label="Filter by type">
            {TYPES.map((t) => (
              <button key={t.key} type="button" aria-pressed={type === t.key} onClick={() => setType(t.key)} className={chip(type === t.key)}>
                {t.label} <span className="ml-1 font-mono text-xs tabular opacity-70">{counts[t.key] ?? 0}</span>
              </button>
            ))}
          </div>
            <div className="order-2 flex shrink-0 border-l border-border pl-3 sm:order-3 sm:pl-4" role="group" aria-label="View">
              {(["index", "posters"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`h-10 px-3 text-sm font-semibold capitalize transition-colors ${view === v ? "text-foreground underline decoration-primary decoration-2 underline-offset-8" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          <div className="order-3 flex w-full items-center gap-2 sm:order-2 sm:ml-auto sm:w-auto">
            <div className="scrollbar-hide flex gap-2 overflow-x-auto pr-6 [mask-image:linear-gradient(to_right,#000_85%,transparent)] sm:pr-0 sm:[mask-image:none]" role="group" aria-label="Filter by year">
              <button type="button" aria-pressed={year === "ALL"} onClick={() => setYear("ALL")} className={chip(year === "ALL")}>
                All years
              </button>
              {years.map((y) => (
                <button key={y} type="button" aria-pressed={year === y} onClick={() => setYear(y)} className={`${chip(year === y)} font-mono tabular`}>
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border-b border-border py-24">
          <p className="text-2xl font-semibold tracking-[-0.02em]">No events match those filters.</p>
          <button type="button" onClick={() => { setType("ALL"); setYear("ALL"); }} className="mt-4 font-semibold underline decoration-border underline-offset-4 hover:decoration-primary">
            Clear filters
          </button>
        </div>
      ) : view === "index" ? (
        <div ref={indexRef}>
          {byYear.map(([y, list]) => (
            <div key={y} className="grid gap-6 border-b border-border py-14 lg:grid-cols-12 lg:gap-8 lg:py-20">
              <div className="lg:col-span-3">
                <div className="lg:sticky lg:top-40">
                  <p data-reveal className="font-display text-[clamp(3.5rem,5.8vw,6rem)] tabular">
                    <span className="reveal-line">
                      <span>{y}</span>
                    </span>
                  </p>
                  <p className="mt-3 label text-muted-foreground">
                    {list.length} {list.length === 1 ? "event" : "events"}
                  </p>
                  {(() => {
                    const cur = list.find((e) => e.id === activeId) ?? list[0];
                    return (
                      <div className="relative mt-8 hidden aspect-[4/5] w-full max-w-[280px] overflow-hidden bg-muted lg:block" aria-hidden="true">
                        {list.map((e) => {
                          const src = ok(e.poster);
                          const on = e.id === cur.id;
                          return (
                            <div
                              key={e.id}
                              className={`absolute inset-0 transition-[clip-path,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                on ? "z-10 scale-100 [clip-path:inset(0_0_0_0)]" : "z-0 scale-105 [clip-path:inset(100%_0_0_0)]"
                              }`}
                            >
                              {src ? (
                                <Image src={src} alt="" fill sizes="280px" className="object-cover" onError={() => markFailed(e.poster)} />
                              ) : (
                                <div className="grid h-full place-items-center p-6 text-center text-2xl font-extrabold leading-tight tracking-[-0.03em] [font-stretch:108%]">
                                  {e.name.trim()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <span className="absolute bottom-3 left-3 z-20 bg-background px-2 py-1 font-mono text-xs tabular">
                          {fmt(cur.startTime).day} {fmt(cur.startTime).month}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <ol className="border-t border-border lg:col-span-9">
                {list.map((e, i) => {
                  const d = fmt(e.startTime);
                  return (
                    <li key={e.id} data-row={e.id} data-fade style={{ ["--d" as string]: `${Math.min(i, 6) * 0.04}s` }} className="border-b border-border">
                      <Link
                        href={`/events/${e.id}`}
                        className="group grid grid-cols-[3.5rem_3.25rem_1fr] items-center gap-4 py-5 sm:grid-cols-[4.5rem_7rem_1fr_minmax(0,12rem)_auto] sm:gap-6"
                      >
                        <span className="relative block aspect-[4/5] w-14 overflow-hidden bg-muted sm:hidden">
                          {ok(e.poster) ? (
                            <Image src={ok(e.poster)!} alt="" fill sizes="56px" className="object-cover" onError={() => markFailed(e.poster)} />
                          ) : (
                            <span className="grid h-full place-items-center text-[10px] font-bold">ACE</span>
                          )}
                        </span>
                        <span className="font-mono tabular leading-none">
                          <span className="block text-2xl font-medium sm:text-3xl">{d.day}</span>
                          <span className="mt-1 block text-[11px] tracking-[0.1em] text-muted-foreground">{d.month}</span>
                        </span>
                        <span className="hidden label text-primary sm:block">{typeLabel[e.type] ?? e.type}</span>
                        <span className="min-w-0">
                          <span className="block text-xl font-bold leading-tight tracking-[-0.03em] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] [font-stretch:106%] group-hover:translate-x-2 sm:text-3xl">
                            {e.name.trim()}
                          </span>
                          <span className="mt-1 block truncate text-sm text-muted-foreground sm:hidden">
                            {typeLabel[e.type] ?? e.type} · {e.location}
                          </span>
                        </span>
                        <span className="hidden truncate text-sm text-muted-foreground sm:block">{e.location}</span>
                        <ArrowUpRight className="hidden size-6 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 sm:block" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16">
          {wide ? (
            <ParallaxColumns count={filtered.length}>
              {filtered.map((e) => (
                <PosterCard key={e.id} e={e} />
              ))}
            </ParallaxColumns>
          ) : (
            <div className="grid gap-10 sm:grid-cols-2">
              {filtered.map((e) => (
                <PosterCard key={e.id} e={e} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PosterCard({ e }: { e: Ev }) {
  const d = fmt(e.startTime);
  const [broken, setBroken] = useState(false);
  return (
    <Link href={`/events/${e.id}`} className="group block">
      <div data-clip className="relative aspect-[4/5] overflow-hidden bg-muted">
        {e.poster && !broken ? (
          <Image src={e.poster} alt={`${e.name.trim()} poster`} onError={() => setBroken(true)} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]" />
        ) : (
          <div className="grid h-full place-items-center border border-border p-8 text-center text-4xl font-extrabold leading-[0.95] tracking-[-0.04em] [font-stretch:110%]">{e.name.trim()}</div>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="text-xl font-bold leading-tight tracking-[-0.03em] [font-stretch:106%] group-hover:text-primary">{e.name.trim()}</h3>
        <span className="shrink-0 font-mono text-xs tabular text-muted-foreground">
          {d.day} {d.month} {d.year}
        </span>
      </div>
      <p className="mt-1 label text-muted-foreground">{typeLabel[e.type] ?? e.type} · {e.location}</p>
    </Link>
  );
}
