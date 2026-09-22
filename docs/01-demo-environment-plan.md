# Builder Content Demo Environment — Comprehensive Plan

**Author's note:** Every feature claim below is grounded in Builder docs fetched 2026‑09‑21, a live read of the `Shopaholic Platform` space via the Builder CMS MCP, a full clone of `BuilderIO/unified-demo`, and evidence from Gong/Granola/Slack. Where the docs do not state something, it is marked **NOT VERIFIED** — don't assert it on a call.

---

## 0. TL;DR

Build a new demo as **one brand with four content surfaces** — retail storefront, help center, B2B/trade campaign, and a regulated financial product page — sharing a single governed design system and one component library. That covers ~90% of the pipeline (retail is the largest single cluster but only ~half of it) without building four demos.

Rebuild the app in a **new repo on the Gen 2 `@builder.io/sdk-react`** (not the undocumented `sdk-react-nextjs` 0.x — see §7.1). Build content in **new, clean spaces** you own, leaving `Shopaholic Platform` untouched as an archive.

The single highest-leverage thing in this whole plan is **§8: making A/B and Insights show real data.** That's your biggest current gap, it's solvable, and nobody else's demo has it.

Realistic effort: **~20–25 working days** for the full build; **~8–10 days** for a demoable MVP (§11).

---

## 1. What's actually wrong today — the evidence

### 1.1 The live site is visibly broken right now

Fetched `hunter-unified-demo-ecomm.vercel.app` on 2026‑09‑21. On the homepage, above the fold and below:

- **"No product found."** renders as body text inside the "SHOP OUR FAVORITES" product grid — one of four `ProductCard`s fails to resolve.
- The footer ships **lorem ipsum** to production: *"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam posuere erat a ante vestibulum…"*
- The tracking pixel fires with API key `f2f3655202764523914b8dbf61505ee8`, while every image asset loads from space `a87584e551b6472fa0f0a2eb10f2c0ff` (`Shopaholic Platform`). **The deployed app is pointed at a different space than the one holding its assets.** Worth confirming which space you're actually editing when you demo.

### 1.2 Things a prospect will click on and find hollow

From the repo clone — these are in `main` today:

| What | Reality |
|---|---|
| Cart icon | Opens shadcn's unmodified docs example: **"Edit profile… Name: Pedro Duarte, Username: @peduarte"** |
| Account button | Same file, same Pedro Duarte |
| Mobile nav | Same file, same Pedro Duarte |
| PLP filters (category/color/size) | State is tracked and **never applied** to the product list. Size swatches render the integers **0–17**. |
| Pagination | A static `<img>` and literal text `1 2 3`. No handlers. |
| "ADD TO CART" | `console.log("Add to cart clicked")`. There is no cart in the app. |
| `/custom-components` | Renders **blank** outside the editor — no `content` prop is ever passed. |
| `/help-center`, `/stores` | Fetch with `urlPath: "/"` — they target the homepage, not themselves. |
| `CustomText` product links | Emit `/products/{handle}`; the real route is `/product/{handle}`. Every link 404s. |
| Rendered typo | `you&rsquore done` appears literally on screen in three components. |

Three of those (cart, account, mobile nav) are the *first* things a prospect clicks unprompted.

### 1.3 The design system is decorative

`builder-registry.ts` registers a complete, good-looking token set — 10 colors, 3 spacings, typography scales — every value written as `var(--color-primary, #000000)`, `var(--space-large, 20px)`, and so on.

**None of those CSS custom properties are defined anywhere in the codebase.** `globals.css` defines a *different* namespace (the shadcn one: `--primary`, `--muted`, `--background`). So all 30 tokens silently fall through to their hardcoded literal fallbacks. The Builder token picker works and looks great; changing the app's theme changes nothing; and the values have already drifted (registry `Muted` = `#C8E2EE`, app `--muted` = `#18B4F4`).

Also: `body { font-family: "Poppins" }` — **Poppins is never loaded.** No `next/font`, no `<link>`, no `@font-face`.

And the ugly hand-rolled `Accordion` (inline styles, hardcoded `#f5f5f5`) is the one registered with Builder, while the proper Radix accordion sits unused next to it.

### 1.4 Nine components are invisible on most models

`builder-registry.ts:88-110` registers the `Layout` and `Blocks` insert menus **only when `builder.editingModel === "homepage"`**. So `Columns`, `Carousel`, `Collection`, `Accordion`, `AlgoliaSearchBox`, `CloudinaryImage`, `BynderImage`, `Core:Button` and `Counter` don't appear in the insert menu on any other model. On a call this reads as "the component library is missing."

### 1.5 The space is full of other people's work

29 models in `Shopaholic Platform`, including `ring-category`, `ring-product`, `ring-nav`, `mntn-page` ("MNTN Summer Sale Page"), `event-pricing` (displayName: **"Veronika - Event Pricing"**), `test-product-data`, and a `test-123` model whose fields are **lorem ipsum defaults**.

The page list is worse: `/test`, `/test-test`, `/xyz`, `/sammons-test-page`, `/veronika-sneaker-collection`, `/sneakers`, `/sneaker-collection-landing-page`, `/new-sneaker-collection` — three near-duplicate sneaker pages.

Any screenshare of the content list shows this.

### 1.6 Architectural debt

