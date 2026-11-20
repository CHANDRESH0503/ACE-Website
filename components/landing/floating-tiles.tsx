"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ClusterArt } from "./cluster-art";

type Slot = { x: number; y: number; d: number; r: number; w: number };

/**
 * Floating cluster tiles around the hero: each tile is a live line drawing of what a
 * cluster does. Tiles drift in depth, lean toward the pointer and scatter on scroll.
 */
export function FloatingTiles({ titles, slots }: { titles: string[]; slots: Slot[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !wide) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let px = 0,
      py = 0,
      tx = 0,
      ty = 0,
      raf = 0;
    const t0 = performance.now();
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
        const s = slots[i];
        const dx = (s.x - 50) / 50;
        const dy = (s.y - 50) / 50;
        const bob = reduce ? 0 : Math.sin(t * 0.6 + i) * 6 * (0.4 + s.d);
        const x = -px * 30 * s.d + dx * p * 260 * (0.5 + s.d);
        const y = -py * 22 * s.d + bob + dy * p * 160 - p * 120 * s.d;
        const rx = -py * 10 * s.d;
        const ry = px * 14 * s.d;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${s.r}deg) scale(${1 + p * 0.25 * s.d})`;
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
  }, [slots, wide]);

  if (!wide) return null;

  return (
    <div ref={stageRef} className="pointer-events-none absolute inset-0">
      {slots.map((s, i) => {
        const title = titles[i % titles.length];
        return (
          <Link
            key={title + i}
            href="/clusters"
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            tabIndex={-1}
            aria-hidden="true"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `clamp(${90 + s.d * 40}px, ${s.w}vw, ${170 + s.d * 110}px)`,
              zIndex: Math.round(s.d * 9),
              filter: s.d < 0.35 ? "blur(1.5px)" : undefined,
            }}
            className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 will-change-transform"
          >
            <span className="relative block aspect-[4/5] overflow-hidden border border-foreground/15 bg-card shadow-[0_30px_60px_-24px_rgba(0,0,0,0.6)] transition-colors group-hover:border-primary">
              <ClusterArt title={title} active className="absolute inset-0 p-3 [--art-bg:hsl(var(--card))]" />
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_40%)]" />
              <span className="absolute inset-x-0 bottom-0 border-t border-foreground/15 bg-card/90 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]">
                {title}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
