---
name: ACE SASTRA
description: The School of Computing club at SASTRA, set in ink, bone and an electric ACE Blue field.
colors:
  ink-deep: "hsl(225 22% 4%)"
  ink-raised: "hsl(225 16% 7%)"
  bone-text: "hsl(50 12% 92%)"
  stone: "hsl(48 6% 64%)"
  rule-dark: "hsl(225 8% 17%)"
  wash-dark: "hsl(225 12% 11%)"
  ace-blue-bright: "hsl(213 100% 60%)"
  bone: "hsl(48 14% 93%)"
  bone-raised: "hsl(48 16% 96%)"
  ink: "hsl(225 22% 6%)"
  graphite: "hsl(225 6% 36%)"
  rule-light: "hsl(48 6% 78%)"
  wash-light: "hsl(48 10% 88%)"
  ace-blue: "hsl(213 100% 42%)"
  signal-blue: "hsl(213 100% 50%)"
  signal-ink: "hsl(225 30% 4%)"
  paper-white: "hsl(0 0% 100%)"
  alarm-red: "hsl(4 78% 48%)"
  alarm-red-bright: "hsl(4 80% 58%)"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 8.6vw, 8rem)"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "-0.04em"
    fontVariation: "\"wdth\" 112"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.04em"
    fontVariation: "\"wdth\" 108"
  manifesto:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5.2vw, 5.25rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
    fontVariation: "\"wdth\" 105"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body-lead:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.375
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.08em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.06em"
    fontFeature: "\"tnum\" 1"
rounded:
  none: "0px"
  emblem: "9999px"
  legacy-primitive: "0.375rem"
spacing:
  gutter: "20px"
  gutter-sm: "32px"
  grid-gap: "32px"
  row-y: "24px"
  row-y-lg: "40px"
  section-y: "96px"
  section-y-lg: "144px"
  container-max: "1600px"
components:
  button-primary:
    backgroundColor: "{colors.ace-blue}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.none}"
    height: "56px"
    padding: "0 24px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "56px"
    padding: "0 24px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
  button-compact:
    backgroundColor: "{colors.ace-blue}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.none}"
    height: "48px"
    padding: "0 20px"
  button-on-signal:
    backgroundColor: "{colors.signal-ink}"
    textColor: "{colors.signal-blue}"
    rounded: "{rounded.none}"
    height: "48px"
    padding: "0 20px"
  button-on-signal-hover:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.signal-ink}"
  nav-auth:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    rounded: "{rounded.none}"
    height: "40px"
    padding: "0 16px"
  nav-bar:
    backgroundColor: "{colors.bone}"
    height: "64px"
    padding: "0 32px"
  icon-square:
    backgroundColor: "transparent"
    rounded: "{rounded.none}"
    size: "48px"
  input-underline:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.none}"
    padding: "8px 0 12px"
  ruled-row:
    backgroundColor: "transparent"
    padding: "24px 0"
  photo-tag:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "4px 8px"
---

# Design System: ACE SASTRA

## Overview

**Creative North Star: "The Signal Field"**

ACE is drawn in two materials and one charge. Ink and bone (ink ground in dark mode, inverted to bone in light) carry everything structural; ACE Blue, derived from the logo's blue and pushed electric, is the charge. It marks the one thing that matters on a line, and once per page it floods an entire section as a full-bleed field. The type does the shouting: Archivo's width axis is stretched to 112% at weight 800 and set at viewport scale, with tight negative tracking and lines that nearly touch. Everything else is quiet: 1px hairlines, square corners, generous section rhythm, and small uppercase sans labels.

The structure is editorial, not app-like. Content sits on a 12-column grid inside a 1600px frame and is organised as ruled lists (rows separated by hairlines) rather than as boxes. Depth comes from inversion and motion, not elevation: an inked panel, a blue field, a masked line rising into place. Motion is expo-out throughout and always degrades to static, fully visible content under reduced motion or without JavaScript.

The system was built against the stock template it replaced: centred gradient headlines, background video, icon cards and team cards. None of those exist here.

