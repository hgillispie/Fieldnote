# Fieldnote Cloudinary picker — Builder.io custom field-type plugin

Registers a `cloudinaryImage` field type: a "Choose from Cloudinary" button
that opens the Cloudinary Upload Widget inside Builder's Visual Editor, so an
editor can pick from Fieldnote's existing Cloudinary library (or upload a new
asset into it) without leaving Builder. See the large comment block at the
top of `plugin.tsx` for the full "why" — the short version is: Builder's own
Asset Manager stays this app's primary DAM; this plugin is the coexistence
path for a customer with an existing Cloudinary investment.

## Why this is a separate package from the main app

A Builder custom **field-type editor** (`Builder.registerEditor(...)`) is a
different registration surface than a custom **component**
(`register("component", ...)`, used throughout `src/builder-registry.ts`).
Confirmed directly from `@builder.io/react`'s own source: calling
`Builder.registerEditor()` from a normal app — including this repo's Next.js
app, even when it's loaded inside the editor's own live-preview iframe — hits
an explicit guard that logs *"Builder.registerEditor() called in the wrong
environment! You cannot load custom editors from your app, they must be
loaded through the Builder.io app itself."* A field-type editor's `component`
is stripped before the registration message is even sent across frames —
there's no way to hand a live React component reference into Builder's own
hosted editor UI (app.builder.io) from a different origin's app. This is why
Builder's own official plugins (including its Cloudinary plugin) each live in
their own package, independently built and hosted.

## What's real here, and what's a manual step

- `plugin.tsx`'s `CloudinaryImagePicker` component and Upload Widget wiring
  are genuine, working code — not a stub.
- The `fieldnote_unsigned` upload preset it depends on already exists in the
  real, connected Cloudinary account (cloud name `hwteeemq`), created by
  running `npm run setup:cloudinary` from the repo root (see
  `src/lib/cloudinary/ensure-upload-preset.ts`).
- `Hero`'s optional `cloudinaryImage` input is registered for real in
  `src/builder-registry.ts`, with `type: "cloudinaryImage"`.
- **Not done, and outside what any repo's code can do:** building this
  package into a hosted plugin bundle and registering that URL under
  **Builder Space Settings → Plugins** in the Fieldnote space. That's a
  one-time, manual Builder-dashboard admin action — the same category as
  this repo's Validation-command setting (see `AGENTS.md`/`CLAUDE.md`),
  which also has to be set by a human in Builder's UI, not by application
  code. Until that registration happens, Builder's editor shows this field
  with its "unrecognized custom type" fallback instead of the picker above —
  expected, not a bug.

## Building and registering this plugin (for whoever does that admin step)

1. `cd plugins/cloudinary-picker && npm install`.
2. Bundle `plugin.tsx` into a single hosted JS file — Builder's plugin docs
   (`builder.io/c/docs/plugins-creating-custom-types`) walk through their
   recommended local dev/build flow. Any bundler that can produce a single
   browser-runnable file with React resolved works.
3. Host the built file somewhere Builder's editor can fetch it from (a CDN,
   a static host — the same requirement as any other Builder plugin).
4. In the Fieldnote space: **Space Settings → Plugins → Add Plugin**, paste
   the hosted URL.
5. Reload the Visual Editor. The `cloudinaryImage` field type (used by
   Hero's `cloudinaryImage` input) now renders the real picker.
