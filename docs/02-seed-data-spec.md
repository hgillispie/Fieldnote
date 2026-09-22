# Seed Data Specification — Fieldnote Demo

Concrete specs for every piece of data the demo needs. The guiding rule: **the data has to survive being looked at.** Prospects read the product names, hover the prices, and open the blog. Placeholder data is where demos lose credibility fastest — and where the current one loses it (`test-test`, `/xyz`, lorem ipsum in the footer, a $9,999 Emporix product).

---

## 0. The brand

**Fieldnote** — outdoor and travel gear. Founded 2014, Portland OR. 120 employees, 14 retail locations, ships to 28 countries.

Chosen because outdoor/apparel gives you genuinely seasonal merchandising (which makes the campaign calendar believable), international markets (which makes localization believable), and a plausible trade arm and co-branded card (which make the B2B and FS surfaces believable).

**Sub-brands / surfaces:**

| Surface | Route | Tagline |
|---|---|---|
| Fieldnote | `/` | Gear for the long way round |
| Fieldnote Help | `/help` | Support, sizing, repairs, warranty |
| Fieldnote Pro | `/pro` | Outfitting for teams, guides and outfitters |
| Fieldnote Card | `/card` | The Fieldnote Rewards Card |

### Design tokens

| Token | Value | Notes |
|---|---|---|
| `--fn-color-primary` | `#1B3A2F` | Deep forest |
| `--fn-color-accent` | `#D4622A` | Trail orange |
| `--fn-color-sand` | `#E8DFD2` | Neutral ground |
| `--fn-color-ink` | `#14161A` | Text |
| `--fn-color-slate` | `#5C6670` | Muted text |
| `--fn-color-surface` | `#FFFFFF` | |
| `--fn-color-surface-alt` | `#F7F5F1` | |
| `--fn-color-success` | `#2F6B4F` | |
| `--fn-color-warning` | `#B8791C` | |
| `--fn-color-danger` | `#A6342B` | |
| `--fn-font-display` | `"Instrument Sans", system-ui, sans-serif` | Loaded via `next/font` |
| `--fn-font-body` | `"Inter", system-ui, sans-serif` | Loaded via `next/font` |
| `--fn-space-1…8` | `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px` | |
| `--fn-radius-sm / md / lg` | `4 / 8 / 16px` | |
| `--fn-text-xs…4xl` | `12 / 14 / 16 / 18 / 24 / 32 / 44 / 56px` | |

**Every one of these must be defined in `globals.css`, referenced in `tailwind.config.ts`, and registered in `editor.settings` as `var(--fn-*, fallback)`.** That three-way binding is the entire point — see plan §7.5.

---

## 1. Product catalog — `product` model

**48 products** across 6 categories. Enough to make a PLP look real and paginate, small enough to hand-curate.

### Schema

```
sku              text       required   # FN-JKT-0142
name             text       required
slug             text       required
price            number     required
compareAtPrice   number                # only on ~20%
currency         text       required   # USD
images           list<file> required   # 3–5 each
category         text       required   # enum, see below
collections      list<text>            # featured / new-arrivals / sale / pro
colors           list<object>          # { name, hex, swatchImage }
sizes            list<text>
badges           list<text>            # New / Best Seller / Limited / Pro Only
description      html       LOCALIZED
shortDescription text       LOCALIZED
materials        text       LOCALIZED
inStock          boolean    required
launchDate       timestamp             # drives the scheduled PDP badge
proOnly          boolean               # gates to Fieldnote Pro
```

### Categories and counts

| Category | Count | Price range |
|---|---|---|
| Outerwear | 10 | $129 – $549 |
| Packs & Bags | 9 | $59 – $329 |
| Footwear | 8 | $99 – $249 |
| Layers | 8 | $45 – $159 |
| Accessories | 8 | $18 – $89 |
| Camp & Travel | 5 | $32 – $279 |

### Sample entries — use these as the tone reference

