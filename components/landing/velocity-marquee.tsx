"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A marquee that idles slowly and surges, and skews, with scroll velocity.
 * Scrolling up reverses it. Reduced motion leaves it still.
 */
export function VelocityMarquee({ children, base = 60 }: { children: ReactNode; base?: number }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = 0;
    let last = performance.now();
    let lastY = window.scrollY;
    let vel = 0;
    let dir = 1;
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(track);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (dy !== 0) dir = dy > 0 ? 1 : -1;
      vel += (dy / Math.max(dt, 0.001) - vel) * 0.1; // px/s, smoothed
      if (visible) {
        const speed = base * dir + Math.max(-1600, Math.min(1600, vel)) * 0.35;
        const half = track.scrollWidth / 2;
        x -= speed * dt;
        if (x <= -half) x += half;
        if (x > 0) x -= half;
        const skew = Math.max(-8, Math.min(8, vel * -0.006));
        track.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [base]);

  return (
    <div ref={trackRef} className="flex w-max will-change-transform">
      <div className="flex shrink-0 items-center">{children}</div>
      <div className="flex shrink-0 items-center" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