**Key Characteristics:**
- Ink and bone, inverted between dark and light mode; ACE Blue as the single accent.
- One drenched blue field per page (the clusters section on the landing).
- Archivo variable at giant display scale, width axis stretched; JetBrains Mono reserved for data.
- 1px hairlines and square corners; no cards, no glass, no gradients.
- Ruled lists as the primary content structure.
- Expo-out motion: masked line reveals, blur-up fades, clip reveals, Lenis smooth scroll.

## Colors

A two-material neutral pair, inverted per theme, with one electric blue that marks and occasionally floods.

### Primary
- **ACE Blue** (`ace-blue`, light mode): the accent for primary actions, the last word of a display headline, active nav underlines, focus-row rules, event-type labels and the live dot. Carries white text.
- **ACE Blue Bright** (`ace-blue-bright`, dark mode): the same role lifted for ink grounds. Carries signal ink text, not white.
- **Signal Blue** (`signal-blue`, both modes): the field colour. Floods whole sections (clusters), fills the preloader progress bar and the text selection. Text on it is **Signal Ink** (`signal-ink`).

### Neutral
- **Bone** (`bone`) / **Ink Deep** (`ink-deep`): page grounds for light and dark mode.
- **Ink** (`ink`) / **Bone Text** (`bone-text`): body and display text in light and dark mode. Also the inverted panel colour (the contact section and the preloader are set foreground-on-background reversed).
- **Bone Raised** (`bone-raised`) / **Ink Raised** (`ink-raised`): the card/popover token, used only by menus and popovers.
- **Graphite** (`graphite`) / **Stone** (`stone`): secondary text, captions, labels.
- **Rule Light** (`rule-light`) / **Rule Dark** (`rule-dark`): every hairline.
- **Wash Light** (`wash-light`) / **Wash Dark** (`wash-dark`): image placeholders and loading skeletons.
- **Alarm Red** (`alarm-red`) / **Alarm Red Bright** (`alarm-red-bright`): form errors only.

### Named Rules
**The One Field Rule.** Signal Blue floods at most one full-bleed section per page. Everywhere else blue is a mark on a single word, line or control, never a background wash.

**The Inversion Rule.** Panels gain emphasis by swapping ink and bone (foreground becomes background), never by adding a tint, a gradient or a shadow.

## Typography

**Display Font:** Archivo variable, width and weight axes (with ui-sans-serif, system-ui)
**Body Font:** Archivo (same family)
**Data Font:** JetBrains Mono (with ui-monospace)

**Character:** One grotesque family stretched across its axes does all the voice work, from 112%-wide 800-weight headlines to 11.5px uppercase labels. Mono appears only where the content is a machine value.

### Hierarchy
- **Display** (800, width 112%, clamp(2.4rem, 8.6vw, 8rem) on the hero, clamp(2.75rem, 6vw, 5.5rem) to clamp(3rem, 10vw, 9.5rem) for section heads, line-height 0.88, tracking -0.04em): section headlines, always written as one or two short lines and revealed line by line. On phones the hero drops to width 100% so it can run at 13.4vw. The footer wordmark runs at 38vw.
- **Headline** (700, width 108-110%, clamp(1.75rem, 4vw, 4.75rem), line-height 0.95-1, tracking -0.04em): titles of ruled-list rows (clusters, focus areas, principles) and the mobile menu.
- **Manifesto** (600, width 105%, clamp(2rem, 5.2vw, 5.25rem), line-height 1.02, tracking -0.035em, max 22ch): the scroll-scrubbed statement paragraph.
- **Title** (600, 1.25-1.5rem, tracking -0.02em): event names, team names, sub-heads.
- **Body lead** (400, 1.125rem, line-height 1.375): section intros, max about 36rem.
- **Body** (400, 1rem, line-height 1.625, max 60-65ch): descriptions and answers, usually in muted text.
- **Label** (600, 11.5px, tracking 0.08em, uppercase): field labels, captions, corner data, small links.
- **Data** (JetBrains Mono 400, tracking 0.06em, tabular figures, 12px up to 2.25rem): dates, times, coordinates, counts, the preloader counter.

### Named Rules
**The Mono Is Data Rule.** JetBrains Mono sets only machine values: dates, times, coordinates, counts. Labels, captions and UI copy stay in Archivo.