| SKU | Name | Category | Price | Compare | Badges |
|---|---|---|---|---|---|
| `FN-JKT-0142` | Cascade 3L Shell | Outerwear | 389 | — | Best Seller |
| `FN-JKT-0188` | Ridgeline Down Parka | Outerwear | 549 | 649 | Limited |
| `FN-JKT-0103` | Fieldweight Anorak | Outerwear | 189 | — | — |
| `FN-PCK-0221` | Longhaul 45L Pack | Packs & Bags | 279 | — | Best Seller |
| `FN-PCK-0240` | Daybreak 22L | Packs & Bags | 129 | 159 | — |
| `FN-PCK-0255` | Transit Duffel 60L | Packs & Bags | 199 | — | New |
| `FN-FTW-0310` | Traverse Mid GTX | Footwear | 249 | — | Best Seller |
| `FN-FTW-0325` | Camp Slip-On | Footwear | 99 | — | — |
| `FN-LYR-0402` | Merino 190 Crew | Layers | 95 | — | — |
| `FN-LYR-0418` | Gridfleece Half-Zip | Layers | 119 | 149 | — |
| `FN-ACC-0501` | Trailhead Cap | Accessories | 38 | — | — |
| `FN-ACC-0522` | Dryline Stuff Sack Set | Accessories | 42 | — | New |
| `FN-CMP-0601` | Basecamp Insulated Bottle | Camp & Travel | 48 | — | — |
| `FN-CMP-0615` | Nightfall 20° Bag | Camp & Travel | 279 | 329 | Limited |

**Naming rules that keep it credible:** two words, no puns, no "Lorem." Real materials in the copy (3-layer laminate, 800-fill, ripstop nylon, Merino wool). Prices ending in 9 or 5, never round hundreds. Compare-at prices on **no more than ~20%** of the catalog — a store where everything is on sale reads as fake.

**Localize `description`, `shortDescription`, `materials`** on at least 12 products across `fr-FR`, `de-DE`, `ja-JP`, `ar-AE`. Real translations, not `[FR] Cascade 3L Shell`. Anyone on the call who speaks the language will notice.

### Imagery

Source from a permissive stock library (Unsplash/Pexels outdoor gear), upload into the **Builder DAM**, and — because Al Tayer is evaluating CMS and DAM together — **tag them properly**: category, colorway, season, orientation, model-present/product-only. Store **3 crops per asset** (1:1, 4:5, 16:9) so the asset-variants conversation has something behind it.

---

## 2. Editorial — `article` model

**26 articles.** One model, three surfaces, split by the `surface` field.

| Surface | Count | Character |
|---|---|---|
| `help` | 14 | Support, sizing, warranty, repairs, returns |
| `blog` | 8 | Trip reports, gear guides, sustainability |
| `pro` | 4 | Case studies and outfitting guides |

### Help articles (14)

Grouped under `help-topic`:

**Orders & Shipping** — *Where is my order?* · *International shipping and duties* · *Changing or cancelling an order*
**Returns & Exchanges** — *How to start a return* · *Exchange for a different size* · *Return policy by region*
**Sizing & Fit** — *Outerwear size guide* · *Footwear fit and sizing* · *Layering system explained*
**Care & Repair** — *Re-waterproofing a shell* · *Down care and storage* · *The Fieldnote repair program*
**Warranty** — *Lifetime warranty, explained* · *Filing a warranty claim*

These exist because **Macmillan explicitly rejected a marketing-site framing** and asked for support/knowledge-base examples. Fourteen real support articles turn "we do marketing pages" into "we do your support content at scale."

**Localize at least 4 of them fully** (`Where is my order?`, `How to start a return`, `Outerwear size guide`, `Lifetime warranty`) — support content is the most translation-sensitive content any global retailer owns, which makes it the best localization example.

### Blog articles (8)

*Three days on the Wonderland Trail* · *How we choose down suppliers* · *Shell fabrics, decoded* · *Packing for 10 days in one 45L* · *What "repairable" actually means* · *Winter layering for wet climates* · *Field-testing the Cascade 3L in Patagonia* · *Our 2026 materials report*

