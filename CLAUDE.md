# Fieldnote Demo Environment — Build Memory

This is a from-scratch rebuild of Builder.io's SE demo environment (brand: **Fieldnote**,
an outdoor/travel gear retailer). It replaces a ~2-year-stale demo (`Shopaholic Platform`)
that is visibly broken and is used on live customer calls. **"Works when clicked" beats
"architecturally elegant."**

This is a multi-session build. Read this file first in any new session, then the plan
docs for detail. Update it whenever a decision is made, a plan assumption is confirmed
or contradicted, or a phase completes.

## Source of truth

Five planning docs in `docs/` (not `docs/plan/` — that path doesn't exist in this repo):

| Doc | Contents |
|---|---|
| `01-demo-environment-plan.md` | The comprehensive plan. §1 = mistakes in the old build, don't repeat them. §7–10 = architecture. §12 = things not to say on a call. |
| `02-seed-data-spec.md` | Exact content to seed: products, articles, stores, disclosures, targeting segments, locales, A/B tests, campaign calendar. |
| `03-build-checklist.md` | The phase-by-phase checklist. Working doc — check items off as completed. |
| `05-services-and-credentials.md` | Exact signup steps + credential shapes for every third-party service. Hunter owns these signups. |
| `07-builder-code-vs-claude-code.md` | The tooling boundary. Claude Code owns foundation + infra + 3 exemplar components + handoff artifacts. Builder Code owns the other 9 components + demo-time iteration. |

## This build is split across two tools

**Claude Code (this session) owns:** foundation (Next.js app shell, token pipeline),
3 exemplar components (`Hero`, `Section`, `ProductCard`), handoff artifacts (`AGENTS.md`,
`.builder/rules/*.mdc`, validation scripts), content models + seed data via the CMS MCP,
the analytics event generator, CI, the snapshot/reset pipeline. Everything that needs a
shell, a scheduler, or GitHub Actions — Builder Code has none of those.

**Builder Code owns:** the other 9 components (pattern-matched off the 3 exemplars),
page assembly/surfaces, demo-time iteration, the Preview-for-Publish and scaffold demo
beats. Don't duplicate this work here.

**Build order is content-first**: models + a content skeleton (Phase 3a) before the app
scaffold (Phase 1), because Builder Code's sub-agent scaffolds *against* existing content.
This inverts doc 01 §7's original app-first framing — doc 07 corrects it and 03 reflects
the correction.

## Confirmed facts (don't re-derive these)

- **Repo:** this repo (`hgillispie/Fieldnote`, branch `claude/sweet-ritchie-2b658u`) *is*
  the demo repo. **Deviation from 03:** skip creating a new `fieldnote-demo` repo — we're
  already in it.
- **Builder space:** MCP `who_am_i` confirms space **`Fieldnote`**, id/public key
  `3a593c5220b04d469e25606e2987ebc0`. This is the correct space. **`Shopaholic Platform`
  (id `a87584e551b6472fa0f0a2eb10f2c0ff`) is off-limits, untouched, archive-only — never
  write to it.**
- **Space state as of 2026-09-22:** brand new / empty. Only the default `page` model
  exists (auto-created by Builder, fields: `blocks`, `title`, `description`). Zero pages,
  zero registered components, zero design tokens. Nothing to protect yet, but see the
  environment note below before creating models.
- **Per Hunter's instruction:** skip creating a separate `Fieldnote Sandbox` space —
  build directly in `Fieldnote`. (`Fieldnote Scaffold`, for the sub-agent-setup demo
  beat, is a later/optional item, not Phase 0.)
- **Reconfirmed 2026-09-22 (session 2):** the Builder.io Publish MCP connector is
  connected and `who_am_i` still resolves to space `Fieldnote`
  (`3a593c5220b04d469e25606e2987ebc0`). This session runs on Hunter's own
  machine, not the cloud sandbox the first session used — see "Things learned"
  below for what that changes.
- **This sandbox's network is allowlisted**, not general internet. Confirmed reachable:
  `registry.npmjs.org` (and other package registries). Confirmed **blocked** by org proxy
  policy (`connect_rejected`): `builder.io`, `cdn.builder.io`, `dummyjson.com`. The
  Builder MCP tools (`mcp__Builder_io_Publish__*`) work fine — they go through a
  different, MCP-mediated path, not raw egress. **Implication:** anything requiring raw
  HTTP calls to Builder's REST API (the track pixel endpoint) or to third-party hosts
  (DummyJSON) cannot be executed from this sandbox — needs to run somewhere with normal
  network access. Scripts can still be written here.

## Resolved decisions (Hunter, 2026-09-22)

1. **Environment targeting:** build directly in `main`. Dev/staging environments are a
   demo feature (to show customers multi-environment support exists), not a real
   workflow requirement for this build. No environment gating needed for MCP writes.
2. **Entitlements:** already Enterprise / all features unlocked. Proceed assuming A/B
   testing, Insights, custom targeting, governance, environments, impressions,
   localization and scheduler are all available.

## GitHub push — resolved (2026-09-22, session 2)

Claude's GitHub App still isn't installed/authorized for `hgillispie/Fieldnote`
(the original 403), but Hunter worked around it with a fine-grained PAT instead:
`GITHUB_TOKEN` in `.env.local` (gitignored, never committed), used via `gh auth
login --with-token` + `gh auth setup-git` to wire git's own credential helper —
plain `git push` works after that, no per-push token handling needed.

Getting the scope right took three tokens: the first was denied entirely
(`Permission ... denied` — fine-grained PATs need the repo explicitly selected
with the right permissions, unlike classic PATs' account-wide scopes), the
second had repo write but was rejected specifically for touching
`.github/workflows/ci.yml` (GitHub requires the separate **Workflows**
permission to create/modify workflow files via a PAT — **Contents: Read and
write** alone isn't enough), the third had both and pushed clean. If push ever
403s again: check the token's fine-grained permissions before assuming it's the
GitHub App issue again — they produce different error text (compare "Permission
... denied" / "without `workflow` scope" against a plain 403 with no detail).

## Stack decisions and why

| Decision | Why |
|---|---|
| Next.js 15 App Router, React 19, TS strict, Tailwind 4 | Current, matches doc 01 §7.2 target stack |
| `@builder.io/sdk-react` ^5.2 (Gen 2), **not** `sdk-react-nextjs` | The latter is 0.x/beta and its own README says no support for interactive Builder features (state, actions, dynamic bindings). Gen 1 (`@builder.io/react`) is NOT deprecated — docs still call it "Recommended" — so Gen 2 here is *our* choice (modern App Router patterns), not "Gen1 is going away." Never say Gen 1 is dying. |
| Registry + `<Content>` render are client components | RSCs cannot be registered as custom components **on this SDK** (confirmed: Gen 2 `<Content>` is exported from `content-variants`, a client-rendered component). This is an SDK tradeoff, not a Builder limitation — `sdk-react-nextjs` supports RSC registration via `isRSC: true`. Don't tell a prospect "Builder can't do RSC." |
| ISR with `revalidate`, no `force-dynamic` | Old build had `force-dynamic` everywhere — zero caching, weak crawlability story. `staleCacheSeconds` default is one day; 3600s is the *minimum*, not the default — leave it high. |
| One `--fn-*` CSS custom property namespace, consumed by `globals.css` + `tailwind.config.ts` + `editor.settings.designTokens` | The single highest-leverage fix vs. the old build (30 tokens pointing at undefined variables). Must be verified end-to-end: change a var in `globals.css`, confirm the app, a Tailwind class, and the Builder token picker all move. |
| Radix primitives + thin in-house layer, no shadcn copy-paste | Old build's shadcn copy included unmodified "Pedro Duarte" example content behind the cart/account/mobile nav — the first thing a prospect clicks. |
| Fonts via `next/font` | Old build declared Poppins in CSS and never loaded it. |
| Vercel + ISR, Vercel Pro (Hunter's signup) | Hobby is non-commercial-only by Vercel's own fair-use terms, and its cron jitters ±59 min — unusable for a scheduled analytics generator. |

## Non-negotiables (the old build got every one of these wrong)

- **Every** registered component spreads `{...attributes}` onto its root element — carries `builder-id`, the #1 documented cause of empty heatmaps. No exceptions.
- One token namespace (`--fn-*`), verified end-to-end across app / Tailwind / editor picker.
- **No interpolated Tailwind classes** (`text-${alignment}` never compiles) — static lookup maps only.
- **No `force-dynamic`** anywhere — ISR with `revalidate`.
- Insert menus registered **unconditionally** — never gated on `editingModel === 'homepage'`.
- **DOMPurify** on every `dangerouslySetInnerHTML`.
- `.gitignore` covers `.env` (done — see repo root).
- Registry and `<Content>` are client components (`"use client"`).
- Fonts loaded via `next/font`, never declared-but-unloaded.
- **Nothing rendered is hollow** — if a cart icon renders, it opens a working cart. No Pedro-Duarte-style placeholder behind any visible affordance.
- The 3 exemplar components (`Hero`, `Section`, `ProductCard`) are reference implementations Builder Code pattern-matches off of — sloppiness there propagates ninefold.
- `.builder/rules/*.mdc`: each ≤200 lines / 6,000 chars, combined always-on ≤500 lines, max 3–5 files with `alwaysApply: true` ("rule fatigue" past that).
- `npm run typecheck` and `npm run test` must exist and pass — Builder Code runs them as its Validation command after every agent task.
- When creating/modifying models over the CMS MCP: target a lower environment, never `main` — see open question #1 above.

## Phase status

**Phase 0, Phase 1, Phase 2, and Phase 3a are done.
Next up: Phase 3b (bulk content seed — 48 products, 26 articles, etc.) or
whatever Hunter directs. This session (2026-09-22, second session) ran on
Hunter's own machine with real network access, unlike the first session's
cloud sandbox — see the verification note in Phase 1 below.**

### Phase 1 — Foundation — core done (2026-09-22)

Scaffolded with `create-next-app` (into a temp dir, then moved in — `create-next-app`
refuses an uppercase-letter directory name like `Fieldnote`). Got **Next.js 16.3.5**
(the plan explicitly said "16 if stable when you start"), React 19.2.8, Tailwind 4,
TypeScript strict, ESLint — all current, no deviation.

- `src/app/globals.css` — every `--fn-*` token from seed spec §0 defined under `:root`,
  exposed to Tailwind via v4's `@theme inline` block (`--color-primary: var(--fn-color-primary)`
  etc. → `bg-primary`, `text-primary`, ... utilities). **Tailwind 4 uses CSS-first config,
  not `tailwind.config.ts`** — see "Things learned" below, this refines the plan's literal
  wording without changing the outcome.
  Spacing has no override: the seed spec's scale (4/8/12/16/24/32/48/64px) already equals
  Tailwind's default rem scale at steps 1/2/3/4/6/8/12/16 — `p-4` already is 16px.
- `src/app/layout.tsx` — fonts loaded via `next/font/google` (`Instrument_Sans` →
  `--font-display`, `Inter` → `--font-body`), and `globals.css`'s `--fn-font-*` tokens
  reference those generated vars directly — so "one token namespace" and "fonts actually
  load" are the same piece of wiring, not two. (The old build's mistake was the reverse:
  `font-family: Poppins` declared in CSS with no `next/font`/`@font-face` ever loading it.)
- `src/lib/builder-config.ts` — the one place `NEXT_PUBLIC_BUILDER_API_KEY` is read.
  Gen 2 takes `apiKey` per call rather than `builder.init()`; centralizing it here is
  what stands in for "call init once" (old build called Gen 1's `init()` 13 times).
- `src/builder-registry.ts` — the one client-side registry file (`"use client"`).
  `editor.settings.designTokens` registered now (colors/fontFamily/fontSize, all
  `var(--fn-*, fallback)`); component registration + unconditional insert menus land in
  Phase 2 with the 3 exemplars.
- `src/components/RenderBuilderContent.tsx` — the one place `<Content>` renders
  (client boundary), imports the registry so registration always runs where content does.
- `src/app/page.tsx` — `fetchOneEntry({model: "homepage", ...})`, `export const
  revalidate = 60` (ISR, **no `force-dynamic`**), and the fetch is wrapped in
  `.catch(() => null)` — fails soft into an empty render rather than a crashed page,
  per doc 01 §10.2. This isn't decorative: see the verification note below.
- `npm run typecheck` (`tsc --noEmit`) and `npm run test` (Vitest, one real smoke test)
  both **exist and pass** — the Builder Code validation-command non-negotiable. `npm run
  lint` and `npm run build` also pass clean.
- `.env.local` / `.env.example` carry `NEXT_PUBLIC_BUILDER_API_KEY` — safe to commit,
  it's the *public* key by design (not the private write key).
- `src/app/demo-switcher/page.tsx` + `actions.ts`, `src/lib/demo-targeting.ts` —
  6 segment buttons from seed spec §5 (VIP, Lapsed, Pro account, Paid social,
  UAE mobile, Anonymous), each a `<form action={setDemoSegment}>` (Server
  Action) writing a `fn_targeting` cookie and redirecting to `/`. Verified live
  in a browser: clicking VIP sets the cookie, redirecting back to
  `/demo-switcher` shows it as "Active." **Deliberately not wired into the
  homepage's fetch yet** — `cookies()` forces a route into dynamic rendering,
  which would knock `/` off ISR as a side effect of this page rather than a
  decision Phase 6 ("pass `userAttributes` on every fetch") makes on purpose.
  `npm run build`'s route output confirms the split is real: `/` stays `○
  (Static)`, `/demo-switcher` is `ƒ (Dynamic)` — only the route that reads
  cookies is dynamic.
- `.github/workflows/ci.yml` — typecheck + lint + test + build on every PR and
  push to `main`, Node 22 (matches this machine).

**✅ Verified 2026-09-22 (session 2, real network): the live Builder fetch path
works end-to-end.** `npm run dev` / `npm run build` on Hunter's machine show **no**
fetch error at all (the sandbox's `SyntaxError: Unexpected token 'H', "Host not
i"...` is gone) — `fetchOneEntry` successfully reaches `cdn.builder.io`. The
homepage still rendered blank on first load, which looked like a regression but
wasn't: the seeded `homepage` entry is `published: "draft"` (never published)
*and* has `blocks: []` (an intentional Phase 3a skeleton) — `fetchOneEntry`
correctly returns `null` for unpublished content outside editor-preview mode, so
`content` being `null` was the fetch working exactly as designed, not a bug.
Confirmed by instrumenting the fetch temporarily and by checking the entry
directly via `search_builder_content` (`includeDrafts: true`).

**Confirmed the full render loop separately**, since blocks:[] meant the real
homepage entry couldn't prove components actually render: temporarily wrote a
JSX block tree via `write_content_source` (Hero inside Section, plus a
ProductCard) into the draft homepage entry, temporarily added `includeUnpublished:
true` to the fetch (a real, documented `fetchOneEntry` option — diagnostic use
only, reverted immediately after), and loaded `/` in a browser. All three
Phase 2 components rendered pixel-correct with real Tailwind/token styling.
Both the test content and the `includeUnpublished` flag were reverted afterward
— the homepage entry is back to `blocks: []`/draft, `page.tsx` is back to its
original fetch with no diagnostic-only options left in.

**Hunter's call (asked directly, 2026-09-22):** leave all 24 Phase 3a skeleton
entries in draft rather than publishing them now. Rationale: `blocks: []` means
nothing would look different either way, and publishing becomes meaningful once
Phase 3b gives entries real content — publishing now would just be redone then.

**Discrepancy found, not yet resolved:** searching for existing `product` model
entries (`search_builder_content`, `search_content_ids`, `browse_model_content`,
various search terms, `includeDrafts: true`) turned up **zero** — despite Phase
3a's note above claiming 2–3 skeleton entries per model including `product`.
Either the `product` model never actually got its skeleton entries, or they
exist under names/terms that didn't match anything searched. Worth a direct
check before Phase 3b assumes it's starting from skeleton entries rather than
zero.

**Not done yet in Phase 1:** none — `/demo-switcher` and CI both done, see below.

### Phase 2a — Three exemplar components — done (2026-09-22, session 2)

`Hero`, `Section`, `ProductCard` in `src/components/builder/`, registered in
`src/builder-registry.ts`. **Live-render-verified** in a browser via a
temporary content block (see the Phase 1 verification note above), not just
typechecked — all three rendered pixel-correct with real token styling.

- **`Hero`** — `variant`: `image` / `split` / `text`, static lookup maps for
  every variant-dependent class (no interpolation). `heroImageAlt` is
  `required: true`, hidden via `showIf` only when `variant === "text"` — named
  exactly that because seed spec §10 rule 3 checks `options.heroImageAlt` for
  existence on `Hero` blocks.
- **`Section`** — `width`/`padding`/`background`, `canHaveChildren: true`,
  receives `children` directly (Gen 2 doesn't need Gen 1's `withChildren()`
  HOC — confirmed from the SDK's own built-in `Section` block's prop types).
  **Deliberately not scoped with `models: [...]`** and doesn't restrict its
  own children beyond one guardrail: `childRequirements` blocking a `Section`
  from nesting inside another `Section` (breaks both components' width/padding
  assumptions). It's the general-purpose layout wrapper, so over-restricting
  it would repeat the old build's availability-gating mistake in a new form.
- **`ProductCard`** — `source`: `product` (a `reference` input scoped to the
  `product` model) or `static` (default). **Defaulted to `static`, not
  `product`,** specifically because the `product` model currently has zero
  reachable entries (see the discrepancy note above) — defaulting to `product`
  would make a freshly-dragged-in card depend on data that doesn't exist yet.
  Revisit this default once Phase 3b seeds the real catalog.
- **Deliberately skipped** on all three: `requiredPermissions` (styling access
  is already role-gated platform-wide; these are general-purpose content
  components, not sensitive ones) and DOMPurify (none of the three render
  `dangerouslySetInnerHTML` — the first component that does, e.g. `RichText`
  or the `article` body, needs to add `isomorphic-dompurify`).

**⚠️ Major undocumented-behavior finding: `register("component", info)` alone
does not make a component render.** Read from the SDK's compiled source
(`node_modules/@builder.io/sdk-react/lib/browser/server-entry-*.js`): the
global `register()` call only pushes into an in-memory store that's read to
`postMessage` the Visual Editor iframe — i.e. it makes the component appear in
the insert menu and options panel. It is **never read by `<Content>`'s own
render path.** `<Content>` resolves which components to render from an
explicit `customComponents` prop instead (confirmed from
`ContentVariantsPrps`'s type: `customComponents?: RegisteredComponent[]`).
Skip that prop and every registered component fails identically: fully
editable in the Visual Editor, renders as nothing at runtime, with only a
console warning (`Could not find a registered component named "X"...`) to
explain why — no error, no crash. This is **the** thing to know before adding
any of the other 9 components. Fixed by restructuring
`src/builder-registry.ts` around one `CUSTOM_COMPONENTS: RegisteredComponent[]`
array that's both looped over for `register()` calls *and* exported for
`RenderBuilderContent.tsx` to pass as `<Content customComponents={...}>`.
Documented prominently in `AGENTS.md` and `.builder/rules/builder-registry.mdc`
so Builder Code doesn't repeat this silently when it adds the remaining 9.

### Phase 2b — Handoff artifacts — done (2026-09-22, session 2)

- **`AGENTS.md`** (172 lines, under the 500-line budget) — rewritten around
  the existing Next.js-generated `BEGIN/END:nextjs-agent-rules` marker block
  (preserved verbatim, not replaced). Covers the stack, the
  `customComponents` gotcha above, the registry pattern, the 3 exemplars'
  design decisions, the 14-model table, tokens, and the validation command.
- **`.builder/rules/*.mdc`** — 4 files: `components.mdc` (102 lines/4,323
  chars), `tokens.mdc` (65/3,251), `builder-registry.mdc` (90/3,993) — all
  `alwaysApply: true`, combined 257 lines, well under the 500-line/3–5-file
  budget — plus `content-models.mdc` (60/3,888, `alwaysApply: false`, the
  14-model reference). Each individually well under 200 lines/6,000 chars.
- **Validation command** — `npm run typecheck && npm run test` exist and pass
  (confirmed again this session). Setting this as Builder Code's actual
  Validation command is a **Project Settings → Setup** UI action — Claude
  Code has no access to that UI, so this is still **Hunter's action item**,
  same as "turn off Enforce default command restrictions" and "connect
  Builder Code to the repo" (doc 07 §4/§2).

### Phase 3a — done (2026-09-22)

All **14 models** created directly in Fieldnote's `main` (page, landing-page, homepage,
nav, footer, promo-slot, pdp-section, article, product, author, help-topic, store,
disclosure, nav-config), each with an `examplePageUrl` pointing at
`http://localhost:3000/...`, verified via `list_builder_models`. **24 draft skeleton
entries** seeded across them (2–3 per model, 1 for singletons — homepage/nav/footer/
nav-config), including working cross-references (`article.author` → `author`,
`article.topic` → `help-topic`, `pdp-section.previewProduct` → `product`). Full 48-product
/ 26-article bulk catalog is Phase 3b, not done yet.

**Field-type mapping that worked** (useful for any future model changes): `text`,
`longText`, `richText` (HTML body, plan doc calls this "html"), `number`, `boolean`,
`date`, `file`, `color`, `enum` (with an `enum` array), `list` (with `subFields` for the
item shape), `object` (with `subFields`), `reference` (with `model: "<target-model-name>"`).
Fields take a `localized: true` flag. Reference field *data* on an entry is
`{"@type": "@builder.io/core:Reference", "id": "<content-id>", "model": "<model-name>"}`.
**Note:** Builder stores `uiBlocks` entry data as a `blocksString` JSON string internally
(confirmed from create responses when passing `blocks: []`) — the SDK's `fetchOneEntry`/
`<Content>` handle this transparently, the Next.js app never touches `blocksString` directly.

### Phase 0 — done

Phase 0 checklist items and status:

| Item | Status |
|---|---|
| Confirm plan entitlements | **Blocked on Hunter** (open question #2) |
| Spike: Track REST endpoint (`/api/v1/track`) | **Blocked in this sandbox** — `cdn.builder.io` isn't reachable from this environment's network policy. Needs to run somewhere with normal egress. Script not yet written. |
| Spike: Gen 2 `<BuilderContent>` equivalent | **Resolved by SDK source inspection** (no live network needed). See findings below. |
| Spike: Gen 2 `sessionId` | **Resolved — negative.** See findings below. Fallback applies: drop the cross-domain checkout beat. |
| Spike: Role-conditional tokens | **Resolved — negative.** See findings below. Fallback applies: two-dial guardrail demo (role permission × space-wide token strictness), not a live three-way switch. |
| Spike: Client-rendered impressions | **Blocked in this sandbox** — same network restriction; needs a real browser with real egress hitting a real rendered page. |
| `.gitignore` covers `.env` | Done |
| DummyJSON snapshot committed | **Blocked in this sandbox** — `dummyjson.com` unreachable. Needs Hunter to fetch `GET https://dummyjson.com/products?limit=0` and drop the JSON in the repo (or run from an environment with open egress). |
| Space/environments/repo/users setup | Space exists and is confirmed correct. Environments: see open question #1. New repo: not needed (see Confirmed facts). Demo users (`+copywriter@` etc.): no MCP tool exposes user invites — likely a Builder UI action for Hunter. |

### Spike findings (from `@builder.io/sdk-react@5.2.12` package inspection — types + public export barrel, no live network required)

- **`<BuilderContent>` equivalent:** Gen 2's public `<Content>` component (exported from
  `components/content-variants/index`) is architecturally *built as* "content-variants" —
  A/B variation resolution (`isSsrAbTest`, `testVariationId` on the `BuilderContent` type)
  and live in-editor updates (`EnableEditor` + `BuilderContextInterface` signal) are wired
  directly into `<Content>` itself, not bolted on via a separate wrapper. There is no
  component literally named/shaped like Gen 1's `<BuilderContent>`, but the job it did —
  A/B on data models, live custom-field updates — appears to be handled natively by
  `<Content>` in Gen 2. **This is stronger than the plan's fallback assumption.**
  Treat as high-confidence, not fully proven — one live end-to-end check (render a
  data-model entry with `variations` through `<Content>`, confirm variant swap + live
  edit) should happen once Phase 1's app shell exists, before fully retiring the
  page/section-only fallback.
- **`sessionId`:** `getSessionId`/`createSessionId`/`setSessionId` exist internally
  (`helpers/sessionId.d.ts`, used by tracking/AB internals) but are **not** re-exported
  from the package's public barrel (`server-index.d.ts` / `blocks-exports.d.ts`) — the
  public export list is curated and excludes them. Confirms the plan's caution: **no
  public, documented Gen 2 way to read `sessionId`.** Apply the fallback — drop the
  cross-domain checkout / `overrideSessionId` beat.
- **Role-conditional tokens:** zero occurrences of "role" anywhere in the SDK's public
  type surface. `register(type: string, info: any): void` takes no editor-context or
  role parameter of any kind. Confirms: `register()` cannot be made role-aware. Apply
  the fallback — the two-dial guardrail demo (custom role without `editDesigns` ×
  space-wide `styleStrictMode`/`allowOverridingTokens`), not a live three-way switch.

## Things learned that contradict or refine the plan docs

- **`register("component", info)` doesn't make `<Content>` render it —
  `customComponents` does.** Full finding in Phase 2a above. This isn't in any
  plan doc because none of them anticipated it; it's a genuine SDK-source-level
  discovery from this session, and it's the single most load-bearing thing in
  `AGENTS.md` for whoever builds the remaining 9 components.
- **This session runs with real network access; the first session's sandbox
  didn't.** Everything the first session marked "blocked in this sandbox" due
  to network policy (Builder REST endpoints, DummyJSON, client-rendered
  impressions) is now technically reachable from Hunter's machine — but this
  session's scope was Phase 1 completion + Phase 2 only, so none of those
  Phase 0/7 spikes were re-attempted here. They're unblocked, not done.
- **Tailwind 4 uses CSS-first config — there is no `tailwind.config.ts`.** The plan
  (doc 01 §7.5) describes the token pipeline as `globals.css` ↔ `tailwind.config.ts` ↔
  `editor.settings`. Tailwind v4's actual mechanism is a `@theme inline { }` block
  directly in `globals.css` that maps `--color-primary: var(--fn-color-primary)` etc.
  straight into Tailwind utility classes — no separate JS/TS config file is needed or
  idiomatic. Outcome is identical (one namespace, three consumers, verified
  end-to-end) — this is a mechanism update, not a plan deviation.
- `create-next-app` refuses a project name with capital letters, so it can't scaffold
  directly into a directory called `Fieldnote` — scaffold into a temp dir and move the
  files in, then fix `package.json`'s `name` field.
- Docs live at `docs/*.md`, not `docs/plan/*.md` as referenced in the kickoff prompt.
- The connected space is named exactly **`Fieldnote`**, not "Fieldnote Web."
- This repo already exists and is the demo repo — no new repo needed.
- Raw HTTPS egress from this Claude Code sandbox is allowlisted to package registries
  and Anthropic infra only; it does **not** include `builder.io`/`cdn.builder.io` or
  arbitrary third-party hosts like `dummyjson.com`. Any task assuming direct `curl`/fetch
  access to those needs to run outside this sandbox, or the org would need to allowlist
  them. The Builder CMS MCP tools are unaffected (different transport).
