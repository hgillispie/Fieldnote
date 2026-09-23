# Build Checklist — Fieldnote Demo Environment

Work top to bottom. Items marked **⛔** are hard blockers — nothing downstream works until they're done. Items marked **🔥** are in the MVP cut (~9 days to demoable). Items marked **🟢** belong to **Builder Code**, not Claude Code — see doc 07 for the boundary.

> **⚠️ Two structural changes — read before starting.**
>
> **1. Content comes before code.** Phase 3a (models + a content skeleton) now runs **before** Phase 1. Builder's Fusion + Publish blueprint has new customers stand up models and enough content to give the Code sub-agent a starting point, then scaffold the codebase to match. Phase 3b (bulk seeding) stays where it is.
>
> **2. Phase 2 is three components, not twelve.** Claude Code builds `Hero`, `Section` and `ProductCard` as reference implementations plus the handoff artifacts (`AGENTS.md`, `.builder/rules/*.mdc`, validation command). **Builder Code builds the other nine** — it's documented as weak on empty repos (*"Without real-life code for the AI to analyze, it can't understand how your components should be used"*) and strong once there are examples. The handoff artifacts are a primary deliverable, not documentation.
>
> **⚠️ MCP model writes go to a LOWER ENVIRONMENT.** Builder's own blueprint: *"The MCP makes direct content model updates. This has to happen in a lower environment or it will break production immediately."* Create models in `dev`, verify, push up.

---

## Phase 0 — Setup + spikes · 1.5 days

### Entitlements

- [ ] ⛔ 🔥 **Confirm plan entitlements on the new space.** A/B testing **Enterprise** · Insights/heatmap **Enterprise** · Impressions **Growth/Enterprise** · Custom targeting attributes **Enterprise** · Workflows + custom roles **Enterprise add-on** (`governance` / `customRoles`) · Environments **Enterprise** · Localization **Pro** · Scheduler/calendar **Pro** · the blog blueprint page is also labeled **Enterprise**.
      *If any of these aren't on the space, the corresponding demo section cannot be built. Find out now, not in week four.*

### ⛔ Spikes — five undocumented behaviors this plan depends on

*Each is ~30 minutes in the Sandbox space. Each has a named fallback. Do them before budgeting the phases they gate.*

- [ ] ⛔ 🔥 **Track REST endpoint.** Post ~20 impression / click / conversion events to `POST https://cdn.builder.io/api/v1/track?apiKey=`. Wait 30 min. Do they land, attributed to the right `contentId` / `variationId`?
      *Only `type: "conversion"` is documented for this endpoint, and only inside the Shopify pixel example. `contentId` / `variationId` appear in no documented payload. Also: conversions are calculated **from impressions**, so synthetic conversions without matching impressions may never attach to a variation.*
      **Fallback:** Playwright-only generator — slower, but the only end-to-end documented path.
- [ ] ⛔ **Gen 2 `<BuilderContent>`.** Is there an equivalent on `@builder.io/sdk-react` for (a) A/B tests on data models and (b) live custom-field updates in the editor? *Both docs pages are Gen 1 only.*
      **Fallback:** keep every A/B test on page/section models.
- [ ] ⛔ **Gen 2 `sessionId`.** Can you read it for `&builder.overrideSessionId=`? *The documented example imports `builder` from Gen 1.*
      **Fallback:** drop the cross-domain checkout beat.
- [ ] ⛔ **Role-conditional tokens.** Can `register()` read role context? *Undocumented; `styleStrictMode`/`allowOverridingTokens` are space-wide and components-only mode is **account-wide**.*
      **Fallback:** the two-dial guardrail demo that's already scripted.
- [ ] ⛔ 🔥 **Client-rendered impressions.** Confirm a client-rendered `<Content>` reliably fires impressions. *(Should work — impressions are JS-driven — but the RSC→zero-impressions chain is inference, not documented.)*
      **No fallback — this is a hard blocker for all of Phase 7.**

### Third-party accounts — **full detail in `05-services-and-credentials.md`**

*Hunter is doing these in parallel. Don't block on them — build against the `product` data model and a local DummyJSON snapshot first, then wire the connectors when keys land.*