**The Two-Line Headline Rule.** Display headlines are short declaratives split into reveal lines ("Show up. / Level up."). The accent, if any, falls on one whole line or word in ACE Blue.

## Layout

A 1600px maximum frame with 20px side gutters, 32px from 640px up. Inside it, a 12-column grid with a 32px gap from 1024px; content typically splits 5/7, 4/8 or 7/5, with the right column often offset by a column start. Below 1024px everything stacks to a single column.

Sections breathe: 96px vertical padding, 144px from 640px (the about section runs 112/160). Sections are separated by a full-width hairline or by a change of material (blue field, inverted panel), never by a coloured band. Ruled-list rows take 24-40px vertical padding. Section intros that sit beside long lists stick at 112px from the top on desktop. The fixed nav is 64px tall and hides on scroll down.

Breakpoints are Tailwind's defaults: 640, 768, 1024, 1280, 1536px.

## Elevation & Depth

The system is flat. Depth comes from material inversion (ink panel, blue field), from motion, and from photography with slight scroll parallax (strength 0.08-0.1). The build reserves a single shadow for a floating emblem on the blue field; the current cluster reel does not use it.

### Shadow Vocabulary
- **Emblem float** (`box-shadow: 0 30px 60px -20px rgba(2,16,55,0.6)`): only under the circular cursor-follow emblem.

### Named Rules
**The Flat Field Rule.** Containers, controls and panels never cast shadows. If something needs emphasis, invert it or rule it.

## Shapes

Corners are square (0px) on every container, button, input, tag, skeleton and image frame. Structure is drawn with 1px hairlines in the rule colour (or the foreground at 20-30% on inverted and blue grounds); a full-strength 1px foreground rule marks a single emphasised block. Small solid squares (6px live dot, 12px marquee separator) act as bullets. The only curve is the circle: cluster emblems are always cropped to a full circle. Photographs sit at fixed aspect ratios (4:3, 3:2, 3:4 portraits). Hover rules grow from the left as 1px ACE Blue lines.

The 0.375rem radius token survives only inside legacy shadcn primitives and is not part of the language.

## Components

### Buttons
Blunt, wide and tactile: a slab of colour with the label at one end and an arrow at the other.
- **Shape:** square (0px), 56px tall for primary calls to action, 48px for secondary placements, 40px in the nav. Label left, Lucide arrow right, `justify-between`, minimum width 14-16rem on the hero.
- **Primary:** ACE Blue with white (light) or signal ink (dark) text, 600 weight, 24px horizontal padding.
- **Hover / Focus:** inverts to foreground on background over 300ms; the arrow nudges 4px along its direction; press scales to 0.98. Focus is a 2px ring-colour outline offset 3px.
- **Outline:** transparent with a 1px foreground-at-25% border; hover fills with foreground and inverts the text.
- **On the blue field:** signal ink slab with Signal Blue text; hover turns white.
- **Icon square:** 48px square, 1px rule border, fills with foreground on hover (team carousel controls).

### Ruled Lists
The signature structure, used for events, clusters, focus areas, principles, about offers and FAQ.
- **Structure:** a top hairline, then each row closed by a bottom hairline. No backgrounds, no boxes.
- **Row grid:** a fixed leading column (mono date, emblem or term), a flexible headline column, an optional description column, and a trailing arrow.
- **Hover:** the headline slides 8-16px right with expo-out over 500-700ms, the arrow lifts diagonally, a 1px ACE Blue rule grows across the top, and sibling rows on the blue field recede to 40% opacity.
- **Focus list:** (events, focus areas) the row nearest the viewport centre is "in focus" (full opacity, blue rule); others recede to 40% on desktop.

