import { TeamRoster } from "@/components/landing/team-roster";
import { team } from "@/lib/ace-content";

export const TeamSection = () => {
  return (
    <section id="team" aria-labelledby="team-title" className="py-24 sm:py-36">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <div className="mb-14 grid gap-8 lg:mb-20 lg:grid-cols-12">
          <h2 id="team-title" data-reveal className="font-display text-[clamp(2.75rem,7vw,6.5rem)] lg:col-span-7">
            <span className="reveal-line">
              <span>The people</span>
            </span>
            <span className="reveal-line">
              <span>running ACE</span>
            </span>
          </h2>
          <p data-fade className="max-w-md text-lg leading-relaxed text-muted-foreground lg:col-span-4 lg:col-start-9 lg:self-end">
            The office bearers who run the club, and the people to talk to about anything ACE.
          </p>
        </div>
        <TeamRoster members={team} />
      </div>
    </section>
  );
};
