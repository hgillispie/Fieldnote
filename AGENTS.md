<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Fieldnote — agent handoff

Fieldnote is a fictional outdoor/travel gear retailer — this is a Builder.io demo
environment, not a real product. Four content surfaces share one app, one design
system and one component library: retail (`/`), help center (`/help`), B2B/trade
(`/pro`), and a regulated financial product page (`/card`).

This file is the handoff from the foundation build (Next.js app shell, token
pipeline, 3 exemplar components) to whoever builds the remaining 9 components and
iterates on this repo day to day. Read it before adding or changing a component.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4 (CSS-first config
  — there is no `tailwind.config.ts`; tokens are wired in `src/app/globals.css`'s
  `@theme inline` block).
- `@builder.io/sdk-react` ^5.2 (Gen 2) — not `sdk-react-nextjs` (0.x beta, no
  interactive-feature support). Gen 1 `@builder.io/react` is not deprecated; Gen 2
  here is a deliberate choice for modern App Router patterns, not "Gen 1 is dying."
- ISR everywhere (`export const revalidate = <seconds>`), never `force-dynamic`.
  Reading `cookies()`/`headers()` in a route forces it dynamic as a side effect —
  know that before adding either to a page that currently has a `revalidate` export
  (see `src/lib/demo-targeting.ts` for how `/demo-switcher` was deliberately kept
  separate from the homepage fetch for exactly this reason).
- Fonts via `next/font` (`src/app/layout.tsx`), never declared-but-unloaded CSS.

## The component registration gotcha — read this before adding any component

`register("component", info)` (from `src/builder-registry.ts`) is **not enough to
render**. It only posts a message to the Visual Editor iframe so the component
shows up in the insert menu and options panel — confirmed by reading the SDK's
compiled source: the in-memory store that call writes to is never read by
`<Content>`'s own render path. If you only call `register()`, the component
appears in the editor, can be dragged in, options can be filled in — and then
renders as nothing, with a console warning: `Could not find a registered
component named "X". If you registered it, is the file that registered it
imported by the file that needs to render it?` No error, no crash — just a blank
space where the component should be. Easy to ship without noticing.

**The fix, already wired up:** every component is added to the
`CUSTOM_COMPONENTS` array in `src/builder-registry.ts`, which is both (a) looped
over to call `register("component", info)` for each entry, and (b) exported and
passed to `<Content customComponents={CUSTOM_COMPONENTS}>` in
`src/components/RenderBuilderContent.tsx`. **Add every new component to that same
array.** Don't call `register("component", ...)` on its own anywhere else.

## Component registry pattern

Single client-side file: `src/builder-registry.ts` (`"use client"`). All
`register()` calls run unconditionally at module scope — never gate any of them
on `builder.editingModel` or any other condition. Gating the old build's insert
menus on `editingModel === "homepage"` is exactly what hid 9 components on every
other model; there must be no repeat of that pattern here, in any form.

Per-component non-negotiables (see `.builder/rules/components.mdc` for the full
list):
- Spread `{...attributes}` onto the component's root DOM element. Pair with
  `noWrap: true` in the registration so Builder doesn't also add its own wrapper
  div around it — one element, one `{...attributes}` spread, not two nested ones.
- No interpolated Tailwind classes (`` `text-${align}` `` never compiles — Tailwind
  needs the literal class name in source). Use a `Record<Variant, string>` lookup
  map instead, and only combine already-fully-resolved strings from such maps.
- A real thumbnail (`image` on the registration — an inline SVG data URI is fine
  and avoids any external-host dependency) and sensible non-lorem defaults, so a
  freshly-dragged-in component looks like something, not an empty state.
- `dangerouslySetInnerHTML` must go through DOMPurify. None of the 3 exemplars
  render raw HTML, so none of them pull in the dependency — the first component
  that does (`RichText`, article bodies) needs to add it.
- Don't reach for `models: [...]` scoping or `requiredPermissions: ['editDesigns']`
  by default. `Hero`, `Section` and `ProductCard` are deliberately unscoped
  (available on every model) because they're used across `homepage`, `article`,
  `pdp-section` and page models alike — scoping components to `['page',
  'landing-page']` is the kind of availability gate that hides a component from a
  context it's actually needed in. Reach for `models`/`requiredPermissions` only
  for a component that is genuinely narrow-purpose (e.g. a future `Disclosure`
  component that only makes sense on Card-surface content) — that's a
  per-component judgment call, not a default.

## The 3 exemplar components

