import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { products } from "@/lib/products";
import { ProductSpread } from "@/components/products/product-spread";

export const metadata: Metadata = {
  title: "Products · ACE SASTRA",
  description:
    "Software ACE members have designed, built and shipped for SASTRA students.",
};

export default function ProductsPage() {
  return (
    <div className="pb-24 sm:pb-36">
      <header className="mx-auto grid max-w-[1600px] gap-6 px-5 pb-10 pt-10 sm:px-8 sm:pb-12 sm:pt-14 lg:grid-cols-12 lg:items-end">
        <h1
          data-reveal
          className="font-display text-[clamp(3rem,8vw,7.5rem)] lg:col-span-8"
        >
          <span className="reveal-line">
            <span>Products</span>
          </span>
        </h1>
        <div data-fade className="lg:col-span-4">
          <p className="text-lg leading-snug text-muted-foreground">
            Software ACE members have designed, built and shipped for SASTRA
            students.
          </p>
          <p className="mt-3 font-mono text-sm tabular">
            {products.length}{" "}
            <span className="text-muted-foreground">shipped</span>
          </p>
          {/* Index: one compact ruled row per product, jumping to its spread */}
          {products.length > 1 && (
            <nav aria-label="Products on this page" className="mt-6">
              <ul className="border-t border-border">
                {products.map((p) => (
                  <li key={p.slug} className="border-b border-border">
                    <a
                      href={`#${p.slug}`}
                      className="group flex min-h-11 items-center justify-between gap-4 py-2.5"
                    >
                      <span className="font-display text-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">
                        {p.name}
                      </span>
                      <span className="flex items-center gap-3 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                        <span className="hidden sm:inline">{p.kind}</span>
                        <ArrowDownRight className="size-4" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </header>

      <div className="space-y-28 sm:space-y-40">
        {products.map((product, i) => (
          <ProductSpread key={product.slug} product={product} inverted={i === 0} />
        ))}
      </div>

      {/* Close: how a project gets here */}
      <section
        aria-labelledby="yours-heading"
        className="mx-auto mt-28 max-w-[1600px] px-5 sm:mt-40 sm:px-8"
      >
        <div className="grid gap-10 border-t border-foreground pt-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2
              id="yours-heading"
              className="font-display text-[clamp(2.5rem,5.5vw,5rem)]"
            >
              Shipped something with ACE?
            </h2>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <p className="text-lg leading-snug text-muted-foreground">
              If you built it as an ACE member and people can use it today, it
              belongs here. Send us the link and who built it.
            </p>
            <Link
              href="/#contact"
              className="group mt-6 inline-flex h-12 w-full items-center justify-between gap-8 border border-foreground/25 px-5 font-semibold transition-colors hover:bg-foreground hover:text-background sm:w-auto"
            >
              Tell us about it
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