800–1,400 words each. Real structure: an intro, 3–5 sections, a pull quote, 2–3 inline images, a product callout. **The visual `blocks` body must actually use components** — a `Hero`, `RichText`, an inline `ProductCard`, a `FeatureCards` row — or the "structured + visual" story has nothing to point at.

### Pro articles (4)

*Outfitting a 12-person guide team* · *Volume pricing and account setup* · *Custom logo application* · *Fieldnote Pro warranty terms*

### SEO / AEO fields on `article`

Add these to the `article` schema and **leave roughly half the articles missing them** — that's what gives the MCP audit agent (plan §10.5) something real to find and fix, live.

```
seoTitle        text
seoDescription  longText
ogImage         file
canonical       text
noindex         boolean    default false
includeInSitemap boolean   default true
── AEO ──────────────────────────────────────
answerSummary   longText              # 40–60 words, extractive, answers the title as a question
faqPairs        list<object>          # { question, answer } — 3–5 per article
entityType      enum                  # Article / FAQPage / HowTo / Product
jsonLd          longText              # generated, not hand-written
```

**Seed 12 of the 26 articles fully; leave 14 with `answerSummary`, `faqPairs` and `jsonLd` empty.** The demo beat is the agent walking the model, finding the gaps, and filling them — which only lands if there are gaps.

Write `answerSummary` the way an answer engine would want to quote it: lead with the direct answer, no throat-clearing, no "At Fieldnote, we believe…". For *Where is my order?* it should start *"Orders ship within 2 business days and arrive in 3–7. Track yours from the link in your shipping confirmation email, or…"*

FAQ pairs should be real questions in real phrasing — *"Can I return something I bought on sale?"*, not *"Sale item return policy."*

### Authors — `author` model (5)

| Name | Title |
|---|---|
| Maya Okonkwo | Head of Product Design |
| Sam Brennan | Field Test Lead |
| Ines Delacroix | Sustainability Lead |
| Theo Park | Customer Experience Manager |
| Ana Rios | Pro Accounts Manager |

Real headshots (permissive stock), 2-sentence bios. Referenced from `article.author` — which is also how you demo `includeRefs: true`.

---

## 3. Stores — `store` model (14)

| City | Country | Locale | Market |
|---|---|---|---|
| Portland OR | US | en-US | us |
| Seattle WA | US | en-US | us |
| Denver CO | US | en-US | us |
| Boston MA | US | en-US | us |
| Austin TX | US | en-US | us |
| Vancouver BC | CA | en-US | ca |
| Montréal QC | CA | **fr-CA** | ca |
| London | UK | en-GB | uk |
| Manchester | UK | en-GB | uk |
| Berlin | DE | de-DE | de |
| Munich | DE | de-DE | de |
| Paris | FR | fr-FR | fr |
| Dubai | AE | **ar-AE** | ae |
| Tokyo | JP | ja-JP | jp |

Real addresses (or realistic ones), coordinates, opening hours, phone numbers in local format. Montréal and Dubai are deliberate: they give you `fr-CA` vs `fr-FR` (locale **groups** with fallback) and `ar-AE` (**RTL**).

---

## 4. Disclosures — `disclosure` model (9)

The governance and FS fuel.

```
key            text      required   # apr-variable
body           html      required   LOCALIZED
jurisdiction   text      required   # US / EU / UK / CA
effectiveDate  timestamp required
reviewedBy     text                 # set by the workflow
version        text
```

| Key | Jurisdiction | What it is |
|---|---|---|
| `apr-variable` | US | Variable APR range and how it's determined |
| `rewards-terms` | US | Points earning, caps, expiration |
| `fees-schedule` | US | Annual fee, late fee, foreign transaction |
| `credit-reporting` | US | Bureau reporting notice |
| `apr-variable-eu` | EU | EU equivalent |
| `rewards-terms-eu` | EU | EU equivalent |
| `cooling-off` | EU | 14-day withdrawal right |
| `apr-variable-uk` | UK | UK representative example |
| `financial-promotion` | UK | FCA financial promotion notice |