Reference implementations in `src/components/builder/`. Pattern-match off these
for the rest — they're written to the standard above, deliberately, so copying
their shape (not just their existence) is the point.

- **`Hero.tsx`** — `variant`: `image` / `split` / `text`. `heroImageAlt` is
  `required: true` and hidden via `showIf` only on the `text` variant — it's
  named exactly `heroImageAlt` because a content-governance rule checks
  `options.heroImageAlt` for existence on any `Hero` block.
- **`Section.tsx`** — `width` / `padding` / `background`, all token-bound,
  `canHaveChildren: true`. Its one guardrail is `childRequirements` blocking a
  `Section` from being dropped inside another `Section` (breaks both components'
  width/padding/background assumptions) — it does not otherwise restrict
  children, since it's the general-purpose layout wrapper for everything else.
- **`ProductCard.tsx`** — `source`: `product` (a `reference` input to the
  `product` model) or `static` (default; inline fields). `static` is the default
  specifically because the `product` model has no entries yet as of this
  writing — flip the default once Phase 3b's bulk catalog exists. Every
  data-bound component needs this shape: a real fallback, not a blank render
  when the reference doesn't resolve.

## Content models

14 models, all in the `Fieldnote` space's `main` environment (this build skips
the lower-environment MCP-write workflow other Builder docs describe — see
`CLAUDE.md`). Full field-level schema: `docs/02-seed-data-spec.md` and
`docs/01-demo-environment-plan.md` §6. Query them with `get_model_schema` /
`browse_model_content` over the CMS MCP rather than trusting this table to stay
exact as fields evolve.

| Model | Kind | Purpose |
|---|---|---|
| `page` | page | Generic catch-all page |
| `landing-page` | page | Campaign pages, required end date |
| `homepage` | component (section) | Mounted at `/` |
| `nav` | component (section) | Global header, Symbol-driven |
| `footer` | component (section) | Global footer — Builder-driven, not hardcoded |
| `promo-slot` | component (section) | Named slots: `pdp-upper`, `plp-tile`, `cart-upsell`, `global-banner` |
| `pdp-section` | component (section) | Below-the-fold PDP content, `previewProduct` ref |
| `article` | component (section) | Structured fields **and** `blocks` — help/blog/pro via `surface` enum |
| `product` | data | First-party catalog: `sku`, `name`, `price`, `images[]`, `category`, `description` (localized), etc. |
| `author` | data | Bylines, referenced from `article.author` |
| `help-topic` | data | KB taxonomy, referenced from `article.topic` |
| `store` | data | Retail locations |
| `disclosure` | data | Regulated legal text, gates Legal Review |
| `nav-config` | data | Nav labels + mega-menu, fully localized |

Notes that aren't obvious from the schema alone:
- A `data` model cannot hold a `uiBlocks` field — that's why `article` is a
  `component` (section) model with structured fields *and* `blocks`, not a data
  model.
- Reference field data on an entry is
  `{"@type": "@builder.io/core:Reference", "id": "<content-id>", "model":
  "<model-name>"}`. List queries should pass `omit: "data.blocks"`; detail
  queries need `includeRefs: true` to resolve references.
- Localized fields come back as `{"@type": "@builder.io/core:LocalizedValue",
  "Default": "...", "fr-FR": "..."}` unless you pass `locale` on the fetch —
  omit it and a localized field renders as `[object Object]`.

## Design tokens

One namespace, `--fn-*`, defined in `src/app/globals.css`, exposed to Tailwind
via v4's `@theme inline` block (`--color-primary: var(--fn-color-primary)` →
`bg-primary`, `text-primary`, ...), and registered in `editor.settings` in
`src/builder-registry.ts` as `var(--fn-*, fallback)`. Never use a raw hex value
or an undefined CSS variable in a component — every color, font and radius a
component uses should resolve to one of these three layers moving together.
Full token list: `.builder/rules/tokens.mdc`.

## Validation

`npm run typecheck && npm run test` must exist and pass — both do. Set this as
Builder Code's **Validation command** (Project Settings → Setup) if it isn't
already; that's a UI setting this file can't configure for you. `npm run lint`
and `npm run build` also exist and pass; CI (`.github/workflows/ci.yml`) runs
all four on every PR.

## Further reading

`docs/01-demo-environment-plan.md` (architecture, §7–10), `docs/02-seed-data-spec.md`
(exact seed content), `docs/03-build-checklist.md` (phase-by-phase status),
`docs/07-builder-code-vs-claude-code.md` (the tooling boundary this handoff
exists for), `CLAUDE.md` (running build log — read this first in any new session).
