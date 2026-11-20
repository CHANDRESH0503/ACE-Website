"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Github, Instagram, Linkedin, Mail } from "lucide-react";
import type { TeamMember } from "@/lib/ace-content";
import { Portrait } from "./portrait";

function SocialIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  const cls = "size-4";
  if (n === "linkedin") return <Linkedin className={cls} />;
  if (n === "github") return <Github className={cls} />;
  if (n === "instagram") return <Instagram className={cls} />;
  return <Mail className={cls} />;
}

function Socials({ m, tone = "default" }: { m: TeamMember; tone?: "default" | "inverse" }) {
  return (
    <ul className="flex gap-1">
      {m.socialNetworks.map((s) => (
        <li key={s.name}>
          <Link
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${m.firstName} ${m.lastName} on ${s.name === "Gmail" ? "email" : s.name}`}
            className={`grid size-9 place-items-center transition-colors ${
              tone === "inverse"
                ? "text-background/70 hover:bg-background hover:text-foreground"
                : "text-muted-foreground hover:bg-foreground hover:text-background"
            }`}
          >
            <SocialIcon name={s.name} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Desktop: a pinned portrait stage beside the roster. The active person follows
 * scroll and hover; their portrait develops from duotone to colour.
 * Phones: a swipeable strip where the centred portrait develops.
 */
export function TeamRoster({ members }: { members: TeamMember[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const stripRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [stripActive, setStripActive] = useState(0);
  const shown = hover ?? active;

  // Desktop: follow the row in the middle of the viewport.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const rows = Array.from(list.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(rows.indexOf(e.target as HTMLElement));
      },
      { rootMargin: "-46% 0px -46% 0px" }
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  // Phones: develop the portrait that is snapped into view.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const cards = Array.from(strip.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setStripActive(cards.indexOf(e.target as HTMLElement));
      },
      { root: strip, threshold: 0.75 }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  
  return (
    <>
      {/* Desktop */}
      <div className="hidden gap-8 lg:grid lg:grid-cols-12">
        <div className="sticky top-24 col-span-5 self-start">
          <div className="relative aspect-[4/5] w-full">
            {members.map((p, i) => (
              <div
                key={p.firstName + p.lastName}
                aria-hidden={i !== shown}
                className={`absolute inset-0 transition-[clip-path,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  i === shown ? "z-10 scale-100 [clip-path:inset(0_0_0_0)]" : "z-0 scale-[1.04] [clip-path:inset(0_0_100%_0)]"
                }`}
              >
                <Portrait
                  member={p}
                  developed={i === shown}
                  sizes="(min-width: 1024px) 40vw, 1px"
                  priority={i === 0}
                  className="h-full w-full"
                />
              </div>
            ))}
            <span className="pointer-events-none absolute bottom-4 right-4 z-20 font-mono text-sm tabular text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.5)]">
              {pad(shown + 1)} / {pad(members.length)}
            </span>
          </div>
        </div>

        <ol ref={listRef} onPointerLeave={() => setHover(null)} className="col-span-7 border-t border-border">
          {members.map((p, i) => (
            <li
              key={p.firstName + p.lastName}
              onPointerEnter={() => setHover(i)}
              className="group grid min-h-[22vh] grid-cols-[1fr_auto] items-center gap-x-8 border-b border-border py-8"
            >
              <div className={`transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${i === shown ? "translate-x-3" : ""}`}>
                <h3
                  className={`text-[clamp(2.25rem,4.4vw,4.5rem)] font-extrabold leading-[0.92] tracking-[-0.045em] transition-colors duration-500 [font-stretch:110%] ${
                    i === shown ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {p.firstName} {p.lastName}
                </h3>
                <p className={`mt-3 text-base font-semibold transition-colors duration-500 ${i === shown ? "text-primary" : "text-muted-foreground"}`}>
                  {p.positions.join(", ")}
                </p>
              </div>
              <div className={`transition-opacity duration-500 ${i === shown ? "opacity-100" : "opacity-0 group-focus-within:opacity-100"}`}>
                <Socials m={p} />
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Phones and tablets */}
      <ul
        ref={stripRef}
        className="scrollbar-hide -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:hidden"
      >
        {members.map((p, i) => (
          <li key={p.firstName + p.lastName} className="w-[78vw] shrink-0 snap-start sm:w-[44vw]">
            <div className="relative">
              <Portrait member={p} developed={i === stripActive} sizes="(min-width: 640px) 44vw, 78vw" className="aspect-[4/5] w-full" />
              <span className="absolute left-3 top-3 bg-background px-2 py-1 label">{p.positions.join(", ")}</span>
            </div>
            <div className="mt-4 flex items-start justify-between gap-3">
              <h3 className="text-2xl font-bold leading-tight tracking-[-0.03em] [font-stretch:108%]">
                {p.firstName} <span className="text-muted-foreground">{p.lastName}</span>
              </h3>
              <Socials m={p} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-2 label text-muted-foreground lg:hidden">
        Swipe to meet everyone <ArrowUpRight className="size-3.5 rotate-45" />
      </p>
    </>
  );
}