Write them in real regulatory register — dense, specific, dated. **These are what the Legal Review workflow stage gates**, and a banking prospect will read the first line and immediately recognize whether you understand their world.

---

## 5. Targeting attributes and segments

### Custom attributes to create

Space Settings → Targeting → Custom Targeting → **+ New Target Attribute**. **Always set the enum** — free-text values are how demos get typos on screen.

| Attribute | Type | Enum values |
|---|---|---|
| `customerTier` | String | `anonymous`, `member`, `vip` |
| `segment` | String | `retail`, `pro`, `card` |
| `lifecycleStage` | String | `new`, `returning`, `lapsed` |
| `campaignSource` | String | `email`, `paid-social`, `organic`, `affiliate` |
| `market` | String | `us`, `ca`, `uk`, `de`, `fr`, `ae`, `jp` |
| `hasProAccount` | boolean | — |

**`market` is deliberately separate from locale.** A customer in the UAE may read English; a customer in Montréal may read French. Conflating market and language is a mistake real global retailers make and Al Tayer will be sensitive to.

### Segments with targeted content built for them

| Segment | Targeting | What they see |
|---|---|---|
| **VIP** | `customerTier = vip` | Early access hero, free expedited shipping banner, 15% member price on the PDP promo slot |
| **Lapsed** | `lifecycleStage = lapsed` | "We saved your size" hero, a win-back offer |
| **Pro account** | `hasProAccount = true` | Trade pricing visible, bulk ordering CTA, Pro nav item appears |
| **Paid social** | `campaignSource = paid-social` | Campaign-matched hero, no nav distractions, single CTA |
| **UAE mobile** | `market = ae` + `device = mobile` | Arabic, RTL, AED pricing, region-appropriate imagery |
| **Anonymous** | default | Standard homepage — the A/B control |

### Demo URLs to bookmark

Build a small `/demo-switcher` page (excluded from search, obviously labeled) with buttons that set attributes and reload. Fumbling attribute values in a devtools console during a call is avoidable.

---

## 6. Locales

| Locale | Group | Purpose |
|---|---|---|
| `en-US` | `en` (default) | Space default |
| `en-GB` | `en` | Group fallback demo — spelling/pricing differences only |
| `fr-FR` | `fr` (default) | Full localization |
| `fr-CA` | `fr` | **Group fallback demo** — partially localized, falls back to `fr-FR` |
| `de-DE` | — | Full-page-variant demo |
| `ja-JP` | — | Non-Latin script |
| `ar-AE` | — | **RTL** |
| `es-MX` | — | Deliberately **partially** localized |

**`fr-CA` and `es-MX` are partial on purpose.** They demonstrate the fallback chain — locale → group default → space default — and they let you show what happens *without* a group: whole-entry locale targeting has **no fallback**, so an untargeted locale gets a blank page. Showing the break, then the group fix, is a better five seconds than describing it.

### Content to localize

| Content | Locales |
|---|---|
| `nav-config` (all labels, announcements, mega-menu) | All 8 |
| Homepage hero + promo slots | All 8 |
| 12 product descriptions | fr-FR, de-DE, ja-JP, ar-AE |
| 4 help articles (full) | fr-FR, de-DE, ja-JP, ar-AE |
| All 9 disclosures | Per jurisdiction |
| Footer | All 8 |

### The two patterns, each with a built example

- **Inline / per-field** → the global announcement bar. One Symbol, one entry, eight languages, no duplication. **This is Al Tayer's exact ask** ("English and Arabic in one component without duplicating the component"). Build this one first. ⚠️ **Never toggle localization *off* on a block — the docs state in bold that it deletes the localized content.**
- **Whole-entry variant** → the `de-DE` homepage, with different hero imagery and a different featured category, not just translated strings. This is the honest case for full variants: *layout and merchandising differ, not just words.*

### RTL

