"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One-time-per-session preloader: a counter runs 000 → 100 while the mark's
 * particles are prepared, then the panel wipes upward to reveal the hero.
 * Skipped (before first paint) for repeat visits and reduced motion via the
 * inline script in the root layout, which adds `.no-preload` to <html>.
 */
export function Preloader() {
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("no-preload")) {
      setGone(true);
      return;
    }
    root.classList.add("is-preloading");
    window.__lenis?.stop();

    const DURATION = 1600;
    const start = performance.now();
    let raf = 0;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      const v = Math.round(ease(p) * 100);
      if (countRef.current) countRef.current.textContent = String(v).padStart(3, "0");
      if (barRef.current) barRef.current.style.transform = `scaleX(${ease(p)})`;
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setLeaving(true);
        root.classList.remove("is-preloading");
        window.__lenis?.start();
        try {
          sessionStorage.setItem("ace-loaded", "1");
        } catch {}
        window.setTimeout(() => setGone(true), 1100);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("is-preloading");
      window.__lenis?.start();
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      className={`preloader fixed inset-0 z-[100] flex flex-col justify-between bg-foreground p-5 text-background transition-[clip-path] duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] sm:p-8 ${
        leaving ? "[clip-path:inset(0_0_100%_0)]" : "[clip-path:inset(0_0_0_0)]"
      }`}
    >
      <div className="flex items-start justify-between label">
        <span>Association of Computing Engineers</span>
        <span className="hidden sm:inline">SoC · SASTRA</span>
      </div>
      <div>
        <div className="flex items-end justify-between gap-6">
          <span className="font-display text-[22vw] leading-[0.8] sm:text-[16vw]">ACE</span>
          <span ref={countRef} className="font-mono tabular text-[9vw] leading-none sm:text-[5vw]">
            000
          </span>
        </div>
        <div className="mt-6 h-px w-full bg-background/20">
          <div ref={barRef} className="h-px w-full origin-left scale-x-0 bg-[hsl(var(--signal))]" />
        </div>
      </div>
    </div>
  );
}
