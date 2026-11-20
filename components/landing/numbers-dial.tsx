"use client";

import { useEffect, useRef, useState } from "react";

export interface DialStat {
  label: string;
  value: number;
  note: string;
}

const pad = (n: number) => String(n).padStart(3, "0");
const R = 46;
const C = 2 * Math.PI * R;

/**
 * Pinned instrument readout: each real figure counts up inside a radial gauge as the
 * section scrolls, then hands over to the next. Reduced motion shows a static list.
 */
export function NumbersDial({ stats }: { stats: DialStat[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [state, setState] = useState({ i: 0, t: 0 });
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(0.9999, Math.max(0, -r.top / total));
      const seg = p * stats.length;
      const i = Math.floor(seg);
      setState({ i, t: seg - i });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, [stats.length]);

  if (reduce) {
    return (
      <section aria-label="ACE in numbers" className="mx-auto grid max-w-[1600px] gap-8 px-5 py-24 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-t border-border pt-4">
            <p className="font-display text-7xl tabular">{s.value}</p>
            <p className="mt-2 font-semibold">{s.label}</p>
            <p className="text-sm text-muted-foreground">{s.note}</p>
          </div>
        ))}
      </section>
    );
  }

  const s = stats[state.i];
  const fill = Math.min(1, state.t / 0.6);
  const eased = 1 - Math.pow(1 - fill, 3);
  const shown = Math.round(s.value * eased);
  const next = stats[state.i + 1];

  return (
    <section ref={sectionRef} aria-label="ACE in numbers" className="relative" style={{ height: `${stats.length * 85 + 40}vh` }}>
      {/* Accessible static readout */}
      <ul className="sr-only">
        {stats.map((x) => (
          <li key={x.label}>
            {x.value} {x.label}: {x.note}
          </li>
        ))}
      </ul>

      <div aria-hidden="true" className="sticky top-0 grid h-[100svh] grid-rows-[auto_1fr_auto] overflow-hidden">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-5 pt-24 sm:px-8">
          <span className="label text-muted-foreground">ACE in numbers</span>
          <span className="font-mono text-xs tabular text-muted-foreground">
            {pad(state.i + 1)} / {pad(stats.length)}
          </span>
        </div>

        <div className="mx-auto grid w-full max-w-[1600px] items-center gap-6 px-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr]">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <p className="font-mono text-sm tabular text-primary">{pad(state.i + 1)}</p>
            <p key={s.label} className="mt-2 text-[clamp(1.75rem,3vw,2.75rem)] font-extrabold leading-none tracking-[-0.04em] [font-stretch:110%]">
              {s.label}
            </p>
            <p className="mx-auto mt-3 max-w-xs text-muted-foreground lg:mx-0">{s.note}</p>
          </div>

          <div className="relative order-1 mx-auto aspect-square w-[min(78vw,58vh,560px)] lg:order-2">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="50" cy="50" r={R} fill="none" stroke="hsl(var(--border))" strokeWidth="0.4" strokeDasharray="0.6 1.4" />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.1"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - eased)}
              />
              {Array.from({ length: 4 }).map((_, k) => (
                <line key={k} x1="50" y1="1" x2="50" y2="6" stroke="hsl(var(--muted-foreground))" strokeWidth="0.4" transform={`rotate(${k * 90} 50 50)`} />
              ))}
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-[clamp(5rem,15vw,12rem)] tabular leading-none">{shown}</span>
            </div>
          </div>

          <div className="order-3 hidden text-right lg:block">
            {next && (
              <>
                <p className="font-mono text-sm tabular text-muted-foreground">{pad(state.i + 2)}</p>
                <p className="mt-2 text-xl font-semibold text-muted-foreground">{next.label}</p>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1600px] px-5 pb-8 sm:px-8">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
            {stats.map((x, k) => (
              <div key={x.label} className="h-px bg-border">
                <div
                  className="h-px origin-left bg-primary"
                  style={{ transform: `scaleX(${k < state.i ? 1 : k === state.i ? state.t : 0})` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