`ar-AE` must actually render right-to-left. `dir="rtl"` on the document, logical CSS properties (`margin-inline-start`, not `margin-left`) throughout the component layer, mirrored icons where directional. An Arabic page rendering LTR is worse than not having one.

---

## 7. A/B tests and the analytics data

This is the section that fixes your biggest gap. See plan §8 for the mechanics; this is the data shape.

### Standing tests

| Test | Variants | Split | Target outcome |
|---|---|---|---|
| **Homepage hero** | A: lifestyle photo · B: product-led with price | 50/50 | **B wins +11.4%**, green significance |
| **PDP promo slot** | A: free shipping · B: bundle + save $40 | 50/50 | **B wins +6.8%**, green |
| **Card CTA** | A: "Apply now" · B: "Check your rate — no impact to your score" | 50/50 | **B wins +19.2%**, green |
| **Pro lead form** | A: 6 fields · B: 3 fields | 50/50 | **B wins +31%**, green |
| **Homepage headline** (running, inconclusive) | A / B / C | 34/33/33 | **No winner yet, gray** |

That last one matters. A demo where every test has a clear winner looks staged. One inconclusive test running alongside the others is what real experimentation looks like, and it gives you a natural place to talk about sample size and significance — which is where you make the case for testing at the *template* level rather than per-page.

### Event volume — target shape

For a "last 30 days" window that still holds up on "last 7":

| Metric | Target |
|---|---|
| Sessions/day | 2,800 – 4,200 (weekday/weekend curve) |
| Homepage impressions/day | ~3,500 |
| PDP impressions/day | ~6,000 across 48 products, **power-law distributed** (top 5 products ≈ 40% of views) |
| Click events/day | ~9,000 |
| Conversions/day | 60 – 110 |
| Conversion rate | 2.1% – 3.4% |
| AOV | $164 (drawn from real catalog prices) |

**Segment skew — this is what makes it look real:**

| Segment | Share | CVR | AOV |
|---|---|---|---|
| Anonymous | 62% | 1.6% | $138 |
| Member | 28% | 3.9% | $171 |
| VIP | 10% | 7.2% | $248 |
| Mobile | 58% of sessions | 1.9% | $121 |
| Desktop | 42% | 3.6% | $198 |

VIP converting 4.5× anonymous is what makes the *targeting* demo and the *A/B* demo reinforce each other — you're not just showing that you can segment, you're showing why it's worth doing.

### Click distribution (for the heatmap)

Uniform sprinkle reads as synthetic instantly. Weight it:

| Element | Share of homepage clicks |
|---|---|
| Hero CTA | 22% |
| Product tile 1–4 | 31% combined, descending |
| Nav — Shop | 14% |
| Nav — other | 9% |
| Promo banner | 8% |
| Footer links | 5% |
| Long tail (everything else) | 11% |

### Generator implementation

> ⛔ **Spike the REST path in Phase 0 before building on it.** The endpoint `POST https://cdn.builder.io/api/v1/track?apiKey=...` with an `events` array is documented **only** inside the Shopify custom-pixel example, and **every documented event there is `type: "conversion"`**. The Gen 2 `track()` *function* accepts `impression | click | conversion | custom`, but the REST payload shape for impressions and clicks is not documented, and **`contentId` / `variationId` appear in no documented payload at all**. On top of that, the A/B docs say *"Builder Content calculates conversions based on impressions… an impression of Builder content is all that's necessary to lead to a trackable conversion"* — so synthetic conversions with no matching impression may never attach to a variation, which is precisely the green-significance beat this data exists to produce.
>
> Post ~20 events into the Sandbox space, wait 30 minutes, confirm they land attributed to the right content and variation. **If they don't, Playwright is the whole generator.**

