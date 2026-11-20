"use client";

import { useEffect, useRef } from "react";

const LETTERS = ["A", "C", "E"];
const REST = 800;
const THIN = 140;

/**
 * The footer wordmark, set in Archivo's weight axis. Letters thin out as the pointer
 * nears them (the nearest turns ACE Blue); left alone, a slow weight wave runs across
 * them. Only runs while on screen, and stays still under reduced motion.
 */
export function FooterWordmark() {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cur = LETTERS.map(() => REST);
    let px = 0,
      py = 0,
      over = false,
      raf = 0,
      t0 = performance.now();

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!over) t0 = performance.now();
      over = true;
    };
    const onLeave = () => {
      over = false;
      t0 = performance.now();
    };

    const loop = (now: number) => {
      const els = itemRefs.current;
      // Read every rect first, then write, so the frame lays out once.
      const rects = els.map((el) => el?.getBoundingClientRect());
      let nearest = -1;
      let nearestK = 0;
      const targets = rects.map((r, i) => {
        if (!r) return REST;
        if (over) {
          const dx = (px - (r.left + r.width / 2)) / r.width;
          const dy = (py - (r.top + r.height / 2)) / r.height;
          const k = Math.max(0, 1 - Math.hypot(dx, dy * 0.7) / 1.15);
          if (k > nearestK) {
            nearestK = k;
            nearest = i;
          }
          return REST - (REST - THIN) * k * k * (3 - 2 * k);
        }
        // Idle: a wave travels left to right, easing in after the pointer leaves.
        const ease = Math.min(1, (now - t0) / 1600);
        const w = 0.5 + 0.5 * Math.sin(now / 1100 - i * 1.1);
        return REST - (REST - 360) * w * w * ease;
      });
      els.forEach((el, i) => {
        if (!el) return;
        cur[i] += (targets[i] - cur[i]) * 0.1;
        el.style.fontVariationSettings = `"wght" ${cur[i].toFixed(1)}, "wdth" 112`;
        el.classList.toggle("text-primary", i === nearest && nearestK > 0.45);
      });
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) {
        t0 = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(root);
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-letters
      className="mx-auto mt-10 flex max-w-[1600px] select-none justify-center px-5 pb-[1vw] leading-none sm:px-8"
    >
      {LETTERS.map((l, i) => (
        <span key={l} className="ltr inline-block overflow-x-visible overflow-y-clip">
          <span
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            style={{ ["--ld" as string]: `${i * 0.09}s` }}
            className="block font-display text-[min(36vw,36rem)] leading-[0.8] tracking-[-0.06em] text-foreground"
          >
            {l}
          </span>
        </span>
      ))}
    </div>
  );
}
