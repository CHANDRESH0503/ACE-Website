import { ScrubText } from "@/components/landing/scrub-text";

const offers = [
  {
    title: "Sharpen your skills",
    body: "Hands-on workshops, coding contests and hackathons, run by students, for students.",
  },
  {
    title: "Explore what's next",
    body: "Talks and sessions on emerging technology, and research links with SoC faculty for publications.",
  },
  {
    title: "Meet the people",
    body: "A community of peers who share your passion, plus faculty and industry professionals in the room.",
  },
];

export const AboutSection = () => {
  return (
    <section id="about" aria-labelledby="about-title" className="relative py-28 sm:py-40">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <h2 id="about-title" className="sr-only">
          About ACE
        </h2>
        <ScrubText
          className="max-w-[22ch] text-[clamp(2rem,5.2vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.035em] [font-stretch:105%]"
          text="The official School of Computing club at SASTRA. Student-run, built for anyone with a passion for computing who wants to learn, innovate and grow."
        />

        <ul className="mt-20 grid border-t border-border sm:mt-28 md:grid-cols-3">
          {offers.map((o, i) => (
            <li
              key={o.title}
              data-fade
              style={{ ["--d" as string]: `${0.08 * i}s` }}
              className="group border-b border-border py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
            >
              <span className="font-mono text-sm tabular text-primary">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-6 text-[clamp(1.75rem,2.6vw,2.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] [font-stretch:110%]">
                {o.title}
              </h3>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground lg:text-lg">{o.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
