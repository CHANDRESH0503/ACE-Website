"use client";

import { useEffect, useRef } from "react";

const LOCKABLE =
  'a[href], button:not(:disabled), [role="button"], [role="tab"], [role="menuitem"], [role="option"], summary, label[for], select, [data-cursor="lock"]';
const TEXT_FIELD =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]):not([type="button"]):not([type="color"]):not([type="file"]), textarea, [contenteditable="true"]';
const REST = 30; // bracket frame size at rest, px
const PAD = 6; // breathing room when the frame locks onto an element
const IDLE_MS = 1200;

/**
 * The ACE cursor: a block caret, like a terminal prompt, inside four corner brackets.
 * The caret tracks the pointer exactly and blinks when idle; the brackets trail it and
 * lock onto whatever link or button is under the pointer, framing it like a selection.
 * Fine pointers only; text fields keep the native I-beam; off under reduced motion.
 */
export function ClubCursor() {
  const caretRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let teardown: (() => void) | null = null;

    const start = () => {
      const root = rootRef.current;
      const caret = caretRef.current;
      const frame = frameRef.current;
      if (!root || !caret || !frame) return () => {};
      const html = document.documentElement;
      html.classList.add("club-cursor");

      let px = -100,
        py = -100,
        seen = false,
        down = false,
        lastMove = 0,
        raf = 0;
      let target: Element | null = null;
      let inText = false;
      // Frame state: x, y, w, h, lerped toward a goal each frame.
      const f = { x: -100, y: -100, w: REST, h: REST };

      const resolve = () => {
        const el = document.elementFromPoint(px, py);
        inText = !!el?.closest(TEXT_FIELD);
        const lock = inText ? null : el?.closest(LOCKABLE) ?? null;
        // Very large targets (whole cards or sections) read better without a frame.
        if (lock) {
          const r = lock.getBoundingClientRect();
          target = r.width * r.height < window.innerWidth * window.innerHeight * 0.35 ? lock : null;
        } else target = null;
        root.toggleAttribute("data-on-field", !!el?.closest(".bg-signal"));
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        px = e.clientX;
        py = e.clientY;
        lastMove = performance.now();
        if (!seen) {
          seen = true;
          f.x = px - REST / 2;
          f.y = py - REST / 2;
        }
        resolve();
      };
      const onDown = () => (down = true);
      const onUp = () => (down = false);
      const onScroll = () => seen && resolve();
      const onLeave = () => {
        seen = false;
        root.removeAttribute("data-visible");
      };

      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (!seen) return;
        root.setAttribute("data-visible", "");
        root.toggleAttribute("data-text", inText);

        let gx: number, gy: number, gw: number, gh: number;
        if (target && target.isConnected) {
          const r = target.getBoundingClientRect();
          const pad = down ? PAD - 3 : PAD;
          gx = r.left - pad;
          gy = r.top - pad;
          gw = r.width + pad * 2;
          gh = r.height + pad * 2;
        } else {
          const s = down ? REST - 8 : REST;
          gx = px - s / 2;
          gy = py - s / 2;
          gw = gh = s;
        }
        const k = target ? 0.26 : 0.2;
        f.x += (gx - f.x) * k;
        f.y += (gy - f.y) * k;
        f.w += (gw - f.w) * k;
        f.h += (gh - f.h) * k;
        frame.style.transform = `translate3d(${f.x}px, ${f.y}px, 0)`;
        frame.style.width = `${f.w}px`;
        frame.style.height = `${f.h}px`;

        caret.style.transform = `translate3d(${px - 4.5}px, ${py - 8}px, 0)`;
        root.toggleAttribute("data-locked", !!target);
        root.toggleAttribute("data-idle", !target && now - lastMove > IDLE_MS);
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("scroll", onScroll, { passive: true, capture: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
      window.addEventListener("blur", onLeave);
      raf = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(raf);
        html.classList.remove("club-cursor");
        root.removeAttribute("data-visible");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("scroll", onScroll, { capture: true });
        document.documentElement.removeEventListener("mouseleave", onLeave);
        window.removeEventListener("blur", onLeave);
      };
    };

    const sync = () => {
      teardown?.();
      teardown = fine.matches && !reduce.matches ? start() : null;
    };
    sync();
    fine.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      teardown?.();
      fine.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="club-cursor-layer pointer-events-none fixed inset-0 z-[2147483000]">
      <div ref={frameRef} className="cursor-frame absolute left-0 top-0">
        <span className="cursor-corner left-0 top-0 border-l border-t" />
        <span className="cursor-corner right-0 top-0 border-r border-t" />
        <span className="cursor-corner bottom-0 left-0 border-b border-l" />
        <span className="cursor-corner bottom-0 right-0 border-b border-r" />
      </div>
      <div ref={caretRef} className="cursor-caret absolute left-0 top-0" />
    </div>
  );
}
