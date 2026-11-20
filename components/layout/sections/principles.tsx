"use client";

import { useEffect, useRef, useState } from "react";
import { principles } from "@/lib/ace-content";

const PIN_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "What we stand for": six principles charged one at a time.
 *
 * Desktop with motion: the section pins and scroll charges each word in turn
 * (ink fills it left to right behind an ACE Blue caret) while the right column
 * swaps to that principle. Clicking a word jumps to it.
 * Phones: each word charges as it crosses the viewport; text stays in flow.
 * Reduced motion / no JS: every word is solid and every description visible.
 */
export const PrinciplesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState(false);
  const n = principles.length;

  useEffect(() => {
    const mq = window.matchMedia(PIN_QUERY);
    const sync = () => setPinned(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = Array.from(section.querySelectorAll<HTMLElement>("[data-pr-item]"));
    const words = items.map((li) => li.querySelector<HTMLElement>("[data-pr-word]")!);
    section.dataset.scrub = "on";
    let raf = 0;
    let lastActive = -1;

    const setWord = (i: number, p: number) => {
      const w = words[i];
      w.style.setProperty("--p", p.toFixed(4));
      if (p > 0 && p < 1) w.setAttribute("data-filling", "");
      else w.removeAttribute("data-filling");
    };

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      if (pinned) {
        const r = section.getBoundingClientRect();
        const travel = Math.max(1, r.height - vh);
        // The first word starts charging as the section rises into view.
        const P = Math.min(1, Math.max(0, (-r.top + vh * 0.35) / (travel + vh * 0.35))) * n;
        const active = Math.min(n - 1, Math.floor(P));
        for (let i = 0; i < n; i++) {
          const f = Math.min(1, Math.max(0, (P - i) / 0.62));
          setWord(i, f);
          section.style.setProperty(`--f${i}`, f.toFixed(4));
        }
        if (active !== lastActive) {
          lastActive = active;
          items.forEach((li, i) => {
            li.toggleAttribute("data-active", i === active);
            li.toggleAttribute("data-done", i < active);
          });
        }
      } else {
        for (let i = 0; i < n; i++) {
          const top = words[i].getBoundingClientRect().top;
          setWord(i, Math.min(1, Math.max(0, (vh * 0.86 - top) / (vh * 0.36))));
        }
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      delete section.dataset.scrub;
      items.forEach((li) => {
        li.removeAttribute("data-active");
        li.removeAttribute("data-done");
      });
      words.forEach((w) => {
        w.style.removeProperty("--p");
        w.removeAttribute("data-filling");
      });
    };
  }, [pinned, n]);

  const jumpTo = (i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const vh = window.innerHeight;
    const travel = section.offsetHeight - vh;
    const top = section.getBoundingClientRect().top + window.scrollY;
    // Land just after the word has fully charged.
    const P = Math.min(n - 0.01, i + 0.7);
    const y = top - vh * 0.35 + (P / n) * (travel + vh * 0.35);
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="principles"
      aria-labelledby="principles-title"
      className="pr relative border-t border-border"
      style={{ ["--n" as string]: n }}
    >
      <div className="pr-stage mx-auto max-w-[1600px] px-5 py-24 sm:px-8 sm:py-36">
        <div className="pr-head grid gap-8 lg:grid-cols-12">
          <h2
            id="principles-title"
            data-reveal
            className="font-display text-[clamp(2.5rem,5vw,4.5rem)] lg:col-span-6"
          >
            <span className="reveal-line">
              <span>What we</span>
            </span>
            <span className="reveal-line">
              <span>stand for</span>
            </span>
          </h2>
          <p
            data-fade
            className="max-w-md text-lg leading-relaxed text-muted-foreground lg:col-span-4 lg:col-start-9 lg:self-end"
          >
            ACE is the official club of the School of Computing at SASTRA Deemed University. Six
            principles shape how we run it.
          </p>
        </div>

        <ol className="pr-list mt-14 border-t border-border">
          {principles.map((p, i) => {
            const word = (
              <>
                <span className="pr-ghost">{p.title}</span>
                <span className="pr-ink" aria-hidden>
                  {p.title}
                </span>
                <span className="pr-caret-track" aria-hidden>
                  <span className="pr-caret" />
                </span>
              </>
            );
            return (
              <li
                key={p.title}
                data-pr-item
                className="pr-item border-b border-border py-7 sm:py-9"
                style={{ ["--r" as string]: i + 1 }}
              >
                <h3 className="pr-word-row">
                  {pinned ? (
                    <button
                      type="button"
                      data-pr-word
                      onClick={() => jumpTo(i)}
                      aria-label={`${p.title}, principle ${i + 1} of ${n}`}
                      className="pr-word"
                    >
                      {word}
                    </button>
                  ) : (
                    <span data-pr-word className="pr-word">
                      {word}
                    </span>
                  )}
                </h3>

                <div className="pr-desc mt-4 lg:mt-0" data-fade={pinned ? undefined : ""}>
                  <div className="pr-meta" aria-hidden>
                    <span className="pr-count font-mono tabular">
                      <span className="pr-count-roll">{pad(i + 1)}</span>
                    </span>
                    <span className="font-mono text-xs tracking-[0.06em] text-muted-foreground tabular">
                      / {pad(n)}
                    </span>
                  </div>
                  <div className="pr-rail" aria-hidden>
                    {principles.map((_, j) => (
                      <span key={j} className="pr-seg">
                        <span style={{ transform: `scaleX(var(--f${j}, 1))` }} />
                      </span>
                    ))}
                  </div>
                  <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground lg:mt-8 lg:text-xl lg:leading-[1.5] lg:text-foreground/80">
                    {p.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