- **Gen 1 SDK** (`@builder.io/react` 9.0.0) on **Next.js 14.2** (current: 16.x), React 18.
- `export const dynamic = "force-dynamic"` on **every** route — no caching, no ISR. Every page render hits the CDN fresh. You cannot tell the performance story from this app.
- `builder.init()` called **13 separate times**.
- `enrich` is never passed to a server fetch; in `app/product/[handle]/page.tsx:39` it's nested **inside `userAttributes`**, so it becomes a targeting attribute. `Collection.tsx` works around the missing enrichment with a hand-rolled paginated client-side `fetch()` loop.
- **Five commerce backends** wired into one `ProductCard`. Emporix is stubbed with `clientId: "XXXXXXXXXXX"` and renders a **$9,999** placeholder. Commercetools has no client at all. `lib/emproix/` — the directory name is misspelled.
- `.env` is **committed to a public repo** (and has been since 2024, so it's in history permanently). All values are `NEXT_PUBLIC_*` publish-scope keys so blast radius is low — but **confirm the Algolia key is search-only, not admin.** The file also carries a commented-out line labeled `#Nestle Ecomm API key` — a customer name in a public repo. Worth flagging to whoever owns that repo regardless of this project.
- `rgbaToHex()` throws on malformed input and is called unguarded during render — one bad color value in `product-data` white-screens the PDP.
- `ProductDetails.tsx:217` carries an unfixed `// FIXME:` about the PDP refetching and getting the wrong content.
- `react-instantsearch-dom@6` is npm-deprecated and uses the connector API removed in v7. Its CSS is never imported, so Algolia search renders unstyled.
- No CI, ever. No tests. 50 branches on origin. 2026 commits are almost entirely AI-authored `ai_main_*` fix-up PRs on a mid‑2024 architecture.

---

## 2. What prospects actually want (Gong / Granola / Slack)

Ranked by frequency across ~200 meetings:

**Tier 1 — lead with these**
1. **Targeting/personalization + A/B testing** (one buying theme). Most-mentioned by a wide margin. Al Tayer's written requirement list: *"content slot on front end - rule based… Scheduling | multi-scheduling… Conflict handling… Experimentation… Ab testing."* Visme's real pain is **flicker**: *"variant swap page might not load fully so visitors have an odd experience."*
2. **Localization / multi-market.** Spartan (~15 languages), **Al Tayer (English + Arabic in one component, explicitly without duplicating components)**, Lifeplus (locale-based approvers), Trade Nation (Welocalize/Phrase), SiteOne (Spanish).
3. **Governance — roles, permissions, approval workflows.** Nørgård Mikkelsen, Jabil, Lifeplus (read-only approval role), **Cinch (preview links for non-seat reviewers)**, Golden Charter, Polyconcept, IHG.

**Tier 2**
4. **Design systems / tokens / component registration.** SiteOne's exact tension: *"too much editor freedom risks design system integrity; too little constrains the team."* Al Tayer wants **token tiering**. Lifeplus wants **locked properties**.
5. **Figma import / design-to-code.** Central to Spartan and SiteOne. **Caveat:** internal Slack (`#product`, Adam Murray, Aug 4) — Figma is *"boxing us out from the MCP direct route."* Don't build a demo whose spine depends on Figma MCP.
6. **Data sources / integrations.**

**Tier 3**
7. **Scheduling.** Highest intensity at Al Tayer, where it's a current *failure*: *"No campaign scheduling allowed."*
8. **Multi-environment.** Al Tayer (dev/UAT/prod), Lifeplus, Trade Nation, Cinch, Camunda.

**Themes you didn't list that recur as much as your Tier 2 — add these:**
- **Guardrailed authoring for non-technical editors.** Jabil's explicit #1 priority. SiteOne: *"~90% of content requires some code knowledge."*
- **DAM / asset management.** Al Tayer is evaluating **CMS and DAM together** and has no DAM today — wants AI tagging, metadata, asset variants/ratios.
- **SEO / structured data / AEO.** Jabil. Spartan asked whether Builder components are **crawlable** — a direct consequence of your `force-dynamic` setup today.

### The loudest objection, by far: "show me with *our* data"

- **Al Tayer:** *"Unless we see… a demo with our own platform, it will be difficult to say… how good it is. So that's a concern."*
- **Macmillan:** the demo *"felt… a little marketing"* — they wanted support/knowledge-base examples, not marketing sites.
- **Papaya Global:** *"We need to see it in action to see it to know if it's really possible."*
- **TV3:** wanted a small end-to-end POC with *their* Figma and APIs; compared Builder unfavorably to a vendor who did it *"in a couple of days."*
- **KPMG** (Slack): *"it will really click once they can get hands-on with a KPMG-specific use case."*

**This is a design requirement, not a nice-to-have.** §10.3 addresses it directly.

### Competitive context worth building for

Contentful is the clear #1 competitor (PMI, Spartan, Auto Europe, Camunda, Al Tayer incumbent, Vast Data, DoorDash). **The Salesforce/Contentful acquisition is actively accelerating deals** — DoorDash's move *"is being accelerated by the news of SF buying Contentful. They have very low opinion of SF."* Vast Data asked for a Contentful→Builder migration reference and Builder had none.

A **live Contentful→Builder migration** is the highest-leverage competitive asset you could build into this demo — but note there's no documented migration *product*, so it's an asset you build rather than a feature you show. See §10.4.

---

## 3. Design principles for the new demo

1. **Nothing on screen is fake that a prospect might click.** If it's rendered, it works — or it isn't rendered.
2. **Every claim is demoable.** No "and you could also…" for things that need data we don't have. If A/B results are part of the story, there is real data behind them.
3. **One brand, four surfaces.** One design system, one component library, four content sets. Swap the surface to match the vertical; never rebuild.
4. **Fails soft.** Every data-bound component has a static fallback. A Shopify or Algolia hiccup mid-call degrades to a sensible default, never a blank section.
5. **Resettable.** A single command restores the demo to a known state. You run this weekly; it must survive being edited live.
6. **Current naming.** "Builder Content" (not Publish), "Builder Code" (not Fusion/Projects), "Visual Editor AI" (not Visual Copilot — that brand is dead). Note: **the docs site is mid-migration and serves both label sets from the same URLs.** Don't promise consistent naming on screen.

---

## 4. The brand and the four surfaces

### 4.1 Brand

**Recommendation: "Fieldnote"** — an outdoor and travel gear retailer with a trade arm and a co-branded card. Alternates if you'd rather: *Kestrel*, *Harborline*, *Cairn Supply*.

Why a retailer with those arms: it's a real, common corporate structure (Nordstrom card, Home Depot Pro, REI Co-op), so four very different content surfaces live plausibly under one CMS and one design system. That's the whole point — you demo *one* governed setup, and it covers a retail prospect, a B2B SaaS prospect, a financial services prospect, and a support-content prospect without you switching apps.

Avoid: anything close to a real brand. Fully fictional only.

### 4.2 The four surfaces

| Surface | Route | What it proves | Who it's for |
|---|---|---|---|
| **Fieldnote** — retail storefront | `/` | Merchandising, product data, promos, scheduling, A/B, targeting, localization | SiteOne, Black Rifle, Polyconcept, Brilliant Earth, Al Tayer, Spartan, Bestseller |
| **Fieldnote Help** — support / KB | `/help` | Structured content at scale, search, article taxonomy, non-marketing content | **Macmillan** (who explicitly rejected marketing framing), Jabil, ZocDoc, Genetec |
| **Fieldnote Pro** — B2B / trade | `/pro` | Campaign landing pages, gated content, lead capture, segment targeting | Camunda, Visme, Staffbase, Connecteam, Data Axle, Vast Data |
| **Fieldnote Card** — financial product | `/card` | Regulated content, mandatory disclosures, legal review gating, approval workflow | BlackRock, JPMC, Capital One, Bank OZK, Golden Charter, FE fundinfo, IAG Loyalty |

The Card surface is doing double duty: it's the FS-vertical proof **and** it's what makes the governance demo land, because a compliance-gated disclosure is a workflow rule anyone believes.

---

## 5. Spaces and environments

You're setting these up yourself — here's the shape to aim for.

```
Organization: Fieldnote (demo)
│
├── Space: Fieldnote            ← type: HYBRID  (Code + Content, the demo)
│   ├── Environment: main       (production content, what you demo)
│   ├── Environment: staging    (the "UAT" story)
│   └── Environment: dev        (the developer sandbox — and where MCP
│   │                            model writes should land, see below)
│   └── Builder Code project    (connected to the demo repo)
│
├── Space: Fieldnote Sandbox    ← type: Hybrid   (your scratch space)
│
└── Space: Fieldnote Scaffold   ← type: Hybrid   (disposable — for demoing the
                                  sub-agent setup flow live; see doc 07 §5.2)
```

⚠️ **MCP model writes are a production hazard.** From Builder's own Fusion + Publish blueprint: *"The MCP makes direct content model updates. This has to happen in a lower environment or it will break production immediately."* So when an agent creates or modifies models over the CMS MCP — which is most of Phase 3 — **point it at `dev`, not `main`**, then push up. This is on Builder's own enhancement backlog ("Support for Publish Environments"), so treat it as a live sharp edge rather than a solved workflow.

**Facts to build around** (docs: `/c/docs/environments-intro`, `/c/docs/using-environments`, `/c/docs/managing-spaces`):

- **Space type is chosen at creation — pick Hybrid.** ✅ **Correction from an earlier draft of this plan:** Hybrid spaces are real, in production, and are what Builder's own Fusion + Publish blueprint **recommends for new customers**: *"Hybrid space — a single space that contains both Fusion and Publish capabilities. Recommended for new customers."* A Hybrid space still presents as two product sections (Code and Content) that talk to each other over the MCP. The space-type doc doesn't define it, which is a docs gap, not a product gap.
  *(Whether space type is immutable after creation is still **NOT VERIFIED**. Choose correctly anyway.)*
- **Environments are nested inside a Space** — they are *not* separate spaces. Enterprise feature. **3 total including `main`** (so main + 2). Each gets its own Public API key.
- **Live Sync is on by default and is one-way, main → child, in real time.** To demo a promotion flow you disable Live Sync per-model or per-entry, edit in `dev`, then **Push** child → main.
- **Gotchas that will bite you live:**
  - Re-enabling Live Sync **overwrites all unpushed changes in the child**.
  - A push pushes *all users'* changes on that entry, not just yours.
  - Webhooks must be migrated between environments manually.
  - Push order matters: **models → dependent content such as Symbols → content**.
  - **Resync is selective now, not destructive** — you choose which items to copy from the parent, and environment-specific data (Custom Targeting, Users, Custom Roles, Breakpoints, Plugins) is opt-in and retained. Design Tokens, Advanced Settings, Fonts and Code Gen Instructions sync by default.
- **Cross-space copy:** entry → three dots → *Copy to another space* — you can create a new entry **or select an existing one** to copy into. Whole space: Settings → three dots → **Duplicate Space** (Enterprise), or `POST https://cdn.builder.io/api/v1/copy-space/create-space?apiKey={privateKey}`.
- **There is no documented CLI for cross-space content sync.** The "Projects CLI" in the nav is Builder Code. Don't promise one.

**Deep-link trick worth knowing:** `?useSpace=<PUBLIC_API_KEY>` jumps straight to a space. Bookmark one per environment so you never fumble the space switcher on a call.

---

## 6. Content model architecture

29 models today, most of them accidental. Target: **14 intentional models.**

### 6.1 The models

A note on naming: the MCP and API report Section models as `kind: "component"` in this space today — but **the docs list `data`, `component`, `page`, `section` and `symbol` as five distinct kinds**, so the mapping is **NOT VERIFIED** as a documented rule. Verify it in your new space; don't state it as fact to a developer.

#### Page models (2)

**`page`** — the generic catch-all, `/[...]`
```
blocks         uiBlocks   required
title          text       required
seoTitle       text
seoDescription longText
ogImage        file
noindex        boolean
```

**`landing-page`** — campaign pages with a required end date, so nothing sits live forever
```
blocks         uiBlocks   required
title          text       required
campaignCode   text       required        # joins to the calendar + analytics
seoTitle / seoDescription / ogImage
```

#### Section models (6) — `kind: component`

| Model | Fields | Mounted at |
|---|---|---|
| `homepage` | `blocks`, `seoTitle`, `seoDescription` | `/` |
| `nav` | `blocks` | global header (Symbol-driven) |
| `footer` | `blocks` | global footer — **make this Builder-driven**; today it's hardcoded with lorem ipsum |
| `promo-slot` | `blocks`, `slotId` (enum: `pdp-upper`, `plp-tile`, `cart-upsell`, `global-banner`) | named slots across the app |
| `pdp-section` | `blocks`, `previewProduct` (reference → `product`) | below the fold on PDP |
| `article` | see §6.2 | `/help/[slug]`, `/blog/[slug]` |

The **`promo-slot` model is the "Builder is not all-or-nothing" proof**, and it's the AloYoga story from your old script made real: a named, targetable, schedulable slot that a content team owns while developers own the other 90% of the page. Give it four real slot IDs and it demonstrates the guardrail argument better than any explanation.

#### Data models (6)

| Model | Purpose | Key fields |
|---|---|---|
| `product` | First-party product catalog (the "your own DB" story) | `sku`, `name`, `slug`, `price`, `compareAtPrice`, `currency`, `images[]`, `category`, `collections[]`, `colors[]`, `sizes[]`, `badges[]`, `description` (**localized**), `inStock`, `launchDate` |
| `author` | Bylines, referenced by `article` | `name`, `title`, `avatar`, `bio` |
| `help-topic` | KB taxonomy | `name`, `slug`, `icon`, `order`, `parent` (self-reference) |
| `store` | Retail locations | `name`, `slug`, `address`, `city`, `country`, `coords`, `hours`, `phone`, `locale` |
| `disclosure` | Regulated legal text for the Card surface | `key`, `body` (**localized**), `jurisdiction`, `effectiveDate`, `reviewedBy` |
| `nav-config` | Nav labels & mega-menu, **fully localized** | `items[]`, `announcements[]`, `ctaLabel`, `signInLabel` |

**`disclosure` is the governance demo's fuel.** A disclosure entry with a `jurisdiction` and an `effectiveDate`, gated behind a legal-review rule, is instantly legible to a bank or an insurer.

### 6.2 The blog / help article — structured *and* visual

This is the one you asked about specifically, and there's a documented right answer.

**A `data` model cannot hold a `uiBlocks` field.** The docs describe Data models as *"pure data… no drag-and-drop aspect."* `uiBlocks` is documented **only** as a custom-component input type. Treat "data model with a visual body" as **NOT VERIFIED** — don't try to build on it.

**The documented blueprint** (`/c/blueprints/blog-article`) is: a **Section model** holding the structured fields *and* the visual body, with a `reference` field out to a separate Data model for the author.

```
Model: article            kind: component (shows as "Section" in the UI)

── Structured ───────────────────────────────
title            text        required
slug             text        required
excerpt          longText                      localized
heroImage        file
heroImageAlt     text        required          ← gated by a workflow rule (§9)
author           reference → author
topic            reference → help-topic
surface          enum       [help, blog, pro]  ← one model, three surfaces
publishedAt      timestamp
readingMinutes   number
tags             list<text>
── Visual ───────────────────────────────────
blocks           uiBlocks    required          ← the drag-and-drop body
```

That schema is exactly the "combination of visual and structured data" you're after, and it is the thing that separates Builder from Contentful in one screen: **the structured fields are on the left, the visual body is the canvas, and both are the same entry.**

**Implementation notes that will save you an hour each:**
- List queries must pass `omit: "data.blocks"` or you pull every article's full block tree.
- Detail queries need `includeRefs: true` to resolve `author` and `topic`.
- The blueprint wraps the render in `<BuilderContent>` so custom-field edits live-update in the editor — **but that blueprint is written for Gen 1, and there's no documented Gen 2 equivalent.** Spike it (Phase 0); if there isn't one, live-update of custom fields may just not be a beat.
- Data models need a persistent **Preview URL set on the model** (`/c/docs/previewing-data-models`) or the editor shows nothing.
- The blog blueprint page itself is labeled **Enterprise plans** — check entitlement alongside everything else in Phase 0.

### 6.3 What not to rebuild

Drop entirely: `test-product-data`, `test-123`, `ring-*` (3 models), `mntn-page`, `event-pricing`, `figma-imports`, `ecomm-preview`, `custom-component-showcase`, `faq` + `faq-topics` (fold into `help-topic`), `blog-category` (fold into `help-topic`), `header-links` (fold into `nav-config`), `testimonial-data` + `testimonials` (make it a component with an inline list — it doesn't need a model).

---

## 7. The code plan

> **⚠️ Build order correction.** This section is written app-first, but **content comes first.** Builder's Fusion + Publish blueprint has new customers stand up models and a content skeleton, *then* scaffold the codebase to match — because that's what the Builder Code sub-agent reads. Do §6's models plus a few entries per model **before** anything in §7. Full sequence in **doc 07 §1.2 and §7**.
>
> **⚠️ Tooling split.** Doc 07 scopes which parts of this build go to Claude Code vs. Builder Code. Short version: Claude Code owns the foundation (this section), the infrastructure, and **three exemplar components**; Builder Code owns the remaining nine and all demo-time iteration. Builder Code is documented as weak on empty repos, so the exemplars and the handoff artifacts (`AGENTS.md`, `.builder/rules`) are a primary deliverable, not documentation.

### 7.1 SDK choice — read this before you commit

You chose Gen 2. **Use `@builder.io/sdk-react` (currently 5.2.12), not `@builder.io/sdk-react-nextjs` (0.25.14).**

The reasons, stated the way they'll survive a developer checking:

- The **docs** (`/c/docs/sdk-comparison`, `integrating-builder-pages?codeSnippetV2=nextApp`) name **`@builder.io/sdk-react`** for all React *"including Next.js, and App Router."*
- `@builder.io/sdk-react-nextjs` is a real first-party package, but it is **0.x, beta, and its own README says it does not support interactive Builder features** — state, actions, dynamic bindings. That's the defensible reason to avoid it. **Don't say it's undocumented** — it's referenced from `@builder.io/react`'s own npm description and from Builder's blog, and a developer who greps npm will contradict you.
- **Gen 1 `@builder.io/react` (9.4.7) is NOT deprecated.** `sdk-comparison` still labels React Gen 1 *"Recommended."* No deprecation language exists anywhere in the docs. So Gen 2 is a *your* decision (modern App Router patterns, cleaner tracking story), not "Gen 1 is going away." Don't say that.

**The RSC constraint — say this carefully.** The docs state, repeatedly: *"Builder does not currently support registering React Server Components (RSCs) as custom components"* (`/c/docs/custom-components-setup`). That is true **of `@builder.io/sdk-react` and Gen 1** — and it means **your registry and `<Content>` render must be client components.**

But it is *not* true of Builder as a whole: `@builder.io/sdk-react-nextjs` is literally described on npm as the *"Builder.io RSC SDK for NextJS App Directory"* and supports registering a Server Component via **`isRSC: true`**. So the honest framing on a call is: *"the SDK we're on renders custom components client-side; there's a separate beta RSC SDK if you need Server Components registered, with tradeoffs."* Don't call it impossible.

Client-side rendering isn't only a constraint here — it's load-bearing for §8, because **tracking fires from hydrated SDK JavaScript.** Impressions are documented as *"JavaScript code that records when that content entry is loaded."* Whether a pure-RSC render produces **zero** impressions is a reasonable inference but **NOT VERIFIED** in the docs — test it rather than asserting it.

**One Gen 2 gap to plan around:** several patterns this plan depends on are documented **only for Gen 1** — `<BuilderContent>` (needed for A/B tests on data models, and for live custom-field updates in the blog blueprint) and reading `builder.sessionId` for cross-domain conversion attribution. There is **no documented Gen 2 equivalent for either.** Spike both in Phase 0 (§11) before committing; if they don't have Gen 2 paths, the fallbacks are to keep A/B tests on page/section models only, and to skip the cross-domain checkout beat.

### 7.2 Target stack

```
Next.js 15 (App Router)        # 16 if stable when you start; do not stay on 14
React 19
@builder.io/sdk-react ^5.2     # Gen 2, documented
Tailwind CSS 4
Radix primitives + a thin in-house component layer   # drop shadcn copy-paste
TypeScript strict
Vercel, with ISR — not force-dynamic
```

**Delete from the old stack:** `axios`, `dotenv`, `webpack` (direct dep), `swell-node`, `swell-js`, `react-query` v3 (duplicate of `@tanstack/react-query` v5), `@builder.io/react-hydration-overlay`, `@builder.io/widgets`, `react-instantsearch-dom` v6 (→ `react-instantsearch` v7).

### 7.3 Caching — the story you currently cannot tell

Every route today is `force-dynamic`. Spartan asked whether Builder pages are **crawlable**; with this setup the honest answer is worse than it needs to be.

Target: ISR with `revalidate`, plus Builder's own CDN controls (`/c/docs/content-api`):
- `cacheSeconds` — max-age
- `staleCacheSeconds` — stale-while-revalidate at the edge. **Default is one day; one hour (3600) is the *minimum*, not the default.** Leave it high.
- `cachebust: true` — *"significantly increases response times. Do not use it for runtime requests."* Editor/preview only.
- `noTargeting: true` — build-time/SSG only, and **does not apply to Gen 2 frameworks**; use `enrich` instead.

Also correct one line from your old script: you said targeted content is *"prerendered on the edge before a user ever requests it, so there's no additional latency."* `prerender: false` shows up in code samples but is **not documented** in the content-api or `<Content>` docs. The accurate and still-strong framing is: **targeted variants are resolved at the CDN edge and served from cache; the targeting decision doesn't cost a round trip to an origin.** That also gives you a clean answer to Visme's flicker objection.

### 7.4 Component library — 12 components, all real

Cut from 15 half-working to 12 that all work. Every one registered in a single client-side `builder-registry.ts`, every one with a real thumbnail, sensible defaults, and — critically — **`{...attributes}` spread onto the root element including `builder-id`** (§8.2).

| Component | Notes |
|---|---|
| `Hero` | One component, `variant` enum: `image` / `split` / `text`. Replaces three near-duplicate heroes. |
| `Section` | Layout wrapper: width, padding, background — all token-bound |
| `ProductGrid` | Data-bound; `source` enum: `Builder` / `Shopify` / `API`. Static fallback on failure. |
| `ProductCard` | Single product; same `source` enum |
| `FeatureCards` | Replaces `IconCard`; list input, 2/3/4-up |
| `RichText` | Sanitized. **DOMPurify on every `dangerouslySetInnerHTML`** — today 5 of 6 components are unsanitized. |
| `Accordion` | The Radix one. Delete the hand-rolled one. |
| `SearchBox` | Algolia, `react-instantsearch` v7, CSS actually imported |
| `Disclosure` | Renders a `disclosure` data entry by key — the FS component |
| `LeadForm` | B2B/Pro surface; posts to a real endpoint |
| `ArticleList` | Filtered by `surface` + `topic`; powers Help, Blog and Pro |
| `Testimonials` | Inline list input, no model needed |

**Guardrails to register** (`/c/docs/register-components-options`):
- `childRequirements: { message, query: { 'component.name': { $in: ['Text','Button'] } } }`
- `requiredPermissions: ['editDesigns']` — **note: the documented option is `requiredPermissions`, not `permissionsRequiredToEdit`.** Your old notes have the wrong name.
- `models: ['page','landing-page']` to scope components to surfaces
- `hideFromInsertMenu` for anything internal
- **Register insert menus unconditionally.** Do not repeat the `editingModel === "homepage"` gate.

### 7.5 Design tokens — one namespace, three consumers

The single highest-leverage fix in the codebase. One set of CSS custom properties, consumed by all three layers:

```
globals.css          :root { --fn-color-primary: #1B3A2F; --fn-space-4: 16px; ... }
        ↓                          ↓                            ↓
tailwind.config.ts   colors.primary = 'var(--fn-color-primary)'
builder-registry.ts  designTokens.colors = [{ name:'Primary', value:'var(--fn-color-primary)' }]
```

Change the variable in one place; the app, the Tailwind classes, and the Builder token picker all move together. That's the demo: **edit a token, watch the canvas and the site change.** Today that does nothing.

```js
register("editor.settings", {
  styleStrictMode: true,          // hides styles that have no token
  allowOverridingTokens: false,   // tokens are rules, not suggestions
  designTokens: {
    colors:     [{ name: "Primary", value: "var(--fn-color-primary, #1B3A2F)" }, ...],
    spacing:    [...],
    fontFamily: [{ name: "Display", value: "var(--fn-font-display, Söhne)" }],
    fontSize:   [...],
    boxShadow:  false,            // hides the control entirely
  },
});
```

**The guardrail spectrum — the SiteOne demo beat, built the way that actually works.**

⚠️ **An earlier version of this plan proposed registering tokens conditionally off `builder.role.name` to give three roles three different editing experiences. That does not work.** Two documented reasons: **Components-only mode is an account-wide setting** — *"Components-only mode is an account-wide setting with toggles that affect all users in the same way"* (`/c/docs/guides/components-only-mode`) — and role-conditional `register()` off `builder.role.*` **is not documented anywhere.** Don't build a ⭐ demo beat on it.

What *is* supported, and is still a strong two-level demo:

| Level | Mechanism | Experience |
|---|---|---|
| **Locked** | Custom role **without the `editDesigns` permission** | No Style tab. *(They can still drag the margin dot unless the margin toggle is off account-wide.)* |
| **Governed** | `styleStrictMode: true` + `allowOverridingTokens: false` (space-wide) | Style tab present, tokens only, no arbitrary values |

So: **the token strictness is a space-level setting; the who-can-style question is a role-level setting.** Demo it as two dimensions rather than a three-position slider — switch to the Copywriter profile to show the locked experience, and describe (or toggle, out of band) the strict/open setting.

That still answers SiteOne's question — *"too much editor freedom risks design system integrity; too little constrains the team"* — and it's still Al Tayer's "token tiering" and Lifeplus's "locked properties." It just doesn't over-promise a live three-way switch you can't deliver.

**Phase 0 spike:** if you want the three-way version, verify whether `register()` can read role context in your space before scripting it.

**Don't conflate this with Design System Intelligence** (`/app/design-system-intelligence`) — that's a **Builder Code** feature that indexes components/tokens from repos, npm, or Figma for the agent to `@`-tag. It's a great separate beat, but it is not the Content token system.

Also: load the font. `next/font` with a real display face, and every token has a working fallback stack.

---

## 8. Making A/B and Insights show real data

Your biggest gap, and the most valuable thing in this plan. Right now this section of your demo "falls flat," in your words. Here's why, and how to fix it permanently.

### 8.1 Why heatmaps show nothing — the documented causes

From `/c/docs/content-entry-insights`, `/c/docs/impressions`, `/c/docs/conversion-tracking`, `/c/docs/abtesting`:

1. **Entitlement.** A/B testing and Insights docs are labeled **Enterprise**. Impressions are **Growth/Enterprise**. On a Pro space you get nothing, by entitlement. **Check this first on your new space** — it's the one cause you can't engineer around.
2. **No `builder-id` on custom components.** The #1 documented cause. React SDK requires you to **spread Builder's attributes onto your custom component's root element**. Miss it and clicks are invisible — which is most of your heatmap.
3. **No impressions.** Impressions fire from **SDK JavaScript when content loads**. Server-rendered HTML with no hydrated SDK = zero impressions = zero of everything downstream.
4. **Conversions are never automatic** outside Shopify, and are **browser-only** (*"may not function as intended if used server-side"*).
5. **~30 minute latency.** Not real-time. Don't click publish and open the heatmap.
6. **Date range too wide.** "Crunching the latest data…" that never resolves means the range is too big — **ranges beyond 1–2 months time out.**
7. **`canTrack={false}`, `window.builderNoTrack`, or a cookie-consent banner blocking Builder cookies** kills impressions, and therefore everything.
8. **Shift toggles the heatmap off** — which collides with screenshot shortcuts. Know this before you're live.

### 8.2 The instrumentation checklist

```tsx
// Every registered component, without exception:
export function Hero({ title, image, attributes }: HeroProps) {
  return <section {...attributes}>{/* attributes carries builder-id */}</section>;
}
```

```tsx
// Conversions — browser-side only
import { track } from '@builder.io/sdk-react';

await track({ type: 'conversion', apiKey: API_KEY });              // no value
await track({ type: 'conversion', amount: 129.00, apiKey: API_KEY }); // with value
```

Wire real conversion events: **Add to cart** (amount = price), **Start checkout**, **Complete order**, **Lead form submit** (Pro), **Card application start** (Card). Give each a plausible value so the `$` overlay in the heatmap shows money, not counts. That's your "clicks are worth something" story from the old script, made true.

Cross-domain checkout: append `&builder.overrideSessionId=${builder.sessionId}` to the checkout URL or the conversion won't attach to the impression. **⚠️ The documented example imports `builder` from Gen 1 `@builder.io/react`; there's no documented Gen 2 way to read `sessionId`.** Spike it in Phase 0 — if there's no Gen 2 path, drop the cross-domain checkout beat rather than improvising one on a call.

Consent banner: build one, ship it **off by default** with a toggle. It shows you've thought about consent (asked in FS deals) without silently killing your own tracking.

### 8.3 The part nobody does: generate the traffic

Instrumentation gives you a *capable* demo. It doesn't give you *data*. You need weeks of events in the last 7–30 days, continuously, forever.

**Build a synthetic event generator.** Two layers — and note the ordering below is the *verified* one, which is the reverse of what looks easiest.

> ⚠️ **Spike this in Phase 0 before you budget three days to it.** The track REST endpoint `POST https://cdn.builder.io/api/v1/track?apiKey=...` with an `events` array is documented **only** inside the Shopify custom-pixel example, and **every documented event there is `type: "conversion"`.** The Gen 2 `track()` *function* accepts `impression | click | conversion | custom`, but the REST payload shape for impressions and clicks — and the `contentId` / `variationId` fields this plan assumes — **appear in no documented payload.** Worse: the A/B docs say *"Builder Content calculates conversions based on impressions… an impression of Builder content is all that's necessary to lead to a trackable conversion"* — so synthetic conversions with no matching impression record may never attach to a variation, which is exactly the green-significance beat you're building. Post 20 events into the Sandbox space, wait 30 minutes, confirm they land attributed to the right content and variation. **If they don't, Layer 2 is the whole plan.**

**Layer 2 — headless browser traffic (the path the docs actually support end to end).** A Playwright script that loads pages across devices, locales and segments and clicks around, exercising the real SDK. Slower and more expensive per event than REST, but it produces genuine impression→click→conversion chains, and it **catches instrumentation regressions** — if someone drops `{...attributes}` from a component, the numbers go flat and you find out before a customer call does.

**Layer 1 — direct track API (use if and only if the spike passes).** Batched events via REST, far cheaper at volume. Shape traffic to look real:

- **Volume** that fits the brand — a few thousand sessions/day, not 40.
- **A believable winner.** Variant B beats A by ~8–14% with enough volume that Builder's own significance calculation turns the check **green (>95%)**. Gray = within 90% CI. You want green on the call, and you want it to be *actually* computed, not asserted.
- **Click density concentrated on real CTAs** — hero button, product tiles, nav, add-to-cart — with a realistic long tail. A uniform sprinkle looks synthetic instantly.
- **Conversion values drawn from the real catalog prices**, so the `$` overlay is internally consistent.
- **Segment skew:** VIP converts better than anonymous; mobile clicks differently than desktop; `fr-FR` behaves slightly differently from `en-US`. This makes the *targeting* demo and the *A/B* demo reinforce each other.

**Run it daily on a rolling window.** The failure mode to avoid is a demo that had great data in March. A daily job means "last 7 days" is always populated and always fresh.

**Watch the bandwidth quota.** Impressions are a plan-gated metric, and *"reading or writing data from our APIs… contribute[s] to your monthly bandwidth quota"* (`/c/docs/usage`). A few thousand sessions a day is fine; don't let a Playwright loop run unbounded.

**Demo hygiene that follows from this:**
- Set the heatmap range to **last 7 days** before the call — never "all time" (it times out).
- Publish nothing in the 30 minutes before you demo Insights.
- Don't touch Shift.

### 8.4 A/B tests worth having running

Configure these as standing tests so there's always something to open (`/c/docs/abtesting`: entry → down-arrow → **Configure A/B Test**; **duplicate the published entry first** — variations aren't ported to a duplicate if you pick a winner beforehand):

| Test | Variants | Why it demos well |
|---|---|---|
| Homepage hero | Lifestyle photo vs. product-led | The classic; big, obvious visual difference |
| PDP promo slot | Free-shipping badge vs. bundle offer | Shows testing *inside* a developer-owned page |
| Card application CTA | "Apply now" vs. "Check your rate" | FS-relevant; different conversion value per variant |
| Pro lead form | 3 fields vs. 6 fields | B2B-relevant; the short form wins, which is a satisfying result |

**A/B on data models needs `<BuilderContent>`** (`/c/docs/ab-data-models`): *"If you don't, the `<BuilderComponent>` won't be aware of the A/B test cookie for the given data and will only return the default data."* **⚠️ That page is entirely Gen 1 and there is no documented Gen 2 equivalent.** Phase 0 spike. Fallback if it doesn't exist: keep every A/B test on page and section models, where Gen 2 support is documented.

And keep Visme's objection in mind — **flicker**. Server-resolve the variant so there's no client-side swap. Being able to say "watch — no flash of the control" with a throttled connection open is a strong, specific answer to a specific doubt.

---

## 9. Governance, scheduling, targeting, localization

### 9.1 Governance (Enterprise add-on: `governance` / `customRoles`)

Settings → **Content Governance** → **Workflows** / **Rules** (`/c/docs/content-governance`).

**Custom roles** to create (Settings → Roles; Enterprise add-on, `/c/docs/custom-roles`):

| Role | Can | Cannot |
|---|---|---|
| `Copywriter` | Edit text content | Edit designs, edit layouts, publish |
| `Brand Marketer` | Edit content + layouts, token-bound styling | Publish to `/card/**` |
| `Legal Reviewer` | Read, transition `Legal Review → Approved` | Edit anything |
| `Regional Editor — FR` | Edit `fr-FR` locale content only | Other locales, publish |
| `Developer` | Everything incl. `editCode` | — |

The **Legal Reviewer** role is the sharpest one — Lifeplus explicitly asked for a **read-only approval role**, and it's the thing a bank recognizes immediately.

**Rules** — reusable approval gates with a Mongo-style **Advanced Query**, evaluated per block *and* on top-level fields. These are worth building because they're the "aha":

```js
// Anything under /card/ needs legal sign-off
{ "data.url": { "$regex": "^/card/" } }

// Any entry containing a Disclosure component needs legal sign-off
{ "component.name": "Disclosure" }

// Hero images must have alt text
{ "component.name": "Hero", "options.heroImageAlt": { "$exists": false } }
```

That third one is your old alt-text beat, made real and model-agnostic.

**Workflow** — `Draft → Content Review → Legal Review → Ready to Publish → Published`, with per-stage *who can transition* and *who can edit*, and **Require sequential stage progression** on.

**Three demo beats that land because they're non-obvious:**
1. **Request Stage Move.** Sign in as Copywriter, try to advance past Content Review, and the button becomes *"Request Stage Move"* — which creates a **task and a comment**. That's a workflow product, not a status field.
2. **Approvals are content-fingerprinted.** Get legal approval, then edit the approved element — **the rule resurfaces.** No one expects that, and it's exactly what a compliance team is afraid of.
3. **A checkpoint is auto-created on every stage change** — so "revert to the approved version" is one click.

**Correct two things from your old script:**
- **There is no native Slack integration.** Webhooks only: `stageMoved`, `requestPublish`, `requestStageMove`, with custom headers. Slack/Jira is a *consumer* of those webhooks. Build a tiny Vercel function that posts to a real Slack channel and show the message arrive — that's more convincing than the claim was anyway.
- **Webhooks are not retried.** If your endpoint is down, the event is lost. Say so if asked; it's the kind of honesty that buys credibility with a platform team.

**Cinch's ask — preview links for non-seat reviewers** — is worth confirming and building into the flow if supported. It came up as a hard requirement, not a nice-to-have.

### 9.2 Scheduling and the calendar

The **Scheduler / Calendar view ships**: `https://builder.io/app/scheduler`, with **month, week, day and agenda** views (`/c/docs/scheduler`). **Pro or Enterprise.**

**It is read-mostly.** You schedule on the entry; the calendar surfaces what's already scheduled, lets you click through to edit dates, and **Update Schedule**. You cannot create a schedule from the calendar. Know that before you try.

**The problem to solve is that an empty calendar is a worse demo than no calendar.** Seed a rolling **90-day campaign calendar** dense enough to look like a real retail year. Full spec in the seed-data doc; the shape:

- Weekly homepage hero rotations
- A 2-week seasonal sale with a start *and* end date
- Locale-staggered launches — the EU promo starting 9 hours before the US one (**this is the time-zone story, made visible**)
- A product launch with a `launchDate` on the `product` entry driving a PDP badge
- Blog/help articles publishing on a schedule
- Two **deliberately overlapping** campaigns

That last one is **Al Tayer's literal written requirement** — *"multi-scheduling… Conflict handling."* Show two campaigns overlapping on the same slot, then show how targeting priority and slot scoping resolve which one wins. Nobody demos this, and one customer has asked for it by name.

Add a **scheduled task to roll the calendar forward** so campaigns are always "next week," never eight months stale.

### 9.3 Targeting (custom attributes: Enterprise)

Space Settings → **Targeting** → **Custom Targeting** → **+ New Target Attribute** (`/c/docs/custom-targeting-attributes`). Name, type (String / boolean), and — for String — an **Enum**, which turns the editor input into a dropdown. Always set the enum; free-text targeting values are how demos get typos.

Attributes to create:

| Attribute | Type | Enum | Story |
|---|---|---|---|
| `customerTier` | String | `anonymous`, `member`, `vip` | Your VIP homepage beat |
| `segment` | String | `retail`, `pro`, `card` | Surface switching |
| `lifecycleStage` | String | `new`, `returning`, `lapsed` | Lifecycle marketing |
| `campaignSource` | String | `email`, `paid-social`, `organic`, `affiliate` | UTM-driven |
| `market` | String | `us`, `ca`, `uk`, `de`, `fr`, `ae`, `jp` | Market ≠ language — important |
| `hasProAccount` | boolean | — | Gated B2B content |

Gen 2 fetch:
```ts
await fetchOneEntry({
  apiKey, model: 'page',
  userAttributes: { urlPath, customerTier: 'vip', market: 'ae', device: 'mobile' },
  locale: 'ar-AE',
});
```

Two things worth knowing: **`device` and `urlPath` are auto-extracted client-side but must be passed explicitly on SSR/SSG** — this is a common silent failure. And **`builder.setUserAttributes()` is Gen 1 only**; there's no documented Gen 2 equivalent, so you pass attributes per-fetch.

**Targeting works on Data models too** — the difference is that `urlPath` is Pages/Sections-only, so data models need custom attributes. Whether the editor surfaces a Targeting tab on data entries is **NOT VERIFIED**; check it in your new space before you build a beat on it.

### 9.4 Localization

Settings → **Targeting** → **Localization** → Edit → enter locale codes (`/c/docs/add-remove-locales`). **Pro plans.** Codes are free-form text with no validation — so pick a convention and stick to it.

**Locales to configure:** `en-US`, `en-GB`, `fr-FR`, `fr-CA`, `de-DE`, `ja-JP`, **`ar-AE`**, `es-MX`.

**Include `ar-AE`.** Al Tayer (Bloomingdale's Middle East) is your most localization-intense opportunity, and they asked specifically to see **English and Arabic in one component without duplicating the component.** That means: build **RTL support** into the layout components, not just translated strings. An Arabic page that renders left-to-right is worse than no Arabic page.

**Locale groups** (`/c/docs/grouping-locales`) — Settings → Localization → Edit → **+ New Group**. Fallback chain: **locale → group default → space default.** Build `en-*` and `fr-*` groups. This is a real differentiator: without it, **whole-entry locale targeting has no fallback** — a locale with no targeted entry gets *nothing*, i.e. a blank page. Showing the group fallback catching that is a strong five seconds.

**The four documented ways to localize** (`/c/docs/localization-intro#ways-to-localize`) — build all four, they're each ~an hour once the locales exist:

| Way | Where | Demo role |
|---|---|---|
| **Inline / field-level** | Visual Editor (Pages, Sections) and Models section (Data models) | Al Tayer's ask — one component, many languages |
| **Whole-entry** | Duplicate + target on Locale | Different layout/imagery per market |
| **Data-model localization** | Field-level Localize toggle on a data model | Localized product descriptions, disclosures |
| **Provider integration** | Crowdin / Phrase / Smartling plugin | The real TMS workflow |

Plus two things that aren't on that list but belong in the demo: the **Visual Editor AI** translating a page live (see the nuance below), and — if you want a genuinely 2026 beat — **the CMS MCP server doing a bulk localization pass**, since `search_content_ids` → `get_content` → `update_content` across a locale is a few minutes of agent work and no competitor has an equivalent authoring-time story.

**The two core patterns, both demoed:**

1. **Per-field / inline** — double-click a block, hover the field *label*, click the **globe** icon. Works on text, images, colors and Symbol inputs. Custom component inputs are localizable unless registered `localized: false`. *This is Al Tayer's exact ask — one component, two languages, no duplication.*
   - **Gotcha, and it's documented in bold:** turning localization **off** on a block in the Visual Editor **deletes the localized content** (`/c/docs/localization-inline`). Never toggle it off live. *(The equivalent warning does not appear on the data-model localization page — so don't claim it there; just don't do it anywhere.)*
2. **Whole-entry** — duplicate the entry, Targeting → **+ Target → Locale**. Use when layout or imagery differs, not just strings. This is the `de-DE` full-page-variant story from your old script.

**The single most important implementation detail:** you must pass `locale` on the fetch. `fetchOneEntry({ ..., locale: 'fr-FR' })`, or `<Content locale="fr-FR">`, or REST `?locale=fr-FR`. **Omit it and localized fields come back as raw `LocalizedValue` objects and render as `[object Object]` on the page.** This is worth showing deliberately — break it, show the `[object Object]`, add the param, fix it. Developers remember that.

Response shape: `{ "@type": "@builder.io/core:LocalizedValue", "Default": "About Us", "fr-FR": "…" }`. Note **the GraphQL API errors on localized fields** — use REST/SDK.

For bound/iterated data (a localized product grid), set Locale = **Dynamic (bound to state)** in Data tab → Connect Data → Query, or only one locale renders.

**Two corrections to your old script:**
- **On AI translation — the nuance matters.** The **Visual Editor AI assistant will translate a page if you ask it to.** That works, and it's fine to demo. What doesn't exist is a *documented, supported translation feature*: "translate" appears nowhere on the Visual Editor AI docs, and the three-dots → **Translate** → **Apply Translation** flow is documented **only** inside provider plugin pages and requires a connected provider. The four documented ways to localize (`/c/docs/localization-intro#ways-to-localize`) are: **inline/field-level**, **whole-entry**, **data-model**, and **a provider integration** — AI is not among them.
  So: show it, and frame it as *"the editor's AI can do this, and it's a great way to stand up a prototype or fill a gap — it's not a substitute for your TMS, and it's not what I'd build a governed localization program on."* That's honest, it's useful, and it's much stronger than either overclaiming or pretending it doesn't work. (Minor doc bug worth knowing: the intro page says "three ways" and then lists four.)
- **Crowdin, Phrase and Smartling are the three with first-party documentation.** But `builder.io/integrations` lists **six** under Localization — those three plus **GlobalLink Connect (TransPerfect)**, **Google Translate** and **Lokalise**. So **don't tell a Lokalise customer it isn't supported**; it's on Builder's own integrations page. Safe phrasing: *"Crowdin, Phrase and Smartling are the three we document end to end; there are community plugins for Lokalise and a few others."* Phrase requires a **Phrase** Ultimate plan or higher on their side (plus Builder Content Pro) — it's not a Builder tier. Trade Nation uses **Phrase + Welocalize**, so Phrase is the one to actually wire up if you wire one.

Per-block right-click → **"Exclude from future translations"** is a nice small beat for brand names and SKUs.

---

## 10. Data sources — and the "our data" problem

### 10.1 Cut from five backends to two patterns

Today: Shopify, Swell, Commercetools, Emporix, Builder. Two are non-functional; Emporix renders **$9,999**. **Commercetools was never mentioned by a single prospect** in the calls reviewed. Cut Swell, Emporix and Commercetools entirely.

Keep two patterns, because between them they cover essentially every prospect:

**Pattern A — first-party structured data (`product` model in Builder).** The "your own database / your PIM" story. Works offline, never fails, and is the honest answer for the many prospects with no commerce platform at all.

**Pattern B — external API Data Source.** Data tab → **API Data** → **+ API Data Source** (`/c/docs/connecting-api-data`). If data shows in the Preview URL but not the Visual Editor, the fix is **CORS allowing `https://builder.io` and `https://*.builder.io`** (note: no `www`). Point it at a small API you control that serves the Fieldnote catalog, so "this is exactly what pointing it at your PIM looks like" is literally true.

Then **one real connector plugin** for credibility: **Shopify.** Named by Black Rifle, Brilliant Earth and Spartan. Keep a live Shopify store wired to one section of the site — not the whole site, so a Shopify outage can't take you down.

Al Tayer is on **Salesforce Commerce Cloud**. A documented SFCC connector exists — but **be careful with their "no middleware" framing.** The plugin *"connect[s] to your Salesforce B2C Commerce API, bringing Product and Category info into Builder"* — four input types plus targeting. **Nothing on cart, checkout, pricing or inventory**, it requires a pre-existing SLAS Public Client, and the config modal has an optional **Proxy** field. It's a strong product-data connector; it is not an out-of-the-box replacement for their commerce integration layer. Wire it if Al Tayer stays live, but scope the claim.

**Algolia** stays — Al Tayer named it — but on `react-instantsearch` **v7** with its CSS actually imported.

### 10.2 Fail soft, always

Every data-bound component gets a static fallback baked in. If Shopify, Algolia or the API source fails, the component renders sensible placeholder products rather than **"No product found."** — which is what your homepage is doing right now, live, today.

This is cheap insurance with a very high payoff: the failure mode it prevents happens during a call, in front of the prospect, on the homepage.

### 10.3 The "our data" adapter — the highest-ROI thing after §8

*"Unless we see a demo with our own platform, it will be difficult to say how good it is."* — Al Tayer. Macmillan, Papaya, TV3 and KPMG said versions of the same thing.

**Build a 30-minute path to swap the catalog before a call:**

1. A documented CSV/JSON shape for `product` (and `article`, and `disclosure`).
2. A script — `npm run seed -- --from ./prospect.csv` — that writes entries into your demo space via the Builder Write API.
3. A **brand override**: one JSON file of token values (`--fn-color-primary`, `--fn-font-display`, logo URL) that restyles the entire demo, because the tokens finally flow through (§7.5).
4. An **asset import** step that pulls the prospect's product imagery into the Builder DAM.

Result: the morning of an Al Tayer call, you paste in a Bloomingdale's ME product feed and their brand colors, and the demo is *their* store. That single capability defuses the most common objection in your pipeline, and it's maybe two days of work once the token pipeline is real.

**Scope note:** pull public product data only, and keep the demo clearly labeled as a Builder demo — don't build something that reads as the prospect's actual live site.

### 10.4 The Contentful migration story

Contentful is your #1 named competitor, and **the Salesforce acquisition is actively moving deals** — DoorDash's evaluation *"is being accelerated by the news of SF buying Contentful."* Vast Data asked for a Contentful→Builder migration reference and Builder had none.

**Be precise about what exists, because it's easy to overstate — but the sub-agent narrows the gap more than an earlier draft of this plan allowed:**
- The **Contentful plugin is read-only data binding**, not migration: *"Visually present data stored in Contentful by connecting your Contentful account to Builder… The values are synced."* The content stays in Contentful.
- The **Code sub-agent for Builder Content** migrates the **code layer** — install the Content SDK, *"migrate components, tokens, and branding,"* build and auto-register components, and optionally *"register my existing app styles as Publish design tokens."* Builder's own guidance says to name the source: *"If you're migrating from a specific CMS (e.g. Contentful, AEM, WordPress), mention it — the sub-agent will use that context to map content models and component structures more accurately."*

So: **the sub-agent migrates the code layer; entry migration is a script you write.** That's still a real, runnable demo — point Builder Code at a Contentful-shaped app, run *"migrate my existing site to work with Builder Content,"* and pair it with a scripted entry migration via the Write API. Present it as *"here's the migration path"* rather than *"here's a one-click migration product."*

Watching a Contentful content type become a Builder model with a *visual* editing surface, in a few minutes, is still a better competitive argument than any feature-comparison slide.

---

## 10.5 SEO and AEO — Builder's biggest content gap, and your best MCP demo

Short version: **SEO is defensible with first-party quotes. AEO is a clean negative — Builder ships nothing.** And competitors have started shipping it. That makes this simultaneously the most exposed part of your story and the best thing you could build.

### What's solid: crawlability

Spartan asked whether Builder components are crawlable. Two quotable answers:

> *"Builder doesn't use iframes or canvases when rendering content with the Builder SDK on your site. In this way, what you create in Builder is as optimized as the code your developers write."* — `/c/docs/seo`

> *"All content is delivered from the edge, renderable server-side or statically, and highly optimized… Importantly, there are no hacks here. No iframes, no unneeded client-side code, or rendering."* — `/c/docs/how-builder-works-technical`

And a dedicated page, `/c/docs/custom-components-ssr-ssg`: *"Builder supports SSR and SSG out-of-the-box for all components and frameworks."*

**Caveats to know before you get caught:**
- The **Visual Editor** does use an iframe. That's authoring, not the live site — know the distinction, a technical buyer will probe it.
- **Angular Gen 1 SDK does not support SSR/SSG with custom components.**
- React across all metaframeworks: component *markup* SSRs fine, but React doesn't support server-side data fetching for custom components — that's what `getAsyncProps` is for.
- **The HTML API doesn't support custom components at all.**
- A/B tests ship all variants in the initial HTML; *"the default variation, known as the control, serves as the baseline exposed to search engines."* Gzip cost cited at 5–10%.

Note this is also the argument for dropping `force-dynamic` (§7.3) — the current demo can't tell this story credibly.

### What's DIY: metadata and sitemaps

- The default Page model ships **`Title` and `Description` only**. Everything else — OG image, canonical, `noindex`, structured data — is a **custom field you add**, and **you render it yourself** via `next/head`. Builder does not emit `<head>` tags.
- Canonical URLs: **not a built-in field**, only mentioned as sitemap advice.
- **There is no SEO plugin.** No Yoast equivalent, nothing in the integrations catalog.
- **Sitemap is a documented DIY recipe** worth building, because it demos well: query `cdn.builder.io/api/v2/content/page?fields=data.url&query.data.includeInSitemap.$ne=false`, map to URLs, emit XML. That `includeInSitemap` custom-field convention is a nice detail — an editor toggling a page out of the sitemap without a ticket.
- **One real shipped AI assist:** the June 11, 2026 product update *"A better AI experience in Publish"* — *"Ask AI to generate and update pages, refine content to match your brand voice, **check SEO and readability**, and cross-link content."* Legitimate to demo. It is on-page SEO assistance; it is not AEO.

### The trap: "structured data" means two different things

⚠️ **Builder uses "structured data" to mean its own Data models, never schema.org.** `/c/docs/integrate-cms-data` is literally titled "Integrate Structured Data" and is a nav-links Data model tutorial with zero schema.org content. `/m/explainers/structured-data` defines it as *"data stored in databases or spreadsheets."*

**Do not cite either page as schema.org evidence** — a technical SEO buyer will open it and conclude you oversold. Searching builder.io, the forum and GitHub returns **no Builder-authored content on JSON-LD, schema markup or rich results.**

Three implementation patterns that work — present them as *patterns you built*, not features:
1. **Head injection from a custom field** — best option. Same mechanism Builder documents for title/description, just emitting `<script type="application/ld+json">` from `content.data.*`.
2. **A registered `<JsonLd>` custom component** — SSRs per the SSR/SSG doc.
3. **Custom Code block** — renders server-side, but watch the "Scripts client only" toggle, which would break JSON-LD.

### AEO/GEO: Builder ships nothing, and competitors have started

I swept `/updates` (Sept 2025 → Aug 2026), the blog RSS, all docs, and the platform pages. **Zero mentions of AEO, GEO, answer engines, AI citation, LLM crawlers, or llms.txt generation.**

The only artifact naming the problem is `/blog/seo-ai` — **October 2024**, two years stale, and it coined a non-standard acronym ("AIVO") that never became a product. `builder.io/llms.txt` exists but is a hand-written marketing doc *about Builder*; there's no feature that generates one for customer sites.

⚠️ **Don't conflate** `/blog/the-internet-is-not-ready-for-the-agentic-wave` (Sept 2026) with AEO. That post is about agents as *users* — agentic traffic, anti-bot infra, WebMCP. Different problem. Easy and damaging mistake.

**Where competitors are:**

| Vendor | Shipped AEO? | What |
|---|---|---|
| **Contentful** | ✅ | **Palmata**, GA June 23 2026 — "a content decision system for AI discovery," plus its own MCP server |
| **Storyblok** | ~ | AI Search Monitoring in the AI Suite, resold from **Otterly.AI**; tracks ChatGPT / Gemini / AI Overviews / Perplexity |
| **Optimizely** | ✅ | AEO platform, June 2026 |
| **Sitecore** | ✅ | Acquired Scrunch; llms.txt support in Content SDK 2.4 |
| **HubSpot** | ✅ | AEO in Spring 2026 Spotlight |
| **Contentstack** | ❌ | Blog and glossary only |
| **Sanity** | ❌ | An open-source `seo-aeo-best-practices` agent skill — guidance for coding agents, not a feature |

**Read:** an AEO story is a *differentiator* versus Contentstack and Sanity, *defensive* versus Contentful and Storyblok, and a *losing comparison* versus Optimizely/Sitecore if the prospect is evaluating DXP suites. Given Contentful is your #1 named competitor and Palmata is their answer, you will get asked about this.

### The build: an MCP-driven AEO audit agent

This is the Jabil ask — *"MCP server structuring content for SEO/AEO/GEO"* — and it's genuinely differentiated, because **nobody has packaged AEO as an authoring-time agent workflow.** The primitives all exist in the CMS MCP server today.

The chain:

```
get_pages_hierarchy      → the site's IA, "similar to a sitemap"
search_content_ids       → cheap bulk scan (the docs frame this as
                           "scan hundreds of blog posts before narrowing")
get_model_schema         → read the current field structure
update_builder_model     → ADD AEO fields: jsonLd, canonical, noindex,
                           faqPairs, answerSummary, entityType
get_content              → read entries
update_content           → write back JSON-LD, FAQ blocks, meta,
                           short extractive answer summaries
```

Package it as an agent skill and the demo is: *"audit every article on this site for answer-engine readiness, add the fields we're missing, and populate them."* An agent then walks 26 articles, adds `faqPairs` and `answerSummary` to the `article` model, and fills them — in front of the prospect, inside their governance rules, landing in **Draft** because the workflow says so.

**Two things that make it land:** it's the same MCP beat as §13.2, so it costs you almost nothing extra to build; and it reframes the conversation from "does Builder have an AEO dashboard" (no) to "can Builder's content be shaped for AI retrieval by an agent, at authoring time, under governance" (yes, and uniquely).

**What to say and not say:**
- ✅ *"Here's what you can build on the MCP server today."*
- ✅ *"Structured models + API-first delivery is the right substrate for AI surfaces."* (Positioning, in the marketing copy — fine as a talk track.)
- ❌ *"Builder has AEO."* It doesn't.
- ❌ Citing Builder's "structured data" pages as schema.org support.
- ❌ Promising llms.txt generation.

If a prospect is running a serious AEO evaluation against Contentful's Palmata or Optimizely, **say so plainly and route it internally.** That's a product gap, not a demo problem, and the fastest way to lose a technical buyer is to pretend otherwise.

---

## 10.6 Making the demo resettable

You'll run this weekly and edit it live every time. Without a reset it degrades within a month — which is exactly how the current one got here.

**Layered, so recovery is proportional to the damage:**

| Layer | Mechanism | Recovery time |
|---|---|---|
| **1. Content snapshot** | Nightly export of every model's entries to JSON, committed to the repo. `npm run snapshot`. | — |
| **2. Fast restore** | `npm run reset` — diffs live content against the last good snapshot and writes back via the Write API. Idempotent. | ~2 min |
| **3. Full rebuild** | `npm run seed --fresh` — recreates models, content, targeting, locales from scratch in an empty space. | ~15 min |
| **4. Calendar roll** | Weekly job shifting all campaign dates forward so nothing reads as stale. | automatic |
| **5. Analytics** | Daily generator (§8.3) keeping the last 7 days populated. | automatic |

**How it runs:** a GitHub Action on a nightly cron for the snapshot, plus `workflow_dispatch` so you can hit **Run reset** from your phone between calls. Vercel Cron handles the calendar roll and the analytics generator (Pro — Hobby's ±59-minute jitter isn't usable).

**The useful nuance:** reset should be *selective*. After a demo where you built a page live, you want to drop that page and keep everything else — not rebuild the space. So `npm run reset` takes an optional model or path filter, and the default is "restore everything to snapshot."

**Keep the environments out of it.** Don't wire reset to Live Sync — re-enabling Live Sync overwrites unpushed child changes (§5), and you do not want that behind a cron job.

**Build it in Phase 9, but write the snapshot script in Phase 3**, the moment there's content worth snapshotting. It's ~50 lines against the Write API and it protects everything built after it.

---

## 11. Build phases

| Phase | Work | Days |
|---|---|---|
| **0. Setup + spikes** | Create spaces + environments; confirm entitlements (**A/B + Insights + targeting attributes + governance = Enterprise; impressions = Growth/Enterprise; localization + scheduler = Pro**); new repo; Vercel. **Plus five 30-minute spikes on undocumented behavior — see below.** | 1.5 |
| **1. Foundation** | Next 15 + `@builder.io/sdk-react`; **token pipeline (globals.css ↔ Tailwind ↔ editor.settings)**; fonts; `<Content>` client wrapper; ISR | 3 |
| **2. Components** | 12 components, all real, all spreading `{...attributes}`; guardrails; single registry; thumbnails | 4 |
| **3. Models & content** | 14 models; seed the catalog, articles, stores, disclosures, nav | 4 |
| **4. Surfaces** | Retail, Help, Pro, Card pages built in the visual editor | 3 |
| **5. Data sources** | `product` model + API Data Source + Shopify + Algolia v7; fallbacks everywhere | 2 |
| **6. Targeting & localization** | 6 attributes; 8 locales incl. `ar-AE` + RTL; locale groups; **all four documented localization methods**; Crowdin connector; VE AI translate beat | 3.5 |
| **6.5 SEO & AEO** | SEO custom fields + head injection; sitemap route with `includeInSitemap`; JSON-LD component; **AEO fields on `article` + the MCP audit agent/skill** (§10.5) | 2.5 |
| **7. Analytics** | Conversion tracking wired; **synthetic event generator**; 4 standing A/B tests; verify heatmaps populate | 3 |
| **8. Governance, scheduling, environments** | 5 roles; 3 rules; 5-stage workflow; Slack webhook receiver; 90-day calendar; env promotion flow | 2 |
| **9. Demo tooling** | Snapshot/reset pipeline (§10.6); `npm run seed --from`; brand override; rehearsal | 2.5 |
| | **Total** | **~30 days** |

### Phase 0 spikes — do these first, in the Sandbox space

Four ⭐ demo beats in this plan rest on behavior the docs don't cover. Each is about 30 minutes to settle, and each has a fallback if it fails. Find out now, not in week four.

| Spike | Question | Fallback if it fails |
|---|---|---|
| **Track REST** | Post 20 impression/click/conversion events to `/api/v1/track`. Wait 30 min. Do they land, attributed to the right `contentId` / `variationId`? | Playwright-only generator (slower, but documented) |
| **Gen 2 `<BuilderContent>`** | Is there a Gen 2 equivalent for A/B-on-data-models and live custom-field updates? | Keep all A/B tests on page/section models |
| **Gen 2 `sessionId`** | Can you read it on `@builder.io/sdk-react` for `builder.overrideSessionId`? | Drop the cross-domain checkout beat |
| **Role-conditional tokens** | Can `register()` read role context, or is token strictness space-wide only? | Two-level guardrail demo (§7.5) — which is what's scripted |
| **RSC + impressions** | Does a client-rendered `<Content>` reliably fire impressions? (It should — verify.) | Blocker: nothing downstream works without it |

### MVP cut — demoable in ~9 days

If you need something live sooner, do Phases 0, 1, 2 (trimmed to 7 components), 3 (retail only), 4 (retail + one vertical), and **all of Phase 7**.

Phase 7 stays in the MVP because the analytics gap is your stated biggest problem and because **the generator needs lead time** — it has to run for a week before the numbers look real. Start it early even if nothing else is finished.

Defer: the other two surfaces, environments, the Contentful migration, the brand override.

---

## 12. Risks and things not to say on a call

| Risk | Handling |
|---|---|
| **Insights/A/B/targeting/governance are Enterprise; impressions Growth/Enterprise; localization + scheduler Pro** | Verify entitlement on the new space in Phase 0. The one thing that can't be engineered around. |
| **Synthetic analytics may not attach to variations** | Conversions are calculated *from impressions*. Spike the track REST endpoint before budgeting 3 days. Playwright is the documented fallback. |
| **RSCs can't be registered as custom components — on this SDK** | Registry and `<Content>` are client components. But **don't say Builder can't do RSC** — `sdk-react-nextjs` does, via `isRSC: true`. Frame it as an SDK tradeoff. |
| **Several patterns are Gen 1-only** (`<BuilderContent>`, `sessionId`) | Phase 0 spikes with named fallbacks. |
| **`@builder.io/sdk-react-nextjs` is 0.x/beta and doesn't support interactive Builder features** | Use `@builder.io/sdk-react` 5.x. Say "beta, no interactive features" — not "undocumented." |
| **Token strictness is space-wide; components-only mode is account-wide** | Two-level guardrail demo (role has/hasn't `editDesigns` × strict/open tokens). No live three-way switch. |
| **Gen 1 is NOT deprecated** — docs still call it "Recommended" | Never say Gen 1 is going away. Frame Gen 2 as the modern App Router path. |
| **No native AI translate** | Remove that claim from the script. Demo a provider plugin instead. |
| **No native Slack on workflows; webhooks aren't retried** | Build a webhook → Slack function and demo the real message. Be honest about retries. |
| **Data model + `uiBlocks` is undocumented** | Use the Section-model blueprint for articles (note: that page is Enterprise-gated too). |
| **"Content Sources" is not a shipped feature** — `/c/docs/content-sources` is empty | Say **API Data Sources** and **connector plugins**. |
| **"Section model = `kind: component`" is not documented** | True in this space today; verify in yours. Don't state it as a documented rule to a developer. |
| **Contentful plugin is read-only data binding, not migration** | Build the migration as your own asset. Don't call it a product capability. |
| **Lokalise is on `builder.io/integrations`** | Don't tell a Lokalise customer it's unsupported. Say "we document Crowdin, Phrase and Smartling end to end." |
| **GA4 "bidirectional" is unsupported** | The documented flow is outbound only, via a `contentLoaded` callback into *your* provider. Amplitude is the only named example. Cut "bidirectional." |
| **Heatmap times out on wide date ranges; ~30 min latency; Shift toggles it off** | Last-7-days before every call. No publishing in the prior 30 min. |
| **Docs and UI are mid-rename** (Publish→Content, Fusion→Code) | Acknowledge it lightly if it shows on screen. Don't promise consistency. |
| **Builder ships no AEO/GEO feature** — Contentful (Palmata), Storyblok, Optimizely, Sitecore and HubSpot all do | Lead with the MCP audit agent (§10.5) as *"what you can build today."* Never claim Builder has AEO. Route serious AEO bake-offs internally. |
| **Builder's "structured data" pages are about Data models, not schema.org** | Don't cite them as JSON-LD support. Present head injection / a `<JsonLd>` component as patterns you built. |
| **Vercel Hobby is non-commercial-only, and its cron jitters ±59 min** | Vercel Pro, $20/mo. The analytics generator needs predictable scheduling. |
| **Shopify's custom-app flow changed Jan 2026 and Builder's docs are stale** | Use the Headless sales channel. Set `apiVersion` to `2026-07` — the plugin default is the retired `2020-07` and fails silently. |
| **Algolia deletes data after 30 days of inactivity** | Poke the demo monthly, or the search beat comes back empty. |
| **Demo degrades from live editing** | Snapshot + selective reset (§10.6). Write the snapshot script in Phase 3, not Phase 9. |
| **Figma may become unreliable as a demo spine** (internal Slack) | Keep Figma as one beat with a fallback path, not the backbone. |
| **Demo rot** | `npm run reset` + a scheduled job rolling the campaign calendar forward. |
| **Live data outage mid-call** | Static fallbacks on every data-bound component. |

---

## 13. Ideas worth considering

Beyond what you listed:

1. **A deliberately "before" state you can toggle.** A branch or space where governance is off, tokens are open, and nothing is scheduled — so you can show the mess, then show the governed version. The contrast sells better than the end state alone.
2. **MCP as a demo beat.** The Builder CMS MCP (`https://mcp.builder.io/mcp/publish`, OAuth) exposes create/update content, create/update models, get design tokens, get registered components. Connecting Claude or Cursor and having it create a campaign page *in your governed space, respecting your tokens* is a genuinely 2026 moment that competitors can't answer. It also plays directly to Jabil's MCP/AEO interest.

2b. **⭐⭐ Builder Code Preview for Publish — the strongest beat in the whole plan, and it was missing.** You can point a content entry's preview source at an **unmerged Builder Code branch**, so a work-in-progress component appears in the Publish Visual Editor before it ships. Build a component on a branch, tell the sub-agent *"make this available in Publish,"* switch a **dedicated test entry** to preview that branch, and drag the component in — with nothing merged or deployed. Then PR it through the normal pipeline.
   This answers, exactly, the quote in Builder's own blueprint from a real content marketer: *"We need a custom component change. Talk to engineering. They'll do it. It'll take a couple of weeks."* That's Jabil's stated #1 priority, SiteOne's *"~90% of content requires some code knowledge,"* and Lifeplus's locked-properties ask, all in one four-minute workflow. ⚠️ **Never point a production entry at a branch**, and never publish an entry using a previewed component before the code is merged and deployed — say the safety gate out loud, platform teams are listening for it. Full script beat in **doc 07 §5.1**.

2c. **The sub-agent setup flow, as its own demo.** Keep a disposable repo and scratch Hybrid space where you can run *"Install Builder Content into this web application"* live — the sub-agent scaffolds the codebase for the framework and wires models, pages and the registry to match existing content. Answers the other blueprint quote, from a VP: *"We have a request from a business org to create a new site and hand it off to them to edit going forward."* Multi-property companies (Polyconcept, Al Tayer, Jabil, Lenovo) feel this immediately. Doc 07 §5.2.
3. **Conflict handling on the calendar** — Al Tayer's literal ask, and nobody demos it.
4. **RTL as a first-class case.** `ar-AE` with real RTL layout, not just translated strings.
5. **The guardrail spectrum**, switched live by role (§7.5). Answers SiteOne's stated tension with a demonstration.
6. **Preview links for non-seat reviewers** — Cinch's hard requirement. Worth confirming support and building into the workflow demo.
7. **AEO/SEO surface.** Now spec'd properly in §10.5. The short version: crawlability is quotable, metadata is DIY-but-demoable, and **AEO is a real product gap that an MCP agent can turn into a differentiator.** Given Contentful shipped Palmata in June 2026 and Contentful is your #1 named competitor, this will come up.
8. **DAM story.** Al Tayer is evaluating **CMS + DAM together**. Seed the Builder DAM with properly tagged assets, metadata, and multiple crops/ratios per asset, so there's something to show when it comes up.
9. **A "what breaks without Builder" moment.** Show the developer-owned 90% of the PDP, then the one `promo-slot` marketing owns. This is your AloYoga story, but live and inspectable rather than a browser-extension highlight.
10. **Instrument the demo itself.** You have a heatmap. Point it at your own demo site and you'll know which sections prospects' eyes actually go to when you share the URL after a call.
11. **Record the flicker comparison.** A throttled-connection side-by-side of client-swap vs. server-resolved variants. Visme raised it; it'll come up again.
12. **Keep a sanitized public version.** Your demo URL gets shared after calls. A version with no internal notes, no customer names, no test pages — unlike today's space, which has `/sammons-test-page` and a `#Nestle Ecomm API key` comment in a public repo.

---

## 14. Corrections to the existing demo script

Carry these into the rewritten script (`04-demo-script.md`):

| Old script says | Reality |
|---|---|
| "Builder's AI assistant can help you translate entire pages automatically" | **Keep the demo, change the framing.** The Visual Editor AI *does* translate a page when asked — it just isn't a documented, supported localization method (the four documented ones are inline, whole-entry, data-model, and a provider integration). Show it as a prototyping shortcut, not as the localization program. |
| "Trigger Slack notifications … when content transitions" | **Webhooks only** (`stageMoved`, `requestPublish`, `requestStageMove`). No native Slack. Not retried. |
| "Visual Copilot" | Dead brand. Use **Visual Editor AI** and **Builder Code agent**. |
| "Builder.io's Publish" | **Builder Content**. ("Fusion"/"Projects" → **Builder Code**.) |
| "prerender any targeting content on the edge … no additional latency" | `prerender: false` is **undocumented**. Say: variants resolve at the CDN edge and serve from cache. |
| `permissionsRequiredToEdit` | The documented option is **`requiredPermissions`**. |
| "you're using Smartling today?" (as the default assumption) | **Ask.** Crowdin/Phrase/Smartling are documented end to end; Lokalise, GlobalLink and Google Translate are also listed on `builder.io/integrations`. Trade Nation uses Phrase. |
| "Section model" | Reports as `kind: "component"` in this space's API/MCP, but that mapping isn't documented — verify before asserting. |
| Shopify as the assumed backend | Lead with the **first-party data** pattern; Shopify is one option among several. |
| "bidirectional integration with analytics providers like GA4… send GA data into Builder" | **Cut it.** The documented flow is outbound only — a `contentLoaded` callback firing *your* provider's tracking call. GA4 appears nowhere in the analytics docs; Amplitude is the only named example. |
| "We're on GCP… built to be elastic… if Builder had an outage your app still retrieves content so end user experience isn't affected" | **GCP and "elastic" aren't documented** — trivially checkable. What *is* documented: Builder's CDN uses `stale-while-revalidate` and `stale-if-error` and *"shields users during origin hiccups."* And zero request-time reliance is framed as something **you** build: *"you can place your own cache between your app and Builder."* Say the CDN + stale-cache part; don't promise outage invisibility. |

---

*Companion documents: `02-seed-data-spec.md`, `03-build-checklist.md`, `04-demo-script.md`.*