- [ ] 🔥 **Vercel Pro** ($20/mo) — Hobby is non-commercial-only, and its cron jitters ±59 min
- [ ] 🔥 **Shopify dev store** via Partners + `--demo-data`; token from the **Headless sales channel**. ⛔ **Set `apiVersion` to `2026-07`** — the Builder plugin defaults to the retired `2020-07` and fails silently
- [ ] 🔥 **Algolia** — needs **two** keys: a *restricted* key (ACL `search`, `addObject`, `deleteObject`) for the Builder plugin's content sync, and a *search-only* key for the frontend
- [ ] 🔥 **Cloudinary** — plugin needs only **Cloud name + API key**, no secret. ⛔ Verify the Media Library picker works on a free account (the plugin README mentions an SSO requirement; fall back to Builder's own DAM if blocked)
- [ ] 🔥 **Slack** — throwaway workspace, app + Incoming Webhook. One webhook = one channel, 1 msg/sec
- [ ] 🔥 **DummyJSON snapshot** — `GET /products?limit=0`, **commit the 194-product JSON into the repo**, serve from a route handler. This is the "first-party PIM" source; never depend on the live host
- [ ] **Pexels** for lifestyle imagery (not Unsplash — its mandatory-hotlinking rule conflicts with the DAM story)
- [ ] **Crowdin** free tier for the localization provider beat (not Phrase — no free tier, and its trial excludes integrations)
- [ ] `.gitignore` covers **`.env`**

### Setup

- [ ] ⛔ 🔥 Create Space **`Fieldnote`** — **type: HYBRID**. ✅ Hybrid is real and is what Builder's Fusion + Publish blueprint **recommends for new customers**. It presents as two product sections (Code and Content) talking over the MCP. *(Whether space type is immutable isn't documented — choose correctly regardless.)*
- [ ] 🔥 Create Space **`Fieldnote Sandbox`** (Hybrid) for scratch work and the Phase 0 spikes
- [ ] Create Space **`Fieldnote Scaffold`** (Hybrid) + a disposable repo — for demoing the sub-agent setup flow live (doc 07 §5.2)
- [ ] Create environments inside `Fieldnote Web`: **`staging`**, **`dev`** (Enterprise; 3 total incl. `main`)
- [ ] Record the Public API key for each environment; bookmark `builder.io/app?useSpace=<KEY>` per environment
- [ ] 🔥 New GitHub repo `fieldnote-demo` — **private**, with a `.gitignore` that covers **`.env`** (the current repo's doesn't)
- [ ] 🔥 Vercel project, preview deployments on, env vars set **in Vercel, not committed**
- [ ] Create demo users: `+copywriter@`, `+marketer@`, `+legal@`, `+editor-fr@`, `+dev@`
- [ ] Leave `Shopaholic Platform` **completely untouched** — archive reference only

---

## Phase 3a — Models + content skeleton · 1 day · ⬅️ **moved ahead of Phase 1**

*This is what the Builder Code sub-agent scaffolds against. Bulk seeding stays in Phase 3b.*

- [ ] ⛔ 🔥 Create the **14 models** in the **`dev` environment** (see Phase 3 below for the full list) — ⚠️ not `main`
- [ ] 🔥 Create **2–3 entries per model** — enough to give the sub-agent a real shape to read, not the full catalog
- [ ] 🔥 Set a **Preview URL** on every model (include the scheme)
- [ ] Verify in the Content UI that models and entries look right, then push `dev` → `main`

---

## Phase 1 — Foundation · 3 days

- [ ] ⛔ 🔥 `create-next-app` — **Next 15 App Router**, React 19, TypeScript strict, Tailwind 4
- [ ] ⛔ 🔥 Install **`@builder.io/sdk-react` ^5.2** — *not* `@builder.io/sdk-react-nextjs` (0.x, beta, **no support for interactive Builder features**: state, actions, dynamic bindings). Don't describe it as "undocumented" — it's a real first-party package with a README.
- [ ] ⛔ 🔥 **Token pipeline — the highest-leverage task in the build:**
  - [ ] Define every `--fn-*` custom property in `globals.css` (see seed spec §0)
  - [ ] `tailwind.config.ts` references them: `colors.primary = 'var(--fn-color-primary)'`
  - [ ] `editor.settings` registers them as `var(--fn-*, fallback)`
  - [ ] **Verify end-to-end:** change one variable in `globals.css` → confirm the app, a Tailwind class, and the Builder token picker all move
      *This is the thing that's broken today — 30 tokens pointing at CSS variables that don't exist.*
