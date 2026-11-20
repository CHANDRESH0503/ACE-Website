"use client";

import { useEffect, useRef } from "react";

// SASTRA campus, matching the hero's corner data.
const LAT = 10.73;
const LON = 79.02;
// The crosshair readout spans about a kilometre across the hero.
const SPAN = 0.01;

const fmt = (x: number, y: number) => {
  const lat = LAT + (0.5 - y) * SPAN;
  const lon = LON + (x - 0.5) * SPAN * 1.6;
  return [`${lat.toFixed(4)}° N`, `${lon.toFixed(4)}° E`] as const;
};

/**
 * The hero's survey frame: hairline columns on the page grid that draw in on load,
 * registration crosses where the two horizontal rules meet them, tick rulers down
 * both edges, and (on fine pointers) an eased crosshair that reads the cursor out
 * as coordinates around campus. Purely decorative; hidden from assistive tech.
 */
export function SurveyFrame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const vRef = useRef<HTMLDivElement>(null);
  const hRef = useRef<HTMLDivElement>(null);
  const readRef = useRef<HTMLDivElement>(null);
  const latRef = useRef<HTMLSpanElement>(null);
  const lonRef = useRef<HTMLSpanElement>(null);
  const tickLRef = useRef<HTMLDivElement>(null);
  const tickRRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const section = root?.closest("section");
    if (!root || !section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let raf = 0;
    let last = performance.now();
    let tx = 0.5,
      ty = 0.5,
      x = 0.5,
      y = 0.5,
      shown = 0,
      target = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = section.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
      if (target === 0 && shown < 0.01) {
        // First entry: start at the pointer instead of sweeping in from the centre.
        x = tx;
        y = ty;
      }
      target = 1;
    };
    const onLeave = () => (target = 0);

    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const r = section.getBoundingClientRect();
      const exit = Math.min(1, Math.max(0, -r.top / (r.height * 0.6)));
      root.style.setProperty("--exit", exit.toFixed(3));

      if (fine && !reduce) {
        const k = 1 - Math.exp(-dt / 0.09);
        x += (tx - x) * k;
        y += (ty - y) * k;
        shown += (target - shown) * (1 - Math.exp(-dt / 0.18));
        const W = r.width,
          H = r.height;
        vRef.current!.style.transform = `translate3d(${x * W}px,0,0)`;
        hRef.current!.style.transform = `translate3d(0,${y * H}px,0)`;
        const flipX = x > 0.78 ? "calc(-100% - 18px)" : "18px";
        const flipY = y > 0.82 ? "calc(-100% - 14px)" : "14px";
        readRef.current!.style.transform = `translate3d(${x * W}px,${y * H}px,0) translate(${flipX},${flipY})`;
        tickLRef.current!.style.transform = `translate3d(0,${y * H}px,0)`;
        tickRRef.current!.style.transform = `translate3d(0,${y * H}px,0)`;
        const [la, lo] = fmt(x, y);
        latRef.current!.textContent = la;
        lonRef.current!.textContent = lo;
        root.style.setProperty("--xh", shown.toFixed(3));
      }

      if (r.bottom > 0) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("pointermove", wake, { passive: true });
    wake();
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("pointermove", wake);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="survey pointer-events-none absolute inset-0 overflow-hidden">
      {/* Columns on the page grid */}
      <div className="survey-cols absolute inset-x-0 mx-auto grid max-w-[1600px] grid-cols-4 px-5 sm:px-8 lg:grid-cols-12">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className={`survey-col ${i >= 4 ? "hidden lg:block" : ""}`} style={{ ["--i" as string]: i }} />
        ))}
      </div>

      {/* Horizontal rules with registration crosses */}
      {(["top", "bottom"] as const).map((pos, row) => (
        <div key={pos} className={`survey-row survey-row-${pos}`} style={{ ["--i" as string]: row }}>
          <div className="relative mx-auto h-full max-w-[1600px] px-5 sm:px-8">
            <div className="relative h-full">
              {[0, 3, 6, 9, 12].map((c) => (
                <span
                  key={c}
                  className={`survey-cross ${c % 6 !== 0 ? "max-lg:hidden" : ""}`}
                  style={{ left: `${(c / 12) * 100}%`, ["--i" as string]: c / 3 }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Edge rulers */}
      <div className="survey-ruler survey-ruler-l">
        <div ref={tickLRef} className="survey-ruler-tick" />
      </div>
      <div className="survey-ruler survey-ruler-r">
        <div ref={tickRRef} className="survey-ruler-tick" />
      </div>

      {/* Cursor crosshair */}
      <div className="survey-xh">
        <div ref={vRef} className="survey-xh-v" />
        <div ref={hRef} className="survey-xh-h" />
        <div ref={readRef} className="survey-read font-mono tabular">
          <span ref={latRef}>{`${LAT.toFixed(4)}° N`}</span>
          <span ref={lonRef}>{`${LON.toFixed(4)}° E`}</span>
        </div>
      </div>
    </div>
  );
}
