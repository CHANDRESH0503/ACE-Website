# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: current ACE members.** These are School of Computing students at SASTRA University (Thanjavur). Most use the site on their phones. They come to find upcoming events, register (and pay when an event needs it), give feedback afterwards, and see the badges and points they have earned. The site is mainly a tool they come back to, not a brochure.

**Secondary:**
- **Prospective members.** These are 1st-year students (non-tech cluster only) and 2nd- and 3rd-year SoC students. They decide whether to join and apply to a cluster during recruitment.
- **Admins.** ACE core and leads, flagged in `userAdmins`, who run events and award badges.

## Product Purpose

ACE (Association of Computing Engineers) is a student-run club in SASTRA's School of Computing. It promotes excellence in computing education and research through events, workshops, seminars and specialised clusters. The site is the club's operating surface:

- the public home page explains ACE and recruits members
- the signed-in app handles events, registration, payment, attendance, feedback and badges

Success means members use the site without being pushed: events fill through it rather than through scattered forms, and members treat their profile and badges as a record worth sharing.

## Positioning

The value is the combination, and no single mechanism leads. Discovering, registering for, paying for and giving feedback on events all happen in one place. Clear cluster pathways give each student a track to grow in, with peers and faculty. Badges and a public profile turn participation into a verifiable, shareable record. A generic club page or an Instagram account can't do all three together.

## Operating Context

- Sign-in is Google OAuth through Supabase, restricted to SASTRA email accounts.
- A member profile holds name, registration number, department, year, contact number and a current rating.
- Events have a type (CONTEST, WORKSHOP or TALK) and a status (OPEN, CLOSED, DONE or CANCELLED). Each has a start time, location, image and organiser info.
- A registration tracks whether the member attended and the points they earned.
- Paid events go through Razorpay, using a payment modal and a webhook.
- Badges are MANUAL (awarded by an admin) or AUTOMATIC. A member's earned badges show at `/user/[userId]`, and each badge has its own page.
- Clusters include Web Dev, App Dev, AI/ML, Cybersecurity, IoT & Embedded, Competitive Programming, OpCon & PR, Networks, Game Dev, Content Writing, Video, CSI and others. Recruitment applications currently go to external Google Forms.
- The home page covers about, mission, principles, team (core and leads), FAQ, and a contact form that writes to `ContactMessage`.

## Capabilities and Constraints

- Stack: Next.js (App Router), React 19, Tailwind v4, shadcn/Radix UI, Supabase (auth, database, storage), TanStack Query and Table, Motion, and Razorpay.
- Login must stay limited to the SASTRA domain.
- Light and dark themes must both stay fully supported. The site currently follows the system theme by default.
- Mobile-first: phones are the primary viewport.
- Terminology: "ACE", "ACE SASTRA", "Association of Computing Engineers", "clusters", "core", "leads", "badges" and "points/rating".

## Brand Commitments

- The name **ACE SASTRA** and the existing ACE logo are fixed. The logo files are `public/ACE_SVG_original.svg`, `public/ACE_SVG_original.png`, `public/logo.svg` and `app/icon.svg`.
- Standing visual preference (chosen 2026-11-15, after three rounds of themed directions): **award-grade, not themed**. That means the polished Awwwards tech-site standard with no metaphor world. The bar is Igloo Inc, Lusion, darkroom.engineering and Active Theory: a WebGL hero, giant type, smooth scroll and cinematic reveals, executed at full craft. ACE should look like the leading tech club at SASTRA. The site introduces the club as a whole (who ACE is, clusters, team, how to join), not only its events.
- Social handles: LinkedIn `company/association-of-computing-engineers` and Twitter/X `@acesastra`.

## Evidence on Hand

- Real team photos: `public/images/CORE/` (office bearers) and `public/images/leads/` (cluster leads).
- A faculty image at `public/images/about/faculty.jpg`.
- Cluster artwork at `public/images/Clusters/`.
- A hero background video at `public/videos/hero-background.webm`.
- Real copy for the mission, principles and FAQ in `components/layout/sections/`.
- Real event, badge and registration data lives in Supabase.
- There are no testimonials, member counts, event statistics, sponsor logos or press coverage in the repo. Future work must not invent them.

## Product Principles

1. **Members first.** Optimise the repeat member's paths (find an event, register, pay, check badges) before the brochure.
2. **One place, no detours.** Every step of an event's lifecycle should happen on the site, not in scattered forms and chats.
3. **Participation is proof.** Badges, points and profiles should feel earned and be worth sharing outside the site.
4. **Thumb-ready.** Design for a student on a phone, often between classes, then scale up.
5. **Stay truthful.** Show real people, real events and real numbers, or show nothing.

## Accessibility & Inclusion

No formal standard has been confirmed. Both light and dark themes must meet contrast requirements, and mobile touch targets must stay comfortable.
