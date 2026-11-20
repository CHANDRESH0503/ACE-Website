import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClusterReel } from "@/components/landing/cluster-reel";
import { clusters } from "@/lib/ace-content";

export const ClustersSection = () => {
  return (
    <section
      id="clusters"
      aria-labelledby="clusters-title"
      className="relative bg-signal py-24 text-signal-foreground sm:py-32 lg:py-0"
    >
      <ClusterReel
        items={clusters}
        intro={
          <>
            <h2
              id="clusters-title"
              data-reveal
              className="font-display text-[clamp(3rem,10vw,6.5rem)] lg:text-[clamp(4rem,7.2vw,8.75rem)]"
            >
              <span className="reveal-line">
                <span>{clusters.length} clusters.</span>
              </span>
              <span className="reveal-line">
                <span>Pick your</span>
              </span>
              <span className="reveal-line">
                <span>craft.</span>
              </span>
            </h2>
            <div data-fade className="mt-8 flex flex-col gap-6 lg:mt-0 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
              <p className="max-w-md text-lg leading-snug">
                Every member works inside a cluster, from web and AI to security, hardware, design and
                operations. Join more than one if your work keeps up.
              </p>
              <Link
                href="/events/recruitment"
                className="group inline-flex h-12 w-fit shrink-0 items-center gap-4 bg-signal-foreground px-5 font-semibold text-signal transition-colors hover:bg-white hover:text-signal-foreground"
              >
                See recruitment
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </>
        }
      />
    </section>
  );
};