- [ ] 🔥 Load fonts via `next/font` with real fallback stacks. *(Today `globals.css` declares Poppins and never loads it.)*
- [ ] 🔥 `<RenderBuilderContent>` client wrapper: `"use client"`, `<Content>`, `isPreviewing()`
- [ ] ⛔ 🔥 **Single `builder-registry.ts`, client-side.** RSCs cannot be registered as custom components **on this SDK**. *(They can on `sdk-react-nextjs` via `isRSC: true` — don't tell a prospect Builder can't do RSC.)*
- [ ] 🔥 `builder.init` equivalent **once** — Gen 2 takes `apiKey` per call; centralize it in one config module. *(Today it's called 13 times.)*
- [ ] 🔥 ISR with `revalidate`. **No `force-dynamic`.** Leave `staleCacheSeconds` high — default is **one day**; 3600s is the *minimum*, not the default.
- [x] Set **Preview URL** on every model (include the scheme: `http://localhost:3000`) — done in Phase 3a
- [x] `/demo-switcher` page (noindex) with buttons to set targeting attributes — 6 segments from seed spec §5, real cookie + redirect, not yet wired into the homepage fetch (see CLAUDE.md)
- [x] CI: typecheck + lint + build on PR. *(The old repo has never had CI.)* — also runs `test`; `.github/workflows/ci.yml`

---

## Phase 2 — Components · 4 days

**Every component, without exception:**
- [x] ⛔ 🔥 Spreads `{...attributes}` onto its root element — **this carries `builder-id`, and missing it is the #1 documented cause of empty heatmaps** — paired with `noWrap: true` on all 3 exemplars
- [x] 🔥 Has a real thumbnail image — inline SVG data URIs, no external dependency
- [x] 🔥 Has sensible non-lorem defaults
- [x] 🔥 Sanitizes any `dangerouslySetInnerHTML` with DOMPurify *(today 5 of 6 are unsanitized)* — n/a for the 3 exemplars, none render raw HTML; first component that does (`RichText`, article bodies) must add `isomorphic-dompurify`, per `.builder/rules/components.mdc`
- [x] 🔥 Uses **no interpolated Tailwind classes** — `text-${alignment}` never compiles. Map to a static lookup object. *(Four components have inert inputs because of this.)*

### 2a — Three exemplar components · **Claude Code**

*These are reference implementations. Builder Code will pattern-match off them for the other nine, so anything sloppy here propagates nine more times.*

- [x] ⛔ 🔥 `Hero` — `variant`: image / split / text (replaces 3 near-duplicates) — live-render-verified
- [x] ⛔ 🔥 `Section` — width / padding / background, all token-bound — live-render-verified
- [x] ⛔ 🔥 `ProductCard` — `source` enum + **static fallback** — live-render-verified; defaults to `static` since `product` has no reachable entries yet (see CLAUDE.md discrepancy note)

### 2b — Handoff artifacts · **Claude Code** · ⛔ *this is what makes Builder Code good*

- [x] ⛔ **`AGENTS.md`** (< 500 lines) — stack, model schema, token namespace, non-negotiables — 172 lines, includes the `customComponents` registration gotcha (see CLAUDE.md)
- [x] ⛔ **`.builder/rules/*.mdc`** — ⚠️ each ≤ **200 lines / 6,000 chars**, combined always-on ≤ **500 lines**, **max 3–5 with `alwaysApply: true`**. Builder documents *"rule fatigue"* past that — the agent starts ignoring them. Suggested: `components.mdc`, `tokens.mdc`, `builder-registry.mdc` (always-on) + `content-models.mdc` (on-demand) — built exactly this way, combined always-on 257 lines
- [x] ⛔ **`npm run typecheck` and `npm run test` must exist and pass** — Builder Code runs them as its **Validation command** after *every* agent task. The only documented mechanism that makes it self-correcting.
- [ ] Set the Validation command in Builder Code: Project Settings → Setup — **Hunter's action**, no MCP/CLI access to Builder Code's own UI settings
- [ ] Project Settings → Agent → consider turning **off** "Enforce default command restrictions" (it's **on** by default and blocks `curl` and `npx`) — **Hunter's action**
- [ ] Connect Builder Code to the repo — **Hunter's action**

### 2c — Remaining nine components · 🟢 **Builder Code**

*Prompt pattern: "Build a `X` component following the pattern in Hero.tsx. Make it available in Publish with `a`, `b`, `c` configurable." The sub-agent auto-registers it — no manual registration.*

- [ ] 🟢 `ProductGrid` — `source`: Builder / Shopify / API + static fallback
- [ ] 🟢 `FeatureCards`
- [ ] 🟢 `RichText` — sanitized
- [ ] 🟢 `Accordion` — Radix-based
- [ ] 🟢 `SearchBox` — `react-instantsearch` **v7**, CSS imported
- [ ] 🟢 `Disclosure` — renders a `disclosure` entry by key
- [ ] 🟢 `LeadForm` — posts to a real endpoint
- [ ] 🟢 `ArticleList` — filtered by `surface` + `topic`
- [ ] 🟢 `Testimonials` — inline list, no model
- [ ] ⚠️ Iterate on **one branch**, not a new branch per tweak — cache hits make same-branch iteration much cheaper in agent credits
- [ ] ⚠️ Section by section. Builder's own best practices flag *"Build me a complete e-commerce website"* as an explicit anti-pattern

Guardrails:
- [ ] `childRequirements` on `Section` and `Hero`
- [ ] `requiredPermissions: ['editDesigns']` where appropriate — **the documented option is `requiredPermissions`, not `permissionsRequiredToEdit`**
- [ ] `models: ['page','landing-page']` scoping
- [ ] ⛔ 🔥 **Register insert menus unconditionally.** Do **not** gate on `editingModel === 'homepage'` — that's what hides 9 components today.
- [ ] Guardrail demo as **two dials**: a custom role *without* `editDesigns` (no Style tab), and space-wide `styleStrictMode` / `allowOverridingTokens`. ⚠️ **Not** role-conditional token registration — that's undocumented, and components-only mode is **account-wide**.

---

## Phase 3b — Bulk content · 3 days

*Models were created in Phase 3a. This is the volume seed — fan out subagents.*

- [ ] 🔥 **Page models (2):** `page`, `landing-page`
- [ ] 🔥 **Section models (6):** `homepage`, `nav`, `footer`, `promo-slot`, `pdp-section`, `article`
      *Remember: "Section" in the UI = `kind: "component"` in the API/MCP.*
- [ ] 🔥 **Data models (6):** `product`, `author`, `help-topic`, `store`, `disclosure`, `nav-config`
- [ ] 🔥 `article` carries **structured fields AND `uiBlocks`** — the documented blueprint (Enterprise-gated page). **A `data` model cannot hold `uiBlocks`; don't try.**
- [ ] 🔥 Seed **48 products** (seed spec §1) — real names, real materials, no round-hundred prices
- [ ] 🔥 Upload product imagery to the **Builder DAM**, tagged (category / colorway / season / orientation), **3 crops each**
- [ ] Seed **26 articles** — 14 help, 8 blog, 4 pro. Blog bodies must actually use components in `blocks`.
- [ ] Seed **5 authors**, **14 stores**, **9 disclosures**, `nav-config`
- [x] ~~🔥 Make the **footer Builder-driven**~~ — **Reversed by Hunter 2026-09-23**: nav and footer are hardcoded in `src/app/layout.tsx` on purpose, not Builder-driven — a marketer shouldn't be able to change brand/structural chrome. See CLAUDE.md. `nav`/`footer` models still exist but are unused by the app.
- [ ] List queries pass `omit: "data.blocks"`; detail queries pass `includeRefs: true`
- [ ] 🔥 **Write `npm run snapshot` now, not in Phase 9.** ~50 lines against the Write API, exporting every model's entries to committed JSON. Everything built after this point is protected by it.

---

## Phase 4 — Surfaces · 3 days · 🟢 **mostly Builder Code + the Content Visual Editor**

- [ ] 🔥 **Retail** `/` — homepage, PLP, PDP with a `promo-slot`, `/stores`
- [ ] 🔥 **Help** `/help` — topic index, article template, search
- [ ] **Pro** `/pro` — campaign landing page, gated content, `LeadForm`
- [ ] **Card** `/card` — product page with `Disclosure` components, `/card/intro-apr` landing page
- [ ] `/pro` and `/card` nav items appear conditionally via targeting
- [ ] 🔥 Build the **"90% developer-owned, 10% marketer-owned"** PDP: real product data from code, one editable `promo-slot`

---

## Phase 5 — Data sources · 2 days

- [ ] 🔥 **Pattern A:** `product` model as first-party data — the default, always works
- [ ] **Pattern B:** API Data Source. Data tab → API Data → + API Data Source.
      If data shows in the Preview URL but not the Visual Editor, allow CORS origins **`https://builder.io`** and **`https://*.builder.io`** (no `www`).
- [ ] Shopify connector wired to **one section only**, so an outage can't blank the site
- [ ] Algolia on `react-instantsearch` v7, index seeded from `product`
- [ ] ⛔ 🔥 **Static fallback on every data-bound component.** *(The live site currently renders "No product found." on the homepage.)*
- [ ] **Delete Swell, Emporix, Commercetools entirely.** Two are non-functional; Emporix renders a **$9,999** placeholder; commercetools was never mentioned by a single prospect.
- [ ] *(If Al Tayer is live)* wire the **Salesforce Commerce Cloud** connector. ⚠️ It brings **Product and Category data** in — nothing on cart, checkout, pricing or inventory — needs a pre-existing SLAS Public Client, and has an optional Proxy field. Don't present it as satisfying "no middleware" wholesale.

---

## Phase 6 — Targeting & localization · 3 days

**Targeting**
- [ ] 🔥 Create 6 custom attributes with **enums set** (seed spec §5)
- [ ] 🔥 Pass `userAttributes` on every fetch. ⛔ **`device` and `urlPath` are auto-extracted client-side but must be passed explicitly on SSR/SSG.**
- [ ] 🔥 Build VIP, Lapsed, Pro, Paid-social, UAE-mobile variants
- [ ] Verify targeting on a **data model** (docs confirm it works; whether the editor shows a Targeting tab on data entries is **NOT VERIFIED** — check it)

**Localization**
- [ ] 🔥 Add 8 locales: `en-US`, `en-GB`, `fr-FR`, `fr-CA`, `de-DE`, `ja-JP`, `ar-AE`, `es-MX`
- [ ] 🔥 Create locale **groups** `en` and `fr` with defaults — fallback chain: locale → group default → space default
- [ ] ⛔ 🔥 **Pass `locale` on every fetch.** Omit it and localized fields render as **`[object Object]`**.
- [ ] 🔥 **Inline localization** on the announcement Symbol — one component, 8 languages, **no duplication**. *(Al Tayer's exact ask — build this first.)*
- [ ] **Whole-entry variant** for `de-DE` homepage — different imagery and merchandising, not just strings
- [ ] Leave `fr-CA` and `es-MX` **partially** localized to demo the fallback chain
- [ ] ⛔ **RTL for `ar-AE`**: `dir="rtl"`, logical CSS properties throughout, mirrored directional icons
- [ ] Bound data: Data tab → Connect Data → Query → Locale = **Dynamic (bound to state)**
- [ ] **Build all four documented localization methods** (`/c/docs/localization-intro#ways-to-localize`): inline/field-level · whole-entry · data-model · provider integration
- [ ] **Visual Editor AI translate** — verify it works on a page and script it as a *prototyping shortcut*, not a supported feature. (It works; it just isn't one of the four documented methods.)
- [ ] **MCP bulk-localization beat** — `search_content_ids` → `get_content` → `update_content` across a locale. A few minutes of agent work, and no competitor has an authoring-time equivalent.
- [ ] ⚠️ **Never toggle localization off on a block in the Visual Editor — the docs say in bold that it deletes the localized content.** *(No equivalent warning is documented for data-model fields — don't do it there either, but don't claim it as documented.)*
- [ ] *(Optional)* wire the **Phrase** plugin (needs a Phrase **Ultimate** plan on their side, plus Builder Content Pro). Crowdin / Phrase / Smartling are documented end to end; **Lokalise, GlobalLink and Google Translate are also listed on builder.io/integrations as community plugins** — don't tell a Lokalise customer it's unsupported. Trade Nation uses Phrase.

---

## Phase 6.5 — SEO & AEO · 2.5 days

*Full context in plan §10.5. The short version: SEO is defensible, AEO is a real product gap, and the MCP audit agent turns that gap into a differentiator.*

**SEO — the DIY parts Builder documents**
- [ ] Add SEO custom fields to `page`, `landing-page` and `article`: `seoTitle`, `seoDescription`, `ogImage`, `canonical`, `noindex` (boolean), `includeInSitemap` (boolean, default true)
- [ ] Render them via `generateMetadata` — **Builder does not emit `<head>` tags; you do**
- [ ] Sitemap route: query `cdn.builder.io/api/v2/content/page?fields=data.url&query.data.includeInSitemap.$ne=false` → emit XML. *(Editor toggles a page out of the sitemap without a ticket — nice small beat.)*
- [ ] `robots.txt`
- [ ] Confirm ISR gives clean server-rendered HTML — **this is the crawlability answer `force-dynamic` currently can't support**

**JSON-LD — implementation patterns, not Builder features**
- [ ] `<JsonLd>` registered component, or head injection from a `jsonLd` custom field *(prefer head injection)*
- [ ] Emit **Product** schema on PDP, **Article** on `article`, **FAQPage** on help articles, **BreadcrumbList** site-wide
- [ ] ⚠️ **Never cite Builder's "structured data" docs as schema.org support** — those pages are about Data models. A technical SEO buyer will open them.

**AEO — the differentiated beat**
- [ ] Add AEO fields to the `article` model: `answerSummary` (short extractive answer), `faqPairs` (list of Q/A), `entityType`
- [ ] Build the **MCP audit agent / skill**:
      `get_pages_hierarchy` → `search_content_ids` → `get_model_schema` → `update_builder_model` (add the AEO fields) → `get_content` → `update_content` (populate)
- [ ] Rehearse it: *"audit every article for answer-engine readiness, add the missing fields, populate them"* — running live, inside the governance rules, landing in **Draft**
- [ ] ⛔ **Builder ships no AEO product.** Say *"here's what you can build on the MCP server today."* Contentful shipped **Palmata** (GA June 2026), Storyblok resells Otterly.AI, and Optimizely/Sitecore/HubSpot all have AEO. Route serious AEO bake-offs internally.
- [ ] ⚠️ Don't promise llms.txt generation — no such feature exists.

---

## Phase 7 — Analytics · 3 days · 🔥 **start this early regardless**

*In the MVP because it's your biggest gap and because the generator needs a week of runway before the numbers look real.*

- [ ] ⛔ 🔥 Audit every component for `{...attributes}` / `builder-id`
- [ ] ⛔ 🔥 Confirm impressions are firing (hydrated SDK required — **pure RSC produces zero**)
- [ ] 🔥 Wire conversions, browser-side only:
      `track({ type: 'conversion', amount, apiKey })` from `@builder.io/sdk-react`
  - [ ] Add to cart (amount = price)
  - [ ] Start checkout
  - [ ] Complete order
  - [ ] Lead form submit (Pro)
  - [ ] Card application start
- [ ] Cross-domain checkout: append `&builder.overrideSessionId=${builder.sessionId}` — **pending the Phase 0 Gen 2 `sessionId` spike**; drop the beat if there's no Gen 2 path
- [ ] Consent banner — built, **off by default**, toggleable *(a banner blocking Builder cookies kills all tracking)*
- [ ] ⛔ 🔥 **Build the synthetic event generator** (seed spec §7) — **only after the Phase 0 track-REST spike**
  - [ ] **Playwright layer first** — real page loads across device / locale / segment. The only end-to-end documented path, and it doubles as instrumentation-regression detection.
  - [ ] Direct track REST layer **only if the spike passed** — batched events, far cheaper at volume
  - [ ] Realistic volume, weekday/weekend curve, segment skew, power-law PDP distribution
  - [ ] Click weighting concentrated on real CTAs (22% hero, 31% product tiles, …)
  - [ ] Conversion values drawn from actual catalog prices
  - [ ] **45-day backfill** on first run
  - [ ] Daily schedule (Vercel Cron / GitHub Action), rolling window
  - [ ] Watch the **bandwidth quota** — API reads/writes count against it
- [ ] 🔥 Configure **5 A/B tests** — 4 with green significance, **1 deliberately inconclusive**
      ⚠️ **Duplicate the published entry before configuring** — variations aren't ported if you pick a winner first
- [ ] A/B on data models: wrap in `<BuilderContent>` or you only ever get the default variant — **Gen 1-only doc; pending the Phase 0 spike.** Fallback: keep all tests on page/section models.
- [ ] 🔥 **Verify the heatmap actually populates.** Range = **last 7 days**. Wait 30+ min after events. Don't press Shift (it toggles the heatmap off).
- [ ] Server-resolve variants so there's **no flicker** — record a throttled side-by-side (Visme's objection)

---

## Phase 8 — Governance, scheduling, environments · 2 days

**Governance**
- [ ] Create 5 custom roles (seed spec §9)
- [ ] Workflow `Fieldnote Content`: Draft → Content Review → **Legal Review** → Ready to Publish → Published, sequential on
- [ ] Per-stage edit/transition permissions; **Legal Review = no one can edit**
- [ ] 3 rules (seed spec §10) — especially **`{ "component.name": "Disclosure" }`**, which is model-agnostic
- [ ] Webhook receiver (Vercel function) → real Slack channel. **No native Slack integration; webhooks are not retried.**
- [ ] Verify the **"Request Stage Move"** beat by actually hitting the wall as `+copywriter@`
- [ ] Verify **approval re-triggering** — approve, then edit the approved element, confirm the rule resurfaces. *(Note: moving content **backward** does **not** re-evaluate approvals.)*
- [ ] Heads-up: a docs page titled **"Integrate Slack"** exists (`/c/docs/agent-for-slack`) — that's the Builder **Code** agent, unrelated to content workflows, but visible in the nav if a prospect browses. Know the difference.

**Scheduling**
- [ ] Build the **90-day rolling calendar** (seed spec §8)
- [ ] Include the **D+5 / D+12 deliberate overlap** — Al Tayer's "conflict handling"
- [ ] Include the **9-hour EU offset** on the Fall Arrivals hero — the time-zone beat
- [ ] Leave the Card campaign **sitting in Legal Review** with its start date approaching
- [ ] Verify it renders in `builder.io/app/scheduler` across month / week / day / agenda
      *Note: the calendar is **read-mostly** — you schedule on the entry, not from the calendar.*
- [ ] Scheduled job to **roll the calendar forward weekly**

**Environments**
- [ ] Verify Live Sync `main → dev` (on by default, one-way)
- [ ] Disable Live Sync on one model, edit in `dev`, **Push** to `main`
- [ ] ⚠️ Know the traps: re-enabling Live Sync **overwrites all unpushed child changes**; a push pushes *all users'* changes on that entry; push order is **models → dependent content such as Symbols → content**; webhooks migrate manually
- [ ] ✅ **Resync is selective, not destructive** — you pick what copies from the parent, and Custom Targeting, Users, Custom Roles, Breakpoints and Plugins are opt-in. Design Tokens, Advanced Settings, Fonts and Code Gen Instructions sync by default.

---

## Phase 9 — Demo tooling · 2.5 days

**Reset pipeline** — plan §10.6. ⚠️ **Write `npm run snapshot` back in Phase 3**, the moment there's content worth snapshotting; it's ~50 lines against the Write API and it protects everything built after it.

- [ ] **`npm run snapshot`** — export every model's entries to JSON, commit to the repo
- [ ] ⛔ **`npm run reset`** — diff live content against the last good snapshot, write back via the Write API. **Idempotent.** Takes an optional model/path filter so you can drop the one page you built live without rebuilding the space. ~2 min.
- [ ] **`npm run seed --fresh`** — recreate models, content, targeting and locales from scratch in an empty space. ~15 min. Your disaster recovery.
- [ ] **GitHub Action**: nightly snapshot cron + `workflow_dispatch` so you can trigger a reset from your phone between calls
- [ ] **Vercel Cron** (Pro): weekly calendar roll-forward + daily analytics generator
- [ ] ⚠️ **Keep reset away from Live Sync.** Re-enabling Live Sync overwrites unpushed child changes — you do not want that behind a cron job.
- [ ] **`npm run seed -- --from ./prospect.csv`** — the "our data" adapter (plan §10.3)
- [ ] **Brand override** — one JSON of token values + logo restyles the whole demo
- [ ] Asset import step — pull prospect imagery into the Builder DAM
- [ ] Build the 3 vertical swap sets: Meridian Health, Northgate Financial, Axiom Software
- [ ] Connect the **Builder CMS MCP** (`https://mcp.builder.io/mcp/publish`) in Claude/Cursor and rehearse creating a page agentically inside the governed space
- [ ] Build the **"before" toggle** — a space or branch with governance off and tokens open
- [ ] Rehearse end to end, twice, on a real connection
- [ ] Write the **pre-call checklist** (below) and tape it to your monitor

### 🟢 Builder Code demo beats — rehearse these (doc 07 §5)

- [ ] ⭐⭐ **Preview for Publish loop.** Create a **dedicated test entry** (`/demo/component-test`) that exists only for this. Rehearse: branch → *"build a countdown banner, make the end date and headline configurable"* → *"make this available in Publish"* → switch the test entry's preview to that branch → drag it in → PR. Target: **under 4 minutes.**
- [ ] ⛔ ⚠️ **Never point a production entry at a branch**, and never publish an entry using a previewed component before merge + deploy. Say the safety gate out loud on calls — platform teams listen for it.
- [ ] ⭐ **Scaffold demo.** In the disposable `Fieldnote Scaffold` space + repo, rehearse *"Install Builder Content into this web application"* live
- [ ] **Contentful migration.** A Contentful-shaped app + *"migrate my existing site to work with Builder Content"*. Be precise: the sub-agent migrates the **code layer**; entry migration is a script you wrote

---

## Pre-call checklist

- [ ] Heatmap date range set to **last 7 days**
- [ ] **No publishing in the last 30 minutes** (Insights latency is ~30 min)
- [ ] Event generator ran today — verify data is fresh
- [ ] `npm run reset` was run after the last demo
- [ ] Signed in as Admin in profile 1, **Copywriter in profile 2**
- [ ] Correct space selected — bookmark `?useSpace=<KEY>`
- [ ] Slack webhook channel open in a tab
- [ ] Calendar rolled forward — nothing says "March"
- [ ] Shopify / Algolia reachable; fallbacks verified either way
- [ ] Don't press **Shift** during the heatmap (toggles it off)

---

## Do not repeat from the old build

| Mistake | Where |
|---|---|
| Insert menus gated on `editingModel === 'homepage'` | hid 9 components on every other model |
| Design tokens referencing undefined CSS variables | 30 tokens resolving to nothing |
| `font-family: Poppins` with no font loaded | `globals.css:83` |
| `force-dynamic` on every route | no caching, no ISR, weak crawlability answer |
| `enrich` nested **inside** `userAttributes` | became a targeting attribute |
| Interpolated Tailwind classes (`text-${alignment}`) | 4 components with inert inputs |
| shadcn "Pedro Duarte" placeholder in cart / auth / nav | the first thing prospects click |
| Lorem ipsum in the production footer | live today |
| Five commerce backends, two non-functional | Emporix renders $9,999 |
| `.env` committed to a public repo | in git history permanently |
| Customer names in code comments | `#Nestle Ecomm API key` |
| Test pages in the demo space | `/test`, `/xyz`, `/sammons-test-page` |
| Unsanitized `dangerouslySetInnerHTML` | 5 of 6 components |
| Duplicate components (two Accordions) | the worse one was registered |
| No CI, no tests | never existed |
