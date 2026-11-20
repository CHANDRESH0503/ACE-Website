import { VelocityMarquee } from "./velocity-marquee";

/** Two tilted strips crossing each other, running in opposite directions. */
export function CrossMarquee({ a, b }: { a: string[]; b: string[] }) {
  return (
    <div aria-hidden="true" className="relative -my-6 h-[150px] select-none overflow-hidden sm:h-[190px]">
      <div className="absolute inset-x-[-5%] top-1/2 -translate-y-1/2 rotate-[4deg] bg-foreground py-3 text-background">
        <VelocityMarquee base={-50}>
          {b.map((w, i) => (
            <span key={i} className="flex items-center gap-6 pr-6">
              <span className="whitespace-nowrap text-base font-semibold uppercase tracking-[0.08em]">{w}</span>
              <span className="size-1.5 bg-background" />
            </span>
          ))}
        </VelocityMarquee>
      </div>
      <div className="absolute inset-x-[-5%] top-1/2 -translate-y-1/2 -rotate-[3deg] bg-signal py-4 text-signal-foreground">
        <VelocityMarquee base={60}>
          {a.map((w, i) => (
            <span key={i} className="flex items-center gap-8 pr-8">
              <span className="whitespace-nowrap text-[clamp(1.25rem,2.4vw,2.25rem)] font-extrabold tracking-[-0.03em] [font-stretch:112%]">
                {w}
              </span>
              <span className="size-2.5 bg-signal-foreground" />
            </span>
          ))}
        </VelocityMarquee>
      </div>
    </div>
  );
}
