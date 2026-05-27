# CragTrails

**Find your next send.** A map-first, community-powered climbing guide that feels like AllTrails for the vertical world — joyful, radically simple, and obsessively focused on trust & safety.

> "Kids climb here. Every photo and route is reviewed." — CragTrails Trust & Safety banner

**🚀 [Live Demo](https://cragtrails.vercel.app)** — Try it now | [Deploy your own](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKolinCunningham%2Fcragtrails)**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green?style=flat&logo=leaflet)](https://leafletjs.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKolinCunningham%2Fcragtrails)

---

## 🚀 Live Demo

**Live Demo (recommended):**

→ **[https://cragtrails.vercel.app](https://cragtrails.vercel.app)**

(Deployed by the project owner on Vercel)

**One-click deploy your own instance:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKolinCunningham%2Fcragtrails)

After deploying your own copy, update the link above in this README and push.

The project is 100% compatible with Vercel (Next.js 16 + zero config).

For complete deployment instructions (CLI, env vars, custom domains, troubleshooting), see:
→ [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

**Local development:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Real Authentication (Apple, Google, Facebook, Email)**

CragTrails now supports real login via Clerk:

1. Copy `.env.example` → `.env.local`
2. Sign up at [clerk.com](https://clerk.com) (free tier is generous)
3. Enable Google, Apple, Facebook, and Email (magic links) providers
4. Add your `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`
5. Restart the dev server

You will then see proper social + email login flows instead of the demo profiles.

**What you'll experience immediately:**
- Real-time search that filters both the list **and** the interactive map
- "Near Me" (50-mile radius) using your browser geolocation
- Grade-colored markers (green = easy, red = hard) with intelligent clustering at low zoom
- Click anything → live preview card → beautiful full modal with "Log this ascent" (joyful toast feedback)
- All filters and selections sync instantly between list and map

This is not a static landing page. It is a working prototype of the core discovery experience.

---

## v0.1 — Built in a 30-Minute Skeptical CEO Sprint (May 2026)

This project was created in one intense 30-minute session using 10+ specialized AI subagents orchestrated under a **Skeptical CEO** model:

- Every proposal was assumed to be wrong, bloated, or the wrong priority until the agent provided clear proof.
- The CEO (lead) only approved changes that clearly served long-term simplicity for new climbers (including kids), real daily value for experienced climbers, trust & safety, and sustainable open governance.

**What shipped in this sprint:**
- Delightful hybrid map + list discovery
- Extremely satisfying one-tap send flow with conditions, photos, and instant feedback
- Rich personal logbook + interactive grade pyramid + community beta reports
- Yearly send goals + wishlist that update live
- Production-grade Admin/Trust console (photo moderation, data health, full audit log)
- Proper hierarchical data model designed for OpenBeta + Mountain Project + TheCrag + user contributions (with mandatory source attribution)
- Ironclad governance: Every future PR (human or AI) must answer the 4 Proof of Value questions or it gets rejected

**Current philosophy:**
We will ruthlessly protect the "simple enough for a 10-year-old" promise at the top level while delivering real power and joy for serious climbers inside the experience.

Core will always be free. Revenue (if any) will be minimal, transparent, and climber-first.

---

## Next (Real Work, Post-Sprint)

1. Wire the canonical data model + seed into the running UI
2. Add real auth + synced logbook (Clerk + Postgres or better)
3. Lightweight offline support + the cheapest possible premium unlock
4. Real OpenBeta import pipeline (respecting their CC0 model)
5. Continue the skeptical CEO process for every new feature

We would rather ship nothing than ship something mediocre.

Built by Skeptical Agents. Governed for the long term.

---

## Screenshots & Experience (Describe What You See)

### 1. Hybrid Map + List Explorer (Current Prototype)
A premium, calm interface with a sticky header containing the CragTrails logo, global search bar ("Search routes, crags, grades (V4, 5.12...)"), Near Me toggle, and Reset. 

Below: A hero statement "Find your next send." + a short explainer box titled "WHY THIS BEATS PURE LIST OR PURE MAP" that references AllTrails' success and the climber-specific "What's on the way?" use case (e.g., driving Bishop → Yosemite and discovering hidden boulders 11 miles off the highway).

The main view is a responsive grid:
- **Left (list panel)**: Scrollable cards showing route name, crag, type, grade badge (color-matched), stars, popularity ("sends"), and distance when Near Me is active. Active selection is highlighted.
- **Right (map panel)**: The full `CragMap` component — Leaflet-powered with OpenStreetMap tiles. Circle markers sized by popularity, colored by objective difficulty. Clusters at low zoom expand on click. Beautiful legend in bottom-right. Subtle "Click markers to preview • Clusters expand on zoom" hint.

Selection anywhere triggers a floating preview card (framer-motion animated) with quick actions. Full modal is a centered, spring-animated sheet with rich details, community rating bar, and massive primary actions.

Toasts (sonner) provide instant, delightful feedback — e.g., "Sent The Birthday Problem! Logged as a V4 send. Great work."

**Design principles visible**: 10-year-old friendly (large tap targets, 16px+ body text, never tiny UI), AllTrails-inspired joy, premium shadows and micro-interactions, dark mode support.

### 2. Trust & Safety Admin Console (Visit /admin)
A completely different, warm cream-and-forest aesthetic. Persistent top banner: **"CragTrails Trust & Safety • Admin Console"** with Shield icon and the line "Kids climb here. Every photo and route is reviewed. NON-NEGOTIABLE FOR SCALE".

Demo login (admin@cragtrails.app / demo) leads into a locked-down moderation environment. The layout includes a sticky header with "MODERATION + DATA TRUST" badge and a persistent footer explaining: *"Without strong admin tools, bad data and photos will drive away serious climbers and parents. Trust & safety is our #1 product feature."*

This is not theater — it is the philosophical core of the product.

### 3. Future / Envisioned Views (Styles & Types Ready)
Rich route cards with hero photos, community photo carousels (horizontal scroll, snap), condition reports with emojis, tick logbooks, "Send Pyramid" progress viz, bottom tab nav, massive "SEND IT" buttons, and photo upload flows — all styled and ready in `globals.css`. The richer data model in `lib/types.ts` (Areas, Routes with full betaNotes, photoUrls, sources attribution, Ticks, ConditionReports, Users) is designed for seamless merge from OpenBeta + in-app contributions.

---

## Why CragTrails?

Climbers don't need another noisy social network or unmoderated wiki. They need:

- **Spatial clarity on the drive** — "Is there anything good 20 minutes off my route?"
- **Trust** — Photos and beta that won't waste your day or put a 10-year-old in danger.
- **Simplicity without stupidity** — Big, obvious controls. No 17-step flows. Designed so a kid can navigate the core experience.
- **Open foundations + community soul** — We don't silo data. We build beautiful experiences on top of the open climbing commons while giving back.

We are deliberately *not* trying to be everything to everyone. We are building the climbing equivalent of a great trail app: fast, reliable, delightful, and safe.

---

## Quick Start

```bash
# Clone
git clone https://github.com/<your-org>/climbtrails.git
cd climbtrails

npm install
npm run dev
```

- Visit `/` for the explorer
- Visit `/admin` to see the Trust Console (demo credentials in the UI)

Requires Node 20+. Leaflet and framer-motion are already wired. No API keys needed.

---

## How to Contribute Routes, Data & Photos

CragTrails is built on two complementary contribution systems:

### 1. Core Route & Area Data — OpenBeta (Primary Source of Truth)
CragTrails is designed to ingest and beautifully present data from [OpenBeta](https://openbeta.io/), the free, open-source, community-driven climbing database (CC0 / Wikipedia-style for climbing).

**How to contribute data that will eventually power CragTrails:**

1. Go to [openbeta.io](https://openbeta.io/) and create a free account.
2. Find or create an area/crag page.
3. Use **"Add Climbs"**, **"Edit"**, or **"Add photo"** directly on route and area pages.
4. Changes appear quickly in OpenBeta's "Latest Contributions".

OpenBeta contributions (routes, grades, descriptions, locations, FA info, photos) flow into CragTrails with proper attribution (`sources: ["openbeta", ...]`). See `lib/types.ts` and `lib/seed-data.ts` for the exact schema.

**Resources:**
- [OpenBeta How to Contribute](https://openbeta.io/) (sign up + edit buttons on every page)
- Community forum: [community.openbeta.io](https://community.openbeta.io/)
- Discord, GitHub org (OpenBeta), and detailed docs in their repos
- Bulk/advanced: their climbing-data and open-tacos repositories

### 2. Community Content (Photos, Ticks, Conditions, Local Beta) — In-App
Personal ascent logs ("ticks"), condition reports ("Dry & bomber", emoji + photo), community photos, and on-the-ground beta notes are contributed **directly inside CragTrails**.

These flows are intentionally moderated through the Trust & Safety console before they appear publicly. This is non-negotiable.

- Prototype "Log this ascent" already exists in the modal (try it!).
- Full photo upload, condition reports, and rich tick logging are styled and architected (`globals.css` has `.community-scroll`, `.tick-card`, `.send-it-btn`, etc.).
- All user-generated visual content receives human review.

We credit sources rigorously and protect the experience for families and new climbers.

See `CONTRIBUTING.md` for the full Skeptical CEO process that governs all code and product changes.

---

## Built by Skeptical Agents

This project is not a typical open source free-for-all.

Every proposed change — no matter how small — must survive the **Skeptical CEO Review Process** (detailed in [CONTRIBUTING.md](CONTRIBUTING.md)).

The lead maintainer begins every review by assuming "this adds bloat or the wrong priority." Only after the contributor provides rigorous **Proof of Value** (real climber problem + quote or AllTrails analogy, simplicity impact on 10-year-old navigation, growth/retention evidence, and "why not simpler?") plus sign-off from at least one other reviewer does it get merged.

**Why this produces a better product long-term than normal OSS:**

Normal open source tends toward tragedy of the commons: enthusiastic contributors add "nice-to-have" features, scope creeps, UIs become complex, performance and maintainability suffer, and the original delightful core experience dies under a thousand papercuts. New climbers and kids are the first to leave.

CragTrails inverts this. The skeptical filter is a feature. It forces ruthless prioritization around the actual jobs climbers hire the app to do. It protects the radical simplicity and trust that are our differentiators. It reduces burnout for maintainers. It creates a high-signal environment where contributors know their time will result in something that ships and delights users for years.

The result is not slower shipping — it is *better* shipping. Focused products with strong opinions and obsessive quality win.

This governance model is core to CragTrails' identity. We are proudly built by Skeptical Agents who would rather ship nothing than ship something mediocre.

---

## Tech Stack & Architecture Notes

- **Next.js 16 (App Router)** + React 19 + TypeScript
- **Leaflet + react-leaflet** for the map (no API keys, fully client-side after hydration)
- **Framer Motion** + **Sonner** for joyful, accessible micro-interactions and toasts
- **Tailwind 4** + custom design system in `globals.css` (delightful, 10yo-friendly, AllTrails x climbing holds palette)
- Rich data model (`lib/types.ts`) built for OpenBeta + Mountain Project + TheCrag + user merges with mandatory source attribution
- Prototype seeds + admin auth foundation already in place

**Important for contributors:** This is *not* the Next.js from your training data. Read the guides in `node_modules/next/dist/docs/` before making code changes.

---

## License & Credits

Built with love for the climbing community.

Data foundations inspired by and designed to interoperate with [OpenBeta](https://openbeta.io/).

Special thanks to the volunteers maintaining open climbing data everywhere.

---

## Next Steps / Roadmap (Skeptical Filter Applied)

Only items that have survived Proof of Value will be built. Current focus: polish the existing map hybrid, wire richer data from `lib/seed-data.ts`, and ship the first real moderated contribution flows (photos + conditions) behind the Trust Console.

See open issues and the Skeptical CEO process before proposing new work.

---

**CragTrails — Climb. Discover. Protect. Trust is the product.**

*Built by Skeptical Agents who ask "why?" before every line of code.*
