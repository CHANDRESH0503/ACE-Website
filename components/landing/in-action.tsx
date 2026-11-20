"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { CodeMatrixACE } from "./code-matrix-ace";

/**
 * Pinned scroll moment: a giant sheened word sits behind a small window onto a live
 * code-matrix "ACE"; as the section scrolls the window opens to fill the viewport,
 * then a caption lands.
 */
export function InAction({ count, since }: { count: number | null; since: number | null }) {
  const sectionRef = useRef<HTMLElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLSpanElement>(null);
  const actRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const update = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = reduce ? 1 : Math.min(1, Math.max(0, -r.top / total));
      const open = ease(Math.min(1, p / 0.7));
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Start card, centred; the CSS vars keep the split word in step with it.
      const w0 = Math.min(Math.max(vw * 0.26, 220), 420);
      const h0 = Math.min(vh * 0.34, 340);
      section.style.setProperty("--w0", `${w0}px`);
      section.style.setProperty("--h0", `${h0}px`);
      const insetX = ((vw - w0) / 2) * (1 - open);
      const insetY = ((vh - h0) / 2) * (1 - open);
      if (clipRef.current) clipRef.current.style.clipPath = `inset(${insetY}px ${insetX}px ${insetY}px ${insetX}px)`;
      if (imgRef.current) imgRef.current.style.transform = `scale(${1.35 - open * 0.35})`;
      // The word rides the window's corners outward, so the window never covers it.
      const dx = ((vw - w0) / 2) * open;
      const dy = ((vh - h0) / 2) * open;
      if (inRef.current) inRef.current.style.transform = `translate3d(${dx}px, ${-dy}px, 0)`;
      if (actRef.current) actRef.current.style.transform = `translate3d(${-dx}px, ${dy}px, 0)`;
      if (capRef.current) {
        const c = Math.min(1, Math.max(0, (p - 0.72) / 0.18));
        capRef.current.style.opacity = String(c);
        capRef.current.style.transform = `translate3d(0, ${(1 - c) * 30}px, 0)`;
      }
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
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="in-action-title" className="relative h-[260vh] motion-reduce:h-auto">
      <div className="sticky top-0 h-[100svh] overflow-hidden motion-reduce:relative">
        <p id="in-action-title" className="ia-word absolute inset-0 font-display leading-[0.86]">
          <span ref={inRef} className="ia-in sheen-text">
            In
          </span>{" "}
          <span ref={actRef} className="ia-act sheen-text">
            action
          </span>
        </p>
        <div ref={clipRef} className="absolute inset-0 will-change-[clip-path]" style={{ clipPath: "inset(33% max(37%, calc(50% - 110px)) 33% max(37%, calc(50% - 110px)))" }}>
          <div ref={imgRef} className="absolute inset-0 will-change-transform">
            <CodeMatrixACE className="absolute inset-0 h-full w-full" />
          </div>
          <div ref={capRef} className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto flex max-w-[1600px] flex-col gap-6 px-5 pb-10 text-signal-foreground opacity-0 sm:px-8 sm:pb-14 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-3xl bg-signal/0 text-[clamp(1.75rem,3.6vw,3.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] [font-stretch:110%]">
              {count ? `${count} events since ${since ?? 2024}.` : "Contests, workshops and talks."} Run by students, for the School of Computing.
            </p>
            <Link
              href="/events"
              className="group pointer-events-auto inline-flex h-14 w-fit shrink-0 items-center gap-8 bg-signal-foreground px-6 font-semibold text-signal transition-colors hover:bg-white hover:text-signal-foreground"
            >
              See the archive
              <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
