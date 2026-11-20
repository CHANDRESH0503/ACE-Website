import Link from "next/link";
import { OpenEvents } from "@/components/landing/open-events";
import { VelocityMarquee } from "@/components/landing/velocity-marquee";

const formats = [
  {
    name: "Contests",
    body: "Coding contests and hackathons that test problem-solving under the clock.",
  },
  {
    name: "Workshops",
    body: "Hands-on sessions, led by members, where you build something real.",
  },
  {
    name: "Talks",
    body: "Seminars and webinars with faculty, researchers and industry professionals.",
  },
];

const marquee = ["Contests", "Workshops", "Talks", "Hackathons", "Webinars", "Seminars"];

export const EventsSection = () => {
  return (
    <section id="events" aria-labelledby="events-title" className="overflow-hidden py-24 sm:py-36">
      <div aria-hidden="true" className="mb-20 select-none border-y border-border py-5 sm:mb-28">
        <VelocityMarquee>
          {marquee.map((w) => (
            <span key={w} className="flex items-center gap-10 pr-10">
              <span className="font-display text-[clamp(2.5rem,6vw,5.5rem)] text-transparent [-webkit-text-stroke:1px_hsl(var(--foreground))] transition-colors duration-300 hover:text-foreground">
                {w}
              </span>
              <span className="size-3 bg-primary" />
            </span>
          ))}
        </VelocityMarquee>
      </div>

      <div className="mx-auto grid max-w-[1600px] gap-16 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <h2 id="events-title" data-reveal className="font-display text-[clamp(2.75rem,6vw,5.5rem)]">
            <span className="reveal-line">
              <span>Show up.</span>
            </span>
            <span className="reveal-line">
              <span>Level up.</span>
            </span>
          </h2>
          <dl className="mt-12 space-y-6">
            {formats.map((f, i) => (
              <div
                key={f.name}
                data-fade
                style={{ ["--d" as string]: `${0.08 * i}s` }}
                className="grid grid-cols-[7.5rem_1fr] gap-4 border-t border-border pt-4"
              >
                <dt className="font-semibold">{f.name}</dt>
                <dd className="text-muted-foreground">{f.body}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h3 className="text-xl font-semibold">Open for registration</h3>
            <Link
              href="/events"
              className="label text-muted-foreground transition-colors hover:text-foreground"
            >
              All events
            </Link>
          </div>
          <OpenEvents />
        </div>
      </div>
    </section>
  );
};
