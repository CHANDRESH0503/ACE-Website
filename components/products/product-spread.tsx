import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

const asOf = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** One product, laid out like an award site's project page: name, proof, what it does, the facts. */
export function ProductSpread({ product, inverted = false }: { product: Product; inverted?: boolean }) {
  const id = product.slug;
  // One inversion panel per page: only the first product's features sit on the inked band.

  return (
    <article id={id} aria-labelledby={`${id}-name`} className="scroll-mt-24">
      {/* Name and proof */}
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <div className="grid gap-12 border-t border-foreground pt-8 sm:pt-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8" style={{ containerType: "inline-size" }}>
            {product.icon && (
              <div className="mb-6 inline-block border border-foreground p-1.5">
                <Image src={product.icon} alt="" width={80} height={80} className="block size-16 object-contain sm:size-20" />
              </div>
            )}
            <h2
              id={`${id}-name`}
              data-reveal
              className="font-display text-foreground"
              // Fit the name to its column: Archivo 800 at 112% runs about 0.7em a character.
              style={{ fontSize: `min(12.5rem, calc(100cqi / ${(product.name.length * 0.7).toFixed(2)}))` }}
            >
              <span className="reveal-line">
                <span>{product.name}</span>
              </span>
            </h2>
            <p data-fade className="mt-6 text-[clamp(1.5rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
              {product.tagline}
            </p>
            <p data-fade style={{ ["--d" as string]: ".1s" }} className="mt-5 max-w-[46ch] text-lg leading-snug text-muted-foreground">
              {product.summary}
            </p>
          </div>

          <aside data-fade style={{ ["--d" as string]: ".15s" }} className="lg:col-span-4 lg:self-end">
            <dl className="grid border border-foreground" style={{ gridTemplateColumns: `repeat(${product.stamps.length}, minmax(0, 1fr))` }}>
              {product.stamps.map((stamp, i) => (
                <div key={stamp.label} className={cn("p-5", i > 0 && "border-l border-foreground")}>
                  <dt className="label text-muted-foreground">{stamp.label}</dt>
                  <dd className="mt-3">
                    <span className="font-mono text-5xl leading-none tabular">{stamp.value}</span>
                    {stamp.suffix && <span className="ml-1.5 font-mono text-sm tabular text-muted-foreground">{stamp.suffix}</span>}
                    {stamp.note && <span className="mt-2 block text-sm text-muted-foreground">{stamp.note}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">
              {product.stampsSource.text} <span className="font-mono tabular">{asOf(product.stampsSource.asOf)}</span>
            </p>

            <div className="mt-6 grid gap-2">
              {product.links.map((link, i) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "group inline-flex h-14 w-full items-center justify-between gap-6 px-6 font-semibold transition-[background-color,color,transform] duration-300 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring active:scale-[0.98]",
                    i === 0
                      ? "bg-primary text-primary-foreground hover:bg-foreground hover:text-background"
                      : "border border-foreground/25 hover:bg-foreground hover:text-background"
                  )}
                >
                  <span className="flex min-w-0 items-center">
                    <span className="truncate">{link.label}</span>
                    {link.sub && (
                      <span className="ml-3 hidden shrink-0 border-l border-current pl-3 text-sm font-normal sm:inline">{link.sub}</span>
                    )}
                  </span>
                  <ArrowUpRight className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                </a>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {/* What it does: on the inked band for the first product, on the ground for the rest */}
      <section
        aria-labelledby={`${id}-features`}
        className={cn("mt-16 sm:mt-20", inverted && "bg-foreground py-14 text-background sm:py-20")}
      >
        <div className="mx-auto grid max-w-[1600px] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <h3 id={`${id}-features`} className="font-display text-[clamp(2.25rem,4.4vw,3.75rem)]">
              {product.features.title}
            </h3>
            <p className={cn("mt-5 max-w-[34ch] leading-relaxed", inverted ? "text-background/75" : "text-muted-foreground")}>{product.features.intro}</p>
          </div>
          <dl className={cn("border-t lg:col-span-8", inverted ? "border-background/25" : "border-border")}>
            {product.features.items.map((f) => (
              <div
                key={f.name}
                className={cn("group relative grid gap-3 border-b py-6", inverted ? "border-background/25" : "border-border", " sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-baseline sm:gap-8 sm:py-8")}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -top-px h-px origin-left scale-x-0 bg-primary transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                />
                <dt className="font-display text-[clamp(1.75rem,3.2vw,2.75rem)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">
                  {f.name}
                </dt>
                <dd className={cn("max-w-[40ch] leading-relaxed", inverted ? "text-background/75" : "text-muted-foreground")}>{f.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The facts */}
      <div className="mx-auto mt-16 grid max-w-[1600px] gap-8 px-5 sm:mt-20 sm:px-8 lg:grid-cols-12">
        <h3 id={`${id}-facts`} className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl lg:col-span-4">
          Details
        </h3>
        <dl aria-labelledby={`${id}-facts`} className="grid border-t border-border sm:grid-cols-2 sm:gap-x-8 lg:col-span-8">
          {product.facts.map(([k, v, mono]) => (
            <div key={k} className="flex items-baseline justify-between gap-6 border-b border-border py-4">
              <dt className="label shrink-0 text-muted-foreground">{k}</dt>
              <dd className={cn("min-w-0 break-words text-right font-semibold", mono && "font-mono font-normal tabular")}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
