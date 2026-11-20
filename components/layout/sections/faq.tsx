import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/ace-content";

export const FAQSection = () => {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-border py-24 sm:py-36">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <h2 id="faq-title" data-reveal className="font-display text-[clamp(2.75rem,4.6vw,4.75rem)]">
              <span className="reveal-line">
                <span>Questions,</span>
              </span>
              <span className="reveal-line">
                <span>answered</span>
              </span>
            </h2>
            <p data-fade className="mt-8 max-w-sm text-lg leading-relaxed text-muted-foreground">
              Still curious? Write to us at{" "}
              <a
                href="mailto:ace.soc.sastra@gmail.com"
                className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-primary"
              >
                ace.soc.sastra@gmail.com
              </a>
              .
            </p>
          </div>
        </div>

        <Accordion type="single" collapsible className="border-t border-border lg:col-span-7 lg:col-start-6">
          {faqs.map(({ question, answer, value }) => (
            <AccordionItem key={value} value={value}>
              <AccordionTrigger className="text-lg sm:text-xl">{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