- **Primary: Playwright.** Real page loads across device / locale / segment, exercising the real SDK end to end. The only path the docs support all the way through — and it **catches instrumentation regressions**, so if someone drops `{...attributes}` from a component the numbers go flat and you learn it before a customer does.
- **Secondary (if the spike passes): direct track REST.** Batched events — far cheaper per event, which is what makes the volumes above affordable.
- **Schedule:** daily, via Vercel Cron or a GitHub Action, on a rolling window. The failure mode to design against is a demo that had great data in March.
- **Seed a 45-day backfill** on first run so there's history the day you start demoing.
- **Watch the bandwidth quota** — *"reading or writing data from our APIs… contribute[s] to your monthly bandwidth quota."* Don't let a Playwright loop run unbounded.

**Before every call:** heatmap range = **last 7 days**. No publishing in the prior 30 minutes (~30 min latency). Don't press Shift.

---

## 8. Campaign calendar — 90 days

Feeds `builder.io/app/scheduler`. Built as a rolling window so it's always populated, with **a scheduled job that shifts everything forward weekly** so campaigns are perpetually "next week."

### The shape (relative to demo day, D)

| Window | Entry | Model | Notes |
|---|---|---|---|
| D−21 → D−7 | Late Summer Clearance | `promo-slot` (global-banner) | **Expired** — shows the calendar's past |
| D−10 → D+4 | Fall Arrivals hero | `homepage` | **Currently live** |
| D−10 → D+4 | Fall Arrivals EU hero | `homepage` (de-DE, fr-FR) | **Starts 9h earlier** — the time-zone beat |
| D−3 → D+11 | Free shipping over $150 | `promo-slot` (global-banner) | Live |
| D+1 | *Winter layering for wet climates* | `article` | Scheduled publish |
| D+2 → D+16 | Nightfall 20° launch badge | `promo-slot` (pdp-upper) | Driven by `product.launchDate` |
| **D+5 → D+19** | **Members Week** | `homepage` | **Overlaps the next row →** |
| **D+12 → D+26** | **Winter Preview** | `homepage` | **← Deliberate conflict** |
| D+7 | *Our 2026 materials report* | `article` | Scheduled |
| D+9 → D+12 | Pro trade pricing push | `landing-page` `/pro/trade-pricing` | `hasProAccount` targeted |
| D+14 → D+21 | Card 0% intro APR | `landing-page` `/card/intro-apr` | **Legal-gated** — sits in Legal Review |
| D+18 → D+32 | UAE National Day | `promo-slot` | `market = ae`, `ar-AE`, RTL |
| D+22 → D+29 | Black Friday teaser | `homepage` | Scheduled, unpublished |
| D+30 → D+33 | Black Friday | `homepage` | The big one |
| D+34 → D+40 | Cyber Week | `homepage` | |
| D+45 | Holiday shipping cutoffs | `article` (help) | Scheduled |

**The D+5/D+12 overlap is the point.** Two homepage campaigns claiming the same window is **Al Tayer's literal written requirement** — *"multi-scheduling… Conflict handling."* Walk through how you'd resolve it: narrow one by targeting, scope one to a `promo-slot` instead of the full homepage, or stagger the end date. Nobody demos this.

The **9-hour EU offset** on the Fall Arrivals hero is the time-zone story from your old script, made visible on a calendar instead of described.

The **Legal-gated Card campaign sitting in Legal Review** while its start date approaches is the governance and scheduling stories intersecting — which is what actually happens at a bank.

---

## 9. Users and roles

Create real users (aliases on your address work: `hunter+copywriter@builder.io`) so role switching is genuine rather than described.

| User | Role | Purpose |
|---|---|---|
| `hunter@builder.io` | Admin | You |
| `+copywriter@` | Copywriter | Can edit text, cannot publish, cannot touch design |
| `+marketer@` | Brand Marketer | Content + layout, token-bound styling, blocked from `/card/**` |
| `+legal@` | Legal Reviewer | **Read-only + can approve.** Lifeplus asked for exactly this. |
| `+editor-fr@` | Regional Editor — FR | `fr-FR` / `fr-CA` only |
| `+dev@` | Developer | Full, including `editCode` |

**Stay signed in as the Copywriter in a second browser profile.** The strongest governance beat is trying to publish and getting **"Request Stage Move"** instead — and that only lands if you actually hit the wall live rather than narrating it.

