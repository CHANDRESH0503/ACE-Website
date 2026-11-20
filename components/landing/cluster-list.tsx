"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Cluster } from "@/lib/ace-content";
import { ClusterArt } from "./cluster-art";

function firstSentence(s: string) {
  const m = s.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : s).trim();
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Cluster index on the blue field with a pinned stage. The stage draws what the
 * active cluster does; the active cluster follows the scroll position and also
 * responds to hover and keyboard focus.
 */
export function ClusterList({ items }: { items: Cluster[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState<number | null>(null);
  const shown = pinned ?? active;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const rows = Array.from(list.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(rows.indexOf(e.target as HTMLElement));
      },
      { rootMargin: "-48% 0px -48% 0px" }
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  const c = items[shown];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
      {/* Stage: pinned at the top on phones, pinned beside the list on desktop */}
      <div className="below-nav sticky z-10 -mx-5 bg-signal px-5 pb-4 pt-2 sm:-mx-8 sm:px-8 lg:top-24! lg:col-span-6 lg:mx-0 lg:self-start lg:bg-transparent lg:p-0">
        <div className="relative grid grid-cols-[minmax(0,9rem)_1fr] items-end gap-5 border border-signal-foreground/30 p-3 sm:grid-cols-[minmax(0,13rem)_1fr] lg:block lg:p-0">
          <div className="relative aspect-square lg:w-full">
            {items.map((it, i) => (
              <div
                key={it.title}
                aria-hidden={i !== shown}
                className={`absolute inset-0 transition-[opacity,clip-path,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  i === shown
                    ? "opacity-100 [clip-path:inset(0_0_0_0)]"
                    : "pointer-events-none opacity-0 [clip-path:inset(0_0_100%_0)]"
                }`}
              >
                <ClusterArt
                  title={it.title}
                  active={i === shown}
                  className="h-full w-full p-2 [--art-accent:#fff] [--art-bg:hsl(var(--signal))] text-signal-foreground lg:p-10"
                />
              </div>
            ))}
          </div>
          <div className="min-w-0 lg:absolute lg:inset-x-0 lg:bottom-0 lg:flex lg:items-end lg:justify-between lg:gap-6 lg:border-t lg:border-signal-foreground/30 lg:p-5">
            <p className="font-mono text-sm tabular" aria-hidden="true">
              {pad(shown + 1)} / {pad(items.length)}
            </p>
            <p key={c.title} className="mt-1 text-2xl font-bold leading-none tracking-[-0.03em] [font-stretch:110%] lg:mt-0 lg:text-right lg:text-3xl" aria-live="polite">
              {c.title}
            </p>
          </div>
        </div>
      </div>

      <ol ref={listRef} onPointerLeave={() => setPinned(null)} className="border-t border-signal-foreground/30 lg:col-span-6">
        {items.map((it, i) => (
          <li key={it.title} className="border-b border-signal-foreground/30">
            <Link
              href="/clusters"
              onPointerEnter={() => setPinned(i)}
              onFocus={() => setPinned(i)}
              onBlur={() => setPinned(null)}
              className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-5 outline-offset-[-2px] sm:py-6"
            >
              <span
                className={`text-[clamp(1.6rem,3.6vw,3.25rem)] font-bold leading-[1] tracking-[-0.04em] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] [font-stretch:110%] ${
                  i === shown ? "translate-x-0 opacity-100 lg:translate-x-3" : "opacity-100 lg:opacity-45"
                }`}
              >
                {it.title}
              </span>
              <ArrowUpRight className="size-6 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 sm:size-7" />
              <span className="col-span-2 max-w-md text-sm leading-snug sm:text-base">{firstSentence(it.description)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
