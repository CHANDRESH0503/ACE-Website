"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ClusterArt } from "@/components/landing/cluster-art";
import { clusters } from "@/lib/ace-content";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Clusters as scroll-driven chapters. A pinned stage draws what the active
 * cluster does; each chapter's copy scrolls past it, and a rail tracks progress.
 */
export default function ClustersClientView() {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const rows = Array.from(list.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(rows.indexOf(e.target as HTMLElement));
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    rows.forEach((r) => io.observe(r));

    let raf = 0;
    const update = () => {
      raf = 0;
      const r = list.getBoundingClientRect();
      const vh = window.innerHeight;
      setProgress(Math.min(1, Math.max(0, (vh * 0.5 - r.top) / r.height)));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  const jump = (i: number) => {
    const row = listRef.current?.children[i] as HTMLElement | undefined;
    if (!row) return;
    if (window.__lenis) window.__lenis.scrollTo(row, { offset: -window.innerHeight * 0.3 });
    else row.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="mx-auto max-w-[1600px] px-5 pb-24 sm:px-8 sm:pb-36">
      <PageHeader
        title="Clusters"
        description={`${clusters.length} specialised clusters, each led by dedicated members. Scroll through them, or jump straight to one.`}
      />

      {/* Index: jump to any cluster */}
      <nav aria-label="Clusters index" className="mb-16 sm:mb-24">
        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {clusters.map((c, i) => (
            <li key={c.title}>
              <button
                type="button"
                onClick={() => jump(i)}
                className={`text-lg font-semibold tracking-[-0.02em] transition-colors hover:text-primary ${
                  i === active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Pinned stage */}
        <div className="below-nav sticky z-10 -mx-5 bg-background px-5 pb-3 pt-3 sm:-mx-8 sm:px-8 lg:top-24! lg:col-span-6 lg:mx-0 lg:h-[calc(100svh-8rem)] lg:self-start lg:bg-transparent lg:p-0">
          <div className="relative flex h-[34svh] items-stretch border border-border lg:h-full">
            <div className="relative flex-1">
              {clusters.map((c, i) => (
                <div
                  key={c.title}
                  aria-hidden={i !== active}
                  className={`absolute inset-0 transition-[opacity,clip-path,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    i === active
                      ? "scale-100 opacity-100 [clip-path:inset(0_0_0_0)]"
                      : i < active
                        ? "pointer-events-none scale-[0.96] opacity-0 [clip-path:inset(0_0_100%_0)]"
                        : "pointer-events-none scale-[0.96] opacity-0 [clip-path:inset(100%_0_0_0)]"
                  }`}
                >
                  <ClusterArt
                    title={c.title}
                    active={i === active}
                    className="h-full w-full p-4 [--art-bg:hsl(var(--background))] sm:p-8 lg:p-14"
                  />
                </div>
              ))}
            </div>
            {/* Progress rail */}
            <div className="flex w-14 flex-col items-center justify-between border-l border-border py-4 sm:w-16">
              <span className="font-mono text-xs tabular">{pad(active + 1)}</span>
              <div className="relative my-3 w-px flex-1 bg-border">
                <div className="absolute inset-0 origin-top bg-primary" style={{ transform: `scaleY(${progress})` }} />
              </div>
              <span className="font-mono text-xs tabular text-muted-foreground">{pad(clusters.length)}</span>
            </div>
          </div>
        </div>

        {/* Chapters */}
        <ol ref={listRef} className="lg:col-span-6">
          {clusters.map((c, i) => {
            const on = i === active;
            return (
              <li
                key={c.title}
                id={c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                className="flex min-h-[70svh] flex-col justify-center border-b border-border py-16 first:pt-4 lg:min-h-[85svh] lg:pl-8"
              >
                <div className={`transition-opacity duration-700 ${on ? "opacity-100" : "opacity-100 lg:opacity-35"}`}>
                  <div className="flex items-center gap-4">
                    <Image
                      src={c.imageUrl}
                      alt={`${c.title} cluster emblem`}
                      width={128}
                      height={128}
                      className={`size-14 rounded-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${on ? "rotate-0 scale-100" : "-rotate-12 scale-90"}`}
                    />
                    <span className="font-mono text-sm tabular text-muted-foreground">
                      {pad(i + 1)} / {pad(clusters.length)}
                    </span>
                  </div>
                  <h2 data-reveal className="mt-8 text-[clamp(2.5rem,5.6vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.045em] [font-stretch:112%]">
                    <span className="reveal-line">
                      <span>{c.title}</span>
                    </span>
                  </h2>
                  <p data-fade className="mt-8 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
                    {c.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div data-fade className="mt-20 flex flex-col gap-6 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-lg leading-snug">
          You can be part of more than one cluster if your eligibility allows it and your work keeps
          up.
        </p>
        <Link
          href="/events/recruitment"
          className="group inline-flex h-14 w-fit items-center gap-8 bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          See recruitment
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
