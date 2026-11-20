// Products built by ACE members. Add a new entry to the array to publish it on /products.
//
// Keep it truthful: every number and fact comes from the product's own store listing or
// site, and figures that can change (ratings) carry the date they were read.

export type ProductStamp = {
  label: string;
  value: string;
  /** Smaller text after the value, e.g. "/ 5". */
  suffix?: string;
  note?: string;
};

export type ProductLink = {
  label: string;
  href: string;
  /** Short qualifier after the label, e.g. "Android". */
  sub?: string;
};

/** [label, value, set the value in mono (dates, numbers)] */
export type ProductFact = [string, string, boolean?];

export type Product = {
  slug: string;
  name: string;
  /** One line, in the product's own words. */
  tagline: string;
  summary: string;
  /** Square icon, when the product has a real one. */
  icon?: string;
  /** Used in the index once there is more than one product, e.g. "Android and iOS app". */
  kind: string;
  /** Hairline proof stamp: two cells. */
  stamps: ProductStamp[];
  /** Where the stamp's figures come from, with the date they were read. */
  stampsSource: { text: string; asOf: string };
  /** First link is the primary (ACE Blue) action. */
  links: ProductLink[];
  features: { title: string; intro: string; items: { name: string; body: string }[] };
  facts: ProductFact[];
};

export const products: Product[] = [
  {
    slug: "unify",
    name: "UniFy",
    tagline: "One SASTRA, one app.",
    summary:
      "A student dashboard for SASTRA. UniFy pulls your campus data into one place, so attendance, timetable, dues and study material are a tap away instead of a dozen portal tabs.",
    icon: "/images/products/unify/icon.webp",
    kind: "Android and iOS app",
    stamps: [
      { label: "Google Play", value: "4.8", suffix: "/ 5", note: "38 ratings" },
      { label: "App Store", value: "4.7", suffix: "/ 5", note: "16 ratings" },
    ],
    stampsSource: { text: "Store ratings as of", asOf: "2026-11-20" },
    links: [
      { label: "Get it on Google Play", sub: "Android", href: "https://play.google.com/store/apps/details?id=com.sastra.sastrax" },
      { label: "Download on the App Store", sub: "iOS", href: "https://apps.apple.com/in/app/unify-sastra/id6762518214" },
    ],
    features: {
      title: "What it does",
      intro: "Everything a SASTRA student checks in a week, without opening the university portal.",
      items: [
        { name: "Attendance", body: "Overall and subject-by-subject attendance, with a monthly trend." },
        { name: "Timetable", body: "Your schedule, redesigned for a phone screen." },
        { name: "Dues", body: "SASTRA and hostel dues tracked in one place." },
        { name: "PYQ Bot", body: "Ask for a subject and get its previous-year question papers." },
        { name: "GATE prep", body: "Preparation material sorted by branch." },
        { name: "Placements", body: "A preparation hub for aptitude, core subjects and interviews." },
      ],
    },
    facts: [
      ["Category", "Education"],
      ["Platforms", "Android, iOS"],
      // "Built with love by Team UniFy" is the app's own credit on its Play listing banner.
      ["Built by", "Team UniFy"],
      ["Android publisher", "Ashwin Narayanan S"],
      ["iOS publisher", "Yemireddy Amulya"],
      ["Price", "Free"],
      ["iOS version", "14 or later", true],
      ["Last updated", "4 Nov 2026", true],
    ],
  },
  {
    slug: "carpediem",
    // One word, as the fest writes itself on its site ("Carpediem is SASTRA University's
    // flagship cultural fest", "CARPEDIEM 26th EDITION") and in its logo; only the <title> says "Carpe Diem".
    name: "Carpediem",
    tagline: "Make today count.",
    summary:
      "The website for Carpediem, SASTRA's flagship cultural fest. Its 26th edition, Aranya – Enter the Unexplored, gets a site of its own: the story of the fest, its events, sponsors and merch, and who to call.",
    kind: "Website · Cultural fest",
    stamps: [
      { label: "Edition", value: "26th" },
      { label: "Fest dates", value: "4–5", suffix: "Oct", note: "Two days" },
    ],
    stampsSource: { text: "From the fest site, read", asOf: "2026-11-20" },
    links: [{ label: "Visit the site", sub: "carpediem.kuruksastra.in", href: "https://carpediem.kuruksastra.in" }],
    features: {
      title: "What’s on the site",
      intro: "Everything a visitor needs for the two days of the fest, in one place.",
      items: [
        { name: "The story", body: "Carpediem and this year’s theme, Aranya – Enter the Unexplored, told as you scroll." },
        { name: "Countdown", body: "Days to go, events and sponsors, counted on the home page." },
        { name: "Events", body: "Every event of the fest on its own page, led by the flagship Mr./Ms. Freshers." },
        { name: "Merch", body: "The fest T-shirt, with credits for who designed and who sells it." },
        { name: "Sponsors", body: "The brands backing this year’s fest." },
        { name: "Contact", body: "The core committee, with numbers to call." },
      ],
    },
    facts: [
      ["Type", "Website"],
      ["Built for", "Carpediem, SASTRA"],
      ["Edition", "26th", true],
      ["Theme", "Aranya"],
      ["Fest dates", "4–5 Oct", true],
      ["Built with", "Next.js"],
      ["Address", "carpediem.kuruksastra.in"],
    ],
  },
];
