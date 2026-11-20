import { HeroSection } from "@/components/layout/sections/hero";
import { AboutSection } from "@/components/layout/sections/about";
import { ClustersSection } from "@/components/layout/sections/clusters";
import { EventsSection } from "@/components/layout/sections/events";
import { PrinciplesSection } from "@/components/layout/sections/principles";
import { TeamSection } from "@/components/layout/sections/team";
import { FAQSection } from "@/components/layout/sections/faq";
import { ContactSection } from "@/components/layout/sections/contact";
import { InAction } from "@/components/landing/in-action";
import { NumbersDial } from "@/components/landing/numbers-dial";
import { CrossMarquee } from "@/components/landing/cross-marquee";
import { fetchLandingEvents } from "@/lib/services/posters";
import { clusters, team } from "@/lib/ace-content";

export const revalidate = 600;

export const metadata = {
  title: "ACE SASTRA · Association of Computing Engineers",
  description:
    "ACE is the official club of SASTRA's School of Computing: contests, workshops, talks, research and clusters, run by students.",
};

export default async function Home() {
  const { doneCount, since } = await fetchLandingEvents(1);

  const years = since ? new Date().getFullYear() - since + 1 : null;
  const stats = [
    ...(doneCount ? [{ label: "Events run", value: doneCount, note: `Contests, workshops and talks since ${since ?? 2024}.` }] : []),
    { label: "Clusters", value: clusters.length, note: "From web and AI to security, hardware, design and operations." },
    { label: "Office bearers", value: team.length, note: "Students who run the club, end to end." },
    ...(years ? [{ label: "Years of events", value: years, note: `Running events every year since ${since}.` }] : []),
  ];

  return (
    <>
      <HeroSection />
      <CrossMarquee
        a={["Code", "Build", "Progress", "Contests", "Workshops", "Talks", "Hackathons"]}
        b={clusters.map((c) => c.title)}
      />
      <AboutSection />
      <InAction count={doneCount} since={since} />
      <NumbersDial stats={stats} />
      <ClustersSection />
      <EventsSection />
      <PrinciplesSection />
      <TeamSection />
      <FAQSection />
      <ContactSection />
    </>
  );
}