### Cluster Reel (signature)
The clusters section on the landing, set on the Signal Blue field.
- **Desktop with motion:** the section pins for one viewport and vertical scroll drives a horizontal track. Frame one is the headline (three reveal lines) with the intro and recruitment button; eleven cluster panels follow; an ink "Found yours?" slab linking to recruitment closes the reel.
- **Panel:** 25vw wide (clamp 19-27rem), separated by 1px signal-ink hairlines at 30%. Mono position (`05 / 11`) and an arrow on top, the animated cluster drawing in the middle, a headline-scale title and the first sentence of the description at the foot.
- **Focus:** the panel nearest the viewport centre animates its drawing at full opacity; the rest rest at 40% and 94% scale.
- **Hover / keyboard focus:** an ink slab wipes up from the bottom (clip-path, 700ms expo-out), turning the panel's text and drawing Signal Blue (the Inversion Rule); the title slides 8px right. Keyboard focus also drives the pinned reel to the focused panel.
- **Index rail:** a hairline under the reel fills with scroll progress; eleven tick buttons (44px tall hit areas) jump to a cluster; the mono counter and the cluster name rise in as the cluster in view changes.
- **Phones, tablets and reduced motion:** a native horizontal swipe track with snap points, 82vw panels, the same rail. No pinning.

### Principles Charge ("What we stand for")
- **Desktop with motion:** the section pins for about 3 viewports of scroll. The six principles are stacked at display scale (800, width 112%, min(6.1vw, 8.4svh, 6rem)) in cols 1–8, dormant at foreground 13%. Scroll charges each word in turn: a solid ink layer fills it left to right (clip-path) behind a 0.05em ACE Blue caret. The active word steps 0.36em right with a small ACE Blue square marker; finished words rest in muted stone.
- **Right column:** the intro sits at the top. At the foot are a mono count (`04` rolling up through a mask, `/ 06`), a six-segment 2px rail filling in ACE Blue, and the active principle's text, which swaps with the blur-up fade.
- **Interaction:** each word is a button that eases the scroll (Lenis) to that principle.
- **Phones, tablets and reduced motion:** a ruled list. On phones and tablets each word charges as it crosses the viewport. Under reduced motion or without JS every word is solid and every description visible.

### Inputs / Fields
- **Style:** underline only. Transparent ground, 1px bottom border at 30% of the text colour, no side borders, 0px radius, 1.125rem text, a label in the label voice above.
- **Focus:** the underline turns ACE Blue.
- **Error:** the underline and a 14px message below turn Alarm Red.

### Navigation
- **Bar:** fixed, 64px, transparent over the hero, gaining the page ground and a bottom hairline once scrolled; hides on scroll down and returns on scroll up (500ms expo-out).
- **Links:** 14px, 500 weight, muted at rest, foreground on hover and when active; the active link carries a 1px ACE Blue underline that scales in from the left.
- **Auth:** square ink slab (40px), turning ACE Blue on hover; the signed-in avatar is a 40px ink square with initials.
- **Mobile:** a full-screen panel wiped open with a clip-path (700ms, cubic-bezier(0.76,0,0.24,1)); links are headline-scale ruled rows that rise in with a 50ms stagger; a two-bar menu glyph crosses into an X.

### Labels and Photo Tags
The label voice (11.5px uppercase Archivo) carries captions beneath photographs (two-ended, left and right), corner data on the hero, and field labels. Over a portrait, a position tag is a bone square with a label inside, pinned 12px from the top-left corner.

### Particle Mark (signature)
A full-bleed WebGL particle field that assembles the ACE "A" in the hero and disperses away from the cursor, coloured live from the foreground and primary tokens so it follows the theme. Under reduced motion it renders once, assembled and still.

### Survey Frame (hero background)
The hero's background is a survey instrument, not decoration: no cards, tiles or cluster art behind the mark.
- **Frame:** 1px column hairlines on the page grid (4 columns on phones, 12 from 1024px) run between two horizontal rules (176px from the top on desktop, 164px on phones; 72px from the bottom). The columns fade out radially around the particle mark and headline. 11px registration crosses sit where the rules meet every third column.
- **Rulers:** tick rulers run down both edges from 640px up (minor tick every 8px, major every 40px, foreground at 30%).
- **Crosshair (fine pointers only):** full-hero ACE Blue hairlines at 45% follow the cursor on exponential smoothing (90ms) and meet at the club cursor. A bordered mono readout turns the pointer position into latitude and longitude around campus (10.73° N, 79.02° E, about 1km across the hero), flipping sides near the edges. Blue ticks mark the position on both rulers.
- **Motion:** columns draw down (1.7s expo-out, 45ms stagger), rules draw across, and crosses spin and pop in, all held until the preloader lifts. The frame fades out as the hero scrolls away. Reduced motion shows the static frame with no crosshair.

