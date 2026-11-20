import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FooterWordmark } from "@/components/layout/footer-wordmark";

const site = [
  { href: "/clusters", label: "Clusters" },
  { href: "/events", label: "Events" },
  { href: "/events/upcoming", label: "Upcoming" },
  { href: "/products", label: "Products" },
];

const social = [
  { href: "https://www.instagram.com/ace.sastra/", label: "Instagram" },
  { href: "https://www.linkedin.com/in/ace-sastra/", label: "LinkedIn" },
  { href: "https://chat.whatsapp.com/HSN43WSqvXK8G47b0Uxad6?mode=ac_t", label: "WhatsApp" },
  { href: "https://youtube.com/@ace-sastra", label: "YouTube" },
];

export const FooterSection = () => {
  return (
    <footer id="footer" className="overflow-hidden print:hidden border-t border-border pt-16 sm:pt-24">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="ACE home">
            <Image src="/logo.svg" alt="" width={44} height={44} />
            <span className="text-lg font-bold tracking-[-0.02em]">Association of Computing Engineers</span>
          </Link>
          <p className="mt-4 max-w-sm text-muted-foreground">
            The official club of the School of Computing, SASTRA Deemed University. Code, build,
            progress.
          </p>
        </div>

        <nav aria-label="Site" className="lg:col-span-3 lg:col-start-7">
          <p className="label text-muted-foreground">Site</p>
          <ul className="mt-4 space-y-2">
            {site.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-lg transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Social" className="lg:col-span-3">
          <p className="label text-muted-foreground">Follow</p>
          <ul className="mt-4 space-y-2">
            {social.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-lg transition-colors hover:text-primary"
                >
                  {l.label}
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-16 flex max-w-[1600px] flex-col gap-2 px-5 label text-muted-foreground sm:flex-row sm:justify-between sm:px-8">
        <span>© 2026 ACE · SASTRA Deemed University</span>
        <span>
          Developed by{" "}
          <a
            href="https://github.com/ace-webD"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-border underline-offset-4 hover:decoration-primary"
          >
            ace-webD
          </a>
        </span>
      </div>

      <FooterWordmark />
    </footer>
  );
};