---

## 10. Workflow and rules

**Workflow: `Fieldnote Content`** — sequential progression on.

`Draft → Content Review → Legal Review → Ready to Publish → Published`

| Stage | Who edits | Who transitions |
|---|---|---|
| Draft | Everyone | Everyone |
| Content Review | Copywriter, Marketer | Marketer, Admin |
| Legal Review | **No one** | Legal Reviewer, Admin |
| Ready to Publish | No one | Marketer, Admin |
| Published | No one | Admin |

"Legal Review: no one can edit" is the detail compliance teams care about — the thing they approved can't change underneath them.

### Rules

```js
// 1. Legal review for anything on the Card surface
{ "data.url": { "$regex": "^/card/" } }

// 2. Legal review for any entry containing a Disclosure component
{ "component.name": "Disclosure" }

// 3. Accessibility gate — heroes must have alt text
{ "component.name": "Hero", "options.heroImageAlt": { "$exists": false } }

// 4. Locale-scoped review — FR content needs the regional editor
//    (Rule scoped via the Locales multi-select, approver = Regional Editor — FR)
```

Rule 2 is the strong one: it's **model-agnostic**. Drop a Disclosure onto *any* page, anywhere, and legal review attaches automatically. That's governance following the content rather than the URL — and it answers the "how do we not rely on people remembering" question that every compliance conversation reaches.

### Webhook → Slack

Workflow webhooks fire `stageMoved`, `requestPublish`, `requestStageMove`. **There is no native Slack integration and webhooks are not retried.** Build a small Vercel function that receives them and posts to a real Slack channel, and have that channel open in a tab. A real message arriving beats the claim you used to make.

---

## 11. Vertical swap sets

For the "our data" adapter (plan §10.3) — pre-built alternates you can load before a call.

| Set | Swaps in | For |
|---|---|---|
| **Fieldnote** (default) | Outdoor retail | Retail, general |
| **Meridian Health** | Provider directory, patient education articles, HIPAA-flavored disclosures | Dubai Health, Octave |
| **Northgate Financial** | Product comparison, rate tables, regulatory disclosures | BlackRock, JPMC, Capital One, Golden Charter |
| **Axiom Software** | Solution pages, docs, pricing, case studies | Camunda, Visme, Staffbase, Connecteam |

Each set is: a product/entity CSV, an article set, a token override JSON, and a logo. Same models, same components, same governance — **only the content and tokens change.** That's the demo within the demo: swapping an entire vertical in minutes is itself the argument for the architecture.

---

## 12. Data hygiene rules

Rules that keep this from rotting into the current state:

1. **No `test`, `xyz`, `asdf`, `Lorem ipsum`, or personal names in any entry, URL or model name.** The current space has `/test`, `/test-test`, `/xyz`, `/sammons-test-page`, `/veronika-sneaker-collection`, a `test-123` model with lorem-ipsum defaults, and a "Veronika - Event Pricing" model.
2. **No duplicates.** Today there are three near-identical sneaker pages.
3. **Scratch work goes in the Sandbox space**, never in the demo space.
4. **Every entry has a real name.** The MCP returned entries with empty `name` fields — those show as blank rows in the content list.
5. **Every image has alt text.** Rule 3 enforces it for heroes; do it everywhere.
6. **No customer names anywhere** — not in entries, not in code comments, not in `.env`. The current repo has a commented-out `#Nestle Ecomm API key`.
7. **`npm run reset` restores everything.** Run it after every demo. Snapshot nightly; reset selectively (plan §10.6).
8. **Imagery licensing:** Pexels for lifestyle and hero content (commercial use, no attribution required, re-hosting allowed). **Owned or generated imagery for anything rendered as a purchasable SKU** — both Pexels and Unsplash prohibit selling unaltered photos on products, and Unsplash additionally *mandates hotlinking*, which conflicts with putting assets in a DAM. Avoid faces, visible logos and recognizable landmarks on anything captioned as a product.