### Code Field ("In action")
"ACE" set as a grid of JetBrains Mono glyphs on Signal Blue, revealed by the pinned "In action" window.
- **Tone:** each cell's depth inside the letters (a blurred mask) picks its glyph from a density ramp (`. : - = + / < > ! ? … $ % & # C E A @`), light at the edges and heavy in the core; glyphs re-type within a narrow band of that weight, so the word reads with tone rather than flat noise (after Aino, Awwwards SOTD 20 May 2026).
- **Eased cursor:** the field follows a critically damped spring on the pointer (SmoothDamp, smooth time 80ms; 450ms for the ghost), never the raw pointer. Velocity stays continuous, so the lens eases into motion, never overshoots, and reaches 85% of a 500px jump in about 110ms and 98% in about 210ms (measured). The glyph springs carry the softer secondary motion. The effect's presence fades in and out instead of switching.
- **Spring glyphs:** every glyph sits on an underdamped spring. The cursor pushes glyphs out of its path and drags them along its velocity, so the field parts and settles back with a small overshoot.
- **Lens:** near the cursor, glyphs crossfade from signal ink to white, re-type faster and swap to heavier glyphs; dots outside the letters surface as glyphs. A 1px white ring with a mono X/Y readout rides the eased cursor, flipping sides near the field's edges; until the first click a CLICK hint in the label voice sits under the readout.
- **Shockwave:** a click or tap sends a ring through the field.
- **Ghost cursor:** with no pointer over the field (phones, or a mouse elsewhere), a cursor drifts on a slow Lissajous path at reduced strength.
- **Performance:** a pre-rendered glyph atlas drawn with drawImage at 60fps, only while on screen. Reduced motion renders one still frame.

### Preloader (signature)
Once per session, an inverted panel shows "ACE" at display scale with a mono counter running 000 to 100 over 1.6s and a 1px Signal Blue progress line; it then wipes upward over 1s (cubic-bezier(0.76,0,0.24,1)). Skipped before first paint on repeat visits and under reduced motion.

### Motion Grammar
- **Masked line reveal:** each display line rises from 125% below a clip over 1.1s expo-out, with a 70ms stagger per line.
- **Blur-up fade:** opacity 0, 8px blur and 24px offset resolve over 1-1.2s expo-out, with a per-item delay.
- **Clip reveal:** photographs open from the bottom over 1.4s while the image settles from 125% scale over 1.8s.
- **Scrub text:** manifesto words brighten from 16% to full opacity as the paragraph scrolls through the viewport.
- **Marquee:** outlined display words with blue square separators, 38-40s linear loop.
- **Smooth scroll:** Lenis, 1.15s exponential ease-out, routing in-page anchors.
- **Fallback:** everything is visible by default; hiding classes are added by JavaScript only, and reduced motion disables Lenis, reveals, clip, marquee and pulse.

## Do's and Don'ts

### Do:
- **Do** set structure with 1px hairlines and square corners (0px) on every container and control.
- **Do** keep ACE Blue to one mark per line or control, and flood Signal Blue across at most one full-bleed section per page.
- **Do** set display headlines in Archivo 800 at width 112%, tracking -0.04em, line-height 0.88, split into reveal lines.
- **Do** use JetBrains Mono only for dates, times, coordinates and counts, with tabular figures.
- **Do** present collections as ruled lists with a leading column, a headline column and a trailing arrow.
- **Do** ease everything with cubic-bezier(0.16, 1, 0.3, 1), and keep content visible without JavaScript and under reduced motion.
- **Do** emphasise a panel by inverting ink and bone.
- **Do** crop cluster emblems to full circles; it is the only curve in the system.

### Don't:
- **Don't** use cards, glass, backdrop blur or tinted boxes to group content.
- **Don't** use gradients, including gradient text.
- **Don't** put small uppercase eyebrows above headlines; the label voice is for captions, fields and data only.
- **Don't** set labels or UI copy in mono.
- **Don't** cast shadows from containers, buttons or panels; the emblem float is the only shadow.
- **Don't** use the 0.375rem radius token on new surfaces.
- **Don't** use background video or centred hero stacks.
