"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";

export interface ReadoutEvent {
  id: string;
  name: string;
  type: string;
  location: string | null;
  startTime: string;
}

const typeLabel: Record<string, string> = { CONTEST: "Contest", WORKSHOP: "Workshop", TALK: "Talk" };
const IST = "Asia/Kolkata";
const HOLD = 3400;
const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGIT = "0123456789";
// Swap a character for a random one of the same kind, so the line keeps its width while it decodes.
const scramble = (c: string) => {
  const set = /[A-Z]/.test(c) ? UPPER : /[a-z]/.test(c) ? LOWER : /[0-9]/.test(c) ? DIGIT : null;
  return set ? set[(Math.random() * set.length) | 0] : c;
};

const dateOf = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: IST }).toUpperCase();
const yearOf = (iso: string) => Number(new Date(iso).toLocaleDateString("en-GB", { year: "numeric", timeZone: IST }));

/** Resolves a string left to right out of random glyphs. */
function useDecode(text: string, run: boolean) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!run) {
      setOut(text);
      return;
    }
    const t0 = performance.now();
    const dur = Math.min(900, 260 + text.length * 22);
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const settled = Math.floor(p * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        s += i < settled ? c : scramble(c);
      }
      setOut(s);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, run]);
  return out;
}

/**
 * The archive as an instrument: every event is a tick on a time axis, a scan line
 * walks back through them, and the readout above decodes the event under the line.
 */
export function ArchiveReadout({ events }: { events: ReadoutEvent[] }) {
  const n = events.length;
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(true);
  const [reduce, setReduce] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && !document.hidden), { threshold: 0.15 });
    io.observe(el);
    const onVis = () => setInView(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Whole calendar years, so year marks fall on clean boundaries.
  const { pos, years, months } = useMemo(() => {
    const ys = events.map((e) => yearOf(e.startTime));
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys) + 1;
    const a = Date.UTC(y0, 0, 1);
    const b = Date.UTC(y1, 0, 1);
    const at = (t: number) => 1 + ((t - a) / (b - a)) * 98; // keep 1% clear at each end
    const years = Array.from({ length: y1 - y0 }, (_, i) => ({ y: y0 + i, x: at(Date.UTC(y0 + i, 0, 1)) }));
    const months: number[] = [];
    for (let y = y0; y < y1; y++) for (let m = 1; m < 12; m++) months.push(at(Date.UTC(y, m, 1)));
    return { pos: events.map((e) => at(+new Date(e.startTime))), years, months };
  }, [events]);

  const next = useCallback(() => setActive((i) => (i + 1) % n), [n]);
  const prev = useCallback(() => setActive((i) => (i - 1 + n) % n), [n]);

  const playing = n > 1 && !reduce && !userPaused && !hover && inView;
  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(next, HOLD);
    return () => window.clearTimeout(id);
  }, [playing, next, active]);

  const pick = (clientX: number) => {
    const r = stripRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((clientX - r.left) / r.width) * 100;
    let best = 0;
    pos.forEach((p, i) => {
      if (Math.abs(p - x) < Math.abs(pos[best] - x)) best = i;
    });
    setActive(best);
  };

  const cur = events[active];
  const name = useDecode(cur.name.trim(), !reduce);
  const x = pos[active];
  const pad = (v: number) => String(v).padStart(2, "0");

  return (
    <div
      ref={rootRef}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHover(false);
      }}
      className="border-t border-foreground"
    >
      {/* Readout */}
      <div className="grid gap-x-8 gap-y-5 pt-5 lg:grid-cols-12">
        <div className="flex items-center justify-between gap-4 lg:col-span-12">
          <p className="label flex min-w-0 items-center gap-3">
            <span className="size-1.5 shrink-0 bg-primary" />
            <span className="text-primary">{typeLabel[cur.type] ?? cur.type}</span>
            {cur.location && <span className="truncate text-muted-foreground">{cur.location}</span>}
          </p>
          <p className="shrink-0 font-mono text-xs tabular tracking-[0.06em] text-muted-foreground">
            <span className="text-foreground">{pad(active + 1)}</span> / {pad(n)}
          </p>
        </div>

        <Link
          href={`/events/${cur.id}`}
          aria-label={`${cur.name.trim()}, ${typeLabel[cur.type] ?? cur.type}, ${dateOf(cur.startTime)}`}
          className="group block min-w-0 lg:col-span-9"
        >
          <span
            aria-hidden="true"
            className="line-clamp-3 min-h-[2.85em] text-[clamp(2rem,5.4vw,4.75rem)] font-bold leading-[0.95] tracking-[-0.04em] [font-stretch:108%] transition-colors duration-300 group-hover:text-primary sm:line-clamp-2 sm:min-h-[1.9em]"
          >
            {name}
            <ArrowUpRight className="ml-[0.15em] inline-block size-[0.55em] align-[0.05em] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:translate-x-1" />
          </span>
        </Link>

        <div className="flex items-end justify-between gap-4 lg:col-span-3 lg:flex-col lg:items-end lg:justify-start">
          <p className="font-mono text-[clamp(1rem,1.6vw,1.5rem)] tabular tracking-[0.06em]">{dateOf(cur.startTime)}</p>
          {n > 1 && (
            <div className="flex">
              <button type="button" onClick={prev} aria-label="Previous event" className="grid size-12 place-items-center border border-border transition-colors hover:border-foreground hover:bg-foreground hover:text-background">
                <ArrowLeft className="size-5" />
              </button>
              {!reduce && (
                <button
                  type="button"
                  onClick={() => setUserPaused((p) => !p)}
                  aria-label={userPaused ? "Resume the scan" : "Pause the scan"}
                  aria-pressed={userPaused}
                  className="-ml-px grid size-12 place-items-center border border-border transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                >
                  {userPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
                </button>
              )}
              <button type="button" onClick={next} aria-label="Next event" className="-ml-px grid size-12 place-items-center border border-border transition-colors hover:border-foreground hover:bg-foreground hover:text-background">
                <ArrowRight className="size-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Time axis: one tick per event */}
      <div
        ref={stripRef}
        aria-hidden="true"
        onPointerMove={(e) => e.pointerType === "mouse" && pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        className="relative mt-8 h-32 cursor-crosshair touch-pan-y select-none sm:h-36"
      >
        <span className="absolute inset-x-0 bottom-8 h-px bg-border" />
        {months.map((m, i) => (
          <span key={i} className="absolute bottom-8 h-2 w-px bg-border" style={{ left: `${m}%` }} />
        ))}
        {years.map((y) => (
          <span key={y.y} className="absolute bottom-0 font-mono text-xs tabular tracking-[0.06em] text-muted-foreground" style={{ left: `${y.x}%` }}>
            <span className="absolute bottom-full left-0 mb-1 h-5 w-px bg-foreground/60" />
            <span className="pl-2">{y.y}</span>
          </span>
        ))}
        {pos.map((p, i) => (
          <span
            key={events[i].id}
            className={`absolute bottom-8 w-px transition-[height,background-color] duration-500 ${
              i === active ? "h-0" : events[i].type === cur.type ? "h-12 bg-foreground/70 sm:h-14" : "h-8 bg-foreground/35 sm:h-10"
            }`}
            style={{ left: `${p}%` }}
          />
        ))}
        {/* Scan head */}
        <span
          className="absolute bottom-8 top-0 w-px bg-primary"
          style={{ left: `${x}%`, transition: reduce ? "none" : `left 900ms ${EXPO}` }}
        >
          <span className="absolute left-0 top-0 size-1.5 -translate-x-1/2 bg-primary" />
        </span>
      </div>
    </div>
  );
}
