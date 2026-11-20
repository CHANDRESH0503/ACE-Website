"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Site-wide motion runtime:
 * - Lenis smooth scrolling (skipped for reduced motion)
 * - Reveal observer for [data-reveal] (masked lines) and [data-fade] elements.
 * Content stays visible without JS: the hiding class is only added here.
 */
export function MotionRuntime() {
  const pathname = usePathname();

  // Smooth scroll, once.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__lenis = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // In-page anchors go through Lenis so they ease instead of jumping.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("a[href^='#'], a[href^='/#']") as HTMLAnchorElement | null;
      if (!a) return;
      const hash = a.getAttribute("href")!.replace(/^\//, "");
      if (window.location.pathname !== "/" && a.getAttribute("href")!.startsWith("/#")) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -64 });
      history.replaceState(null, "", hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  // Hero exit: the hero copy drifts up and fades as the page scrolls away.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = document.querySelector<HTMLElement>("[data-exit]");
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / vh));
      el.style.transform = p ? `translate3d(0, ${-p * 18}vh, 0)` : "";
      el.style.opacity = p ? String(1 - p * 1.1) : "";
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
  }, [pathname]);

  // Reveal observer, re-armed on every route change.
  useEffect(() => {
    const root = document.documentElement;
    if (!("IntersectionObserver" in window)) return;
    root.classList.add("js-reveal");

    // Clip-revealed elements start fully clipped, which IntersectionObserver
    // treats as invisible, so their parent is observed on their behalf.
    const proxies = new Map<Element, Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (proxies.get(entry.target) ?? entry.target).setAttribute("data-in", "");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
    );

    const scan = () => {
      document
        .querySelectorAll("[data-reveal]:not([data-in]), [data-fade]:not([data-in]), [data-letters]:not([data-in])")
        .forEach((el) => io.observe(el));
      document.querySelectorAll("[data-clip]:not([data-in])").forEach((el) => {
        const target = el.parentElement ?? el;
        proxies.set(target, el);
        io.observe(target);
      });
    };
    // Start only after hydration has settled, so React never sees our attribute first.
    const mo = new MutationObserver(() => scan());
    let t = 0;
    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      t = window.setTimeout(() => {
        scan();
        mo.observe(document.body, { childList: true, subtree: true });
      }, 60);
    };
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });
    // Never hold content back on a slow load.
    const cap = window.setTimeout(begin, 1200);

    return () => {
      window.clearTimeout(t);
      window.clearTimeout(cap);
      window.removeEventListener("load", begin);
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
