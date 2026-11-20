"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface PosterItem {
  id: string;
  name: string;
  src: string;
}

// Slots around the title: x/y in % of the stage, depth 0 (far) to 1 (near), tilt in degrees.
const SLOTS_WIDE = [
  { x: 9, y: 22, d: 0.55, r: -8, w: 13 },
  { x: 15, y: 76, d: 0.9, r: 6, w: 14 },
  { x: 4, y: 52, d: 0.3, r: 4, w: 9 },
  { x: 33, y: 10, d: 0.2, r: 5, w: 8 },
  { x: 72, y: 12, d: 0.45, r: 7, w: 11 },
  { x: 91, y: 40, d: 0.85, r: -6, w: 14 },
  { x: 85, y: 78, d: 0.6, r: -4, w: 12 },
  { x: 60, y: 92, d: 0.25, r: 9, w: 8 },
];

// Phones: keep every poster on the top and bottom edges, clear of the copy.
const SLOTS_NARROW = [
  { x: 14, y: 12, d: 0.6, r: -8, w: 26 },
  { x: 50, y: 7, d: 0.3, r: 4, w: 20 },
  { x: 86, y: 13, d: 0.8, r: 7, w: 26 },
  { x: 12, y: 92, d: 0.7, r: 6, w: 24 },
  { x: 88, y: 91, d: 0.5, r: -6, w: 24 },
];

/**
 * Real event posters drift in depth around the page title. They lean toward the
 * pointer by depth and scatter outward as the hero scrolls away.
 */
type Slot = { x: number; y: number; d: number; r: number; w: number };

export function FloatingPosters({
  posters,
  wideSlots = SLOTS_WIDE,
  narrowSlots = SLOTS_NARROW,
}: {
  posters: PosterItem[];
  wideSlots?: Slot[];
  narrowSlots?: Slot[];
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const SLOTS = narrow ? narrowSlots : wideSlots;
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let px = 0,
      py = 0,
      tx = 0,
      ty = 0,
      raf = 0,
      t0 = performance.now();
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const loop = (now: number) => {
      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;
      const r = stage.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height * 0.8)));
      const t = (now - t0) / 1000;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const s = SLOTS[i % SLOTS.length];
        const dx = (s.x - 50) / 50; // -1..1 from centre
        const dy = (s.y - 50) / 50;
        const bob = reduce ? 0 : Math.sin(t * 0.6 + i) * 6 * (0.4 + s.d);
        const x = -px * 30 * s.d + dx * p * 260 * (0.5 + s.d);
        const y = -py * 22 * s.d + bob + dy * p * 160 - p * 120 * s.d;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${s.r + px * 3 * s.d}deg) scale(${1 + p * 0.25 * s.d})`;
        el.style.opacity = String(1 - p * 0.9);
      });
      raf = requestAnimationFrame(loop);
    };
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [SLOTS]);

  return (
    <div ref={stageRef} className="pointer-events-none absolute inset-0">
      {posters.slice(0, SLOTS.length).map((p, i) => {
        const s = SLOTS[i];
        return (
          <Link
            key={p.id}
            href={`/events/${p.id}`}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            tabIndex={-1}
            aria-hidden="true"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `clamp(${70 + s.d * 40}px, ${s.w}vw, ${160 + s.d * 120}px)`,
              zIndex: Math.round(s.d * 10),
              filter: s.d < 0.35 ? "blur(1.5px)" : undefined,
            }}
            className="poster-float pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 will-change-transform"
          >
            <span className="relative block aspect-[4/5] overflow-hidden bg-muted shadow-[0_30px_60px_-24px_rgba(0,0,0,0.55)] transition-[outline-color] [outline:1px_solid_transparent] hover:[outline-color:hsl(var(--primary))]">
              <Image src={p.src} alt="" fill sizes="240px" className="object-cover" />
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_38%,transparent_70%,rgba(255,255,255,0.06))]" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
