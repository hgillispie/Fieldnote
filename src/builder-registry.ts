"use client";

/**
 * The single Builder component + editor-settings registry for this app.
 * Client-only: `@builder.io/sdk-react` cannot register React Server
 * Components (SDK constraint, not a Builder one - see CLAUDE.md).
 *
 * Imported once from RenderBuilderContent so registration runs wherever
 * Builder content is rendered. All `register()` calls below run
 * unconditionally at module scope - never gated on `builder.editingModel`,
 * which is what hid 9 components in the old build. New components Builder
 * Code adds get registered the same way, in this same file.
 *
 * ⚠️ `register("component", info)` alone is NOT enough to render - it only
 * posts a message to the Visual Editor iframe so the component shows up in
 * the insert menu and options panel (confirmed from the SDK's compiled
 * source: the registered-component store it writes to is never read by
 * `<Content>`'s own render path). `<Content>` resolves components to render
 * from an explicit `customComponents` prop instead. So every component here
 * is registered *and* collected into `CUSTOM_COMPONENTS`, which
 * RenderBuilderContent.tsx passes to `<Content customComponents={...}>`.
 * Skip either half and the component silently no-ops - no error, just a
 * console warning ("Could not find a registered component named X") and a
 * blank space where it should render.
 *
 * ENTERPRISE PATTERN: COMPONENT REGISTRATION
 *
 * Every input schema below is deliberately shaped, not just "whatever field
 * types happened to work":
 *   - `enum` inputs (rendered as a dropdown via `type: "text"` + an `enum`
 *     array - there is no separate `"enum"` input type on this SDK) are used
 *     everywhere a component has a small, fixed set of *design-system*
 *     variants (Hero's `variant`, Container's `width`/`padding`/`background`).
 *     This is a governance choice as much as a UX one: a marketer picks from
 *     a closed set that a designer/engineer defined, instead of typing a
 *     raw class name or hex value into a free-text field. Multiply that by
 *     an org with dozens of content editors across brands and this is what
 *     keeps a component's rendered output from drifting into one-off,
 *     unmaintainable states.
 *   - `showIf` (a real predicate function over `Map<string, unknown>`, not a
 *     string expression - the SDK serializes functions for editor-iframe
 *     transport, so this is fully supported, not a hack) is used to hide
 *     inputs that don't apply to the selected mode (e.g. `ProductCard`'s
 *     static-field inputs only show when `source === "static"`). At scale,
 *     this is what keeps a component's options panel from becoming a wall of
 *     30 fields where only 6 apply to any given instance.
 *   - `required: true` + `helperText` (see Hero's `heroImageAlt`) is how a
 *     content-governance rule gets enforced at the schema level instead of
 *     relying on editors reading a style guide. `heroImageAlt` is named
 *     *exactly* that, not `imageAlt` or `altText`, because a downstream
 *     accessibility-governance check keys off that exact field name when
 *     scanning `Hero` blocks - the input name is itself part of the contract.
 *
 * WHY THERE'S NO `isRSC` FLAG HERE
 * `sdk-react-nextjs` (the newer, still-0.x Next.js-specific SDK) supports an
 * `isRSC: true` flag on `ComponentInfo` so a registered component can be a
 * genuine React Server Component with zero client JS shipped for it. This
 * app deliberately uses `@builder.io/sdk-react` (Gen 2) instead - see
 * AGENTS.md and CLAUDE.md for the full reasoning - and that SDK's `register`
 * has no `isRSC` option at all: every component registered here is a Client
 * Component by construction, and `<Content>` itself only renders client-side.
 * That's a real SDK-level trade-off (more client JS shipped than an RSC-first
 * setup would need), not a Builder-the-product limitation - don't tell a
 * prospect evaluating Builder that Builder can't do RSC; tell them this
 * specific SDK choice trades RSC support for Gen 2's broader interactive-
 * feature support, and `sdk-react-nextjs` is the other point on that curve.
 *
 * HOW A REAL ORG SPLITS THIS PAST ~50 COMPONENTS
 * One flat `CUSTOM_COMPONENTS` array in one file is exactly right at this
 * app's size (one team, one brand). It stops being right long before an org
 * reaches 50+ components across multiple product teams and multiple brands
 * sharing a design system, for reasons that show up in order:
 *   1. Merge conflicts - every team editing the same array in the same file
 *      on every PR.
 *   2. Ownership - a "Checkout" team's components and a "Content/Marketing"
 *      team's components have different release cadences and different
 *      reviewers; one file can't express that.
 *   3. Bundle size - every component in `CUSTOM_COMPONENTS` ships to every
 *      page's client bundle regardless of whether that page uses it, unless
 *      the registration itself is code-split.
 * The standard fix is to push component *ownership* into per-team or
 * per-package registries that each export their own
 * `RegisteredComponent[]`, and have this file (or a thin equivalent) do
 * nothing but import and concatenate them:
 *
 *   // packages/checkout-components/src/registry.ts
 *   export const CHECKOUT_COMPONENTS: RegisteredComponent[] = [ ... ];
 *
 *   // packages/marketing-components/src/registry.ts
 *   export const MARKETING_COMPONENTS: RegisteredComponent[] = [ ... ];
 *
 *   // apps/fieldnote-web/src/builder-registry.ts
 *   import { CHECKOUT_COMPONENTS } from "@fieldnote/checkout-components";
 *   import { MARKETING_COMPONENTS } from "@fieldnote/marketing-components";
 *   export const CUSTOM_COMPONENTS = [...CHECKOUT_COMPONENTS, ...MARKETING_COMPONENTS];
 *
 * Each package versions and tests independently; a design-system team can
 * own a shared base package (tokens, primitives) that every product-team
 * package depends on; and a multi-brand org (think a retail holding company
 * with 6 storefronts on one Builder space setup) can have each brand's app
 * import only the packages relevant to it, keeping bundles lean. The
 * unconditional-registration rule (below, and in AGENTS.md) still applies to
 * every one of those packages individually - none of them should ever gate
 * their `register()` calls on `editingModel`.
 *
 * HOW DESIGN TOKENS FLOW INTO COMPONENT DEFAULTS
 * The `editor.settings.designTokens` call at the bottom of this file (colors,
 * font family, font size - all `var(--fn-*, fallback)`) is what populates
 * Builder's Style tab token picker; `styleStrictMode: true` +
 * `allowOverridingTokens: false` means that picker is the *only* way to set
 * color/font/size in the Visual Editor - no arbitrary hex values. Component
 * `defaultValue`s (e.g. Container's `background: "surface"`) are a second,
 * complementary layer: they set which *token* a freshly-dragged-in component
 * starts on, so a new instance already matches the design system before an
 * editor touches anything. Change a value in `src/app/globals.css`'s
 * `:root`/`@theme inline` block and both layers move together automatically
 * - the token *name* (`surface`, `primary`, ...) referenced here in
 * `defaultValue`s and `enum`s never needs to change, only its underlying
 * value does. See `.builder/rules/tokens.mdc` for the full three-way binding.
 *
 * INSERT MENU CATEGORIES ("group" below)
 * "Heros" groups Hero and its three fixed-variant wrappers (Text Hero, Image
 * Hero, Split Hero). "Cards" groups the atomic Icon Card alongside
 * ProductCard. "Layout" groups Container and its deprecated "Section" alias.
 * Everything else keeps its existing "Fieldnote" group.
 */
import { register } from "@builder.io/sdk-react";
import type { RegisteredComponent } from "@builder.io/sdk-react";
import { Hero } from "@/components/builder/Hero";
import { TextHero, ImageHero, SplitHero } from "@/components/builder/HeroVariants";
import { Container } from "@/components/builder/Container";
import { IconCard } from "@/components/builder/IconCard";
import { ProductCard } from "@/components/builder/ProductCard";
import { ProductGrid } from "@/components/builder/ProductGrid";
import { FeatureCards } from "@/components/builder/FeatureCards";
import { RichText } from "@/components/builder/RichText";
import { Accordion } from "@/components/builder/Accordion";
import { SearchBox } from "@/components/builder/SearchBox";
import { Disclosure } from "@/components/builder/Disclosure";
import { LeadForm } from "@/components/builder/LeadForm";
import { ArticleList } from "@/components/builder/ArticleList";
import { Testimonials } from "@/components/builder/Testimonials";

function heroImageInputsBase(): NonNullable<RegisteredComponent["inputs"]> {
  return [
    { name: "eyebrow", type: "text", defaultValue: "New for Fall" },
    {
      name: "heading",
      type: "text",
      required: true,
      defaultValue: "Gear for the long way round",
    },
    {
      name: "subheading",
      type: "longText",
      defaultValue:
        "Technical outerwear and travel gear built to survive the trip you're actually taking.",
    },
    { name: "ctaLabel", type: "text", defaultValue: "Shop the collection" },
    { name: "ctaHref", type: "url", defaultValue: "/shop" },
  ];
}

function heroImageFieldInputs(): NonNullable<RegisteredComponent["inputs"]> {
  return [
    {
      name: "heroImage",
      type: "file",
      allowedFileTypes: ["jpeg", "jpg", "png", "webp", "svg"],
    },
    {
      name: "heroImageAlt",
      type: "text",
      required: true,
      helperText: "Required - gated by the accessibility workflow rule on Hero images.",
    },
    {
      name: "cloudinaryImage",
      type: "cloudinaryImage",
      helperText:
        "Optional - pick an asset from the existing Cloudinary library instead of Builder's Asset Manager. Overrides the image above when set.",
    },
  ];
}

export const CUSTOM_COMPONENTS: RegisteredComponent[] = [
  {
    component: Hero,
    name: "Hero",
    group: "Heros",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%231B3A2F'/%3E%3Cpath d='M8 26l6-9 5 6 4-5 9 8H8z' fill='%23D4622A'/%3E%3C/svg%3E",
    // Renders a single <section>; noWrap avoids a redundant Builder-added
    // wrapper div around it (see the {...attributes} rule in components.mdc).
    noWrap: true,
    inputs: [
      {
        name: "variant",
        type: "text",
        enum: ["image", "split", "text"],
        defaultValue: "image",
      },
      { name: "eyebrow", type: "text", defaultValue: "New for Fall" },
      {
        name: "heading",
        type: "text",
        required: true,
        defaultValue: "Gear for the long way round",
      },
      {
        name: "subheading",
        type: "longText",
        defaultValue:
          "Technical outerwear and travel gear built to survive the trip you're actually taking.",
      },
      { name: "ctaLabel", type: "text", defaultValue: "Shop the collection" },
      { name: "ctaHref", type: "url", defaultValue: "/shop" },
      {
        name: "heroImage",
        type: "file",
        allowedFileTypes: ["jpeg", "jpg", "png", "webp", "svg"],
        showIf: (options: Map<string, unknown>) => options.get("variant") !== "text",
      },
      {
        name: "heroImageAlt",
        type: "text",
        required: true,
        helperText: "Required - gated by the accessibility workflow rule on Hero images.",
        showIf: (options: Map<string, unknown>) => options.get("variant") !== "text",
      },
      // ENTERPRISE PATTERN: DAM COEXISTENCE (Builder Asset Manager + Cloudinary)
      //
      // An optional, secondary image source alongside `heroImage` above.
      // `heroImage` (type: "file") stays the default, Builder-Asset-Manager-
      // backed path every other image input in this file uses; this field
      // exists specifically to demonstrate the coexistence pattern for a
      // customer with an existing Cloudinary library - see the large
      // top-of-file comment in `plugins/cloudinary-picker/plugin.tsx` for
      // the full "why," and that package's README for why this field type
      // needs a one-time manual Builder Space Settings registration step
      // before its picker UI renders in the editor (until then it falls
      // back to Builder's generic "unrecognized custom type" UI, which is
      // expected, not a bug in this registration). When set, `Hero.tsx`
      // prefers this image over `heroImage`.
      {
        name: "cloudinaryImage",
        type: "cloudinaryImage",
        helperText:
          "Optional - pick an asset from the existing Cloudinary library instead of Builder's Asset Manager. Overrides the image above when set.",
        showIf: (options: Map<string, unknown>) => options.get("variant") !== "text",
      },
    ],
  },
  {
    component: TextHero,
    name: "Text Hero",
    group: "Heros",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23E8DFD2'/%3E%3Crect x='10' y='15' width='20' height='4' fill='%2314161A'/%3E%3Crect x='13' y='22' width='14' height='3' fill='%235C6670'/%3E%3C/svg%3E",
    noWrap: true,
    // No `variant` input - hard-coded to "text" in HeroVariants.tsx, so a
    // content editor dragging this in doesn't see a variant dropdown.
    inputs: heroImageInputsBase(),
  },
  {
    component: ImageHero,
    name: "Image Hero",
    group: "Heros",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%231B3A2F'/%3E%3Cpath d='M8 26l6-9 5 6 4-5 9 8H8z' fill='%23D4622A'/%3E%3C/svg%3E",
    noWrap: true,
    // No `variant` input - hard-coded to "image" in HeroVariants.tsx.
    inputs: [...heroImageInputsBase(), ...heroImageFieldInputs()],
  },
  {
    component: SplitHero,
    name: "Split Hero",
    group: "Heros",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23F7F5F1'/%3E%3Crect x='5' y='9' width='14' height='22' fill='%23E8DFD2'/%3E%3Crect x='22' y='13' width='13' height='4' fill='%2314161A'/%3E%3Crect x='22' y='20' width='13' height='3' fill='%235C6670'/%3E%3C/svg%3E",
    noWrap: true,
    // No `variant` input - hard-coded to "split" in HeroVariants.tsx.
    inputs: [...heroImageInputsBase(), ...heroImageFieldInputs()],
  },
  {
    component: Container,
    name: "Container",
    group: "Layout",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23F7F5F1'/%3E%3Crect x='7' y='11' width='26' height='6' fill='%235C6670'/%3E%3Crect x='7' y='23' width='26' height='6' fill='%23D4622A'/%3E%3C/svg%3E",
    noWrap: true,
    canHaveChildren: true,
    // A Container wraps arbitrary page content, so it isn't scoped to any
    // `models` list and doesn't restrict child component types generally -
    // it's the universal layout wrapper. The one guardrail worth having is
    // stopping editors from nesting a Container inside another Container (or
    // its deprecated "Section" alias below), which breaks the
    // width/padding/background assumptions of both.
    childRequirements: {
      message: "Containers can't be nested. Add content directly, or start a new Container.",
      query: { "component.name": { $nin: ["Container", "Section"] } },
    },
    inputs: [
      {
        name: "width",
        type: "text",
        enum: ["narrow", "default", "wide", "full"],
        defaultValue: "default",
      },
      {
        name: "padding",
        type: "text",
        enum: ["none", "sm", "md", "lg"],
        defaultValue: "md",
      },
      {
        name: "background",
        type: "text",
        enum: ["surface", "surfaceAlt", "primary", "sand"],
        defaultValue: "surface",
      },
    ],
  },
  {
    // DEPRECATED ALIAS - kept only so existing Builder content entries whose
    // blocks reference component name "Section" keep rendering. Points at
    // the exact same Container render function/props as the registration
    // above; new content should use "Container" instead. Don't remove this
    // until existing content has been migrated off the "Section" name.
    component: Container,
    name: "Section",
    group: "Layout",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23F7F5F1'/%3E%3Crect x='7' y='11' width='26' height='6' fill='%235C6670'/%3E%3Crect x='7' y='23' width='26' height='6' fill='%23D4622A'/%3E%3C/svg%3E",
    noWrap: true,
    canHaveChildren: true,
    childRequirements: {
      message: "Sections can't be nested. Add content directly, or start a new Container.",
      query: { "component.name": { $nin: ["Container", "Section"] } },
    },
    inputs: [
      {
        name: "width",
        type: "text",
        enum: ["narrow", "default", "wide", "full"],
        defaultValue: "default",
      },
      {
        name: "padding",
        type: "text",
        enum: ["none", "sm", "md", "lg"],
        defaultValue: "md",
      },
      {
        name: "background",
        type: "text",
        enum: ["surface", "surfaceAlt", "primary", "sand"],
        defaultValue: "surface",
      },
    ],
  },
  {
    component: IconCard,
    name: "Icon Card",
    group: "Cards",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23FFFFFF' stroke='%23E8DFD2' stroke-width='2'/%3E%3Ccircle cx='14' cy='14' r='6' fill='none' stroke='%23D4622A' stroke-width='2'/%3E%3Crect x='9' y='24' width='22' height='3' fill='%2314161A'/%3E%3Crect x='9' y='29' width='16' height='2.5' fill='%235C6670'/%3E%3C/svg%3E",
    noWrap: true,
    // A single atomic card (not list/array-based like FeatureCards), meant
    // to be dragged in individually and repeated via Builder's built-in
    // Columns/Box layout components.
    inputs: [
      {
        name: "icon",
        type: "text",
        enum: ["compass", "mountain", "shield", "truck", "leaf", "tag"],
        defaultValue: "compass",
      },
      { name: "title", type: "text", defaultValue: "Built for the trail" },
      {
        name: "description",
        type: "longText",
        defaultValue:
          "A short description of this feature or benefit, ready to repeat inside a Columns or Box layout.",
      },
    ],
  },
  {
    component: ProductCard,
    name: "ProductCard",
    group: "Cards",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23FFFFFF' stroke='%23E8DFD2' stroke-width='2'/%3E%3Crect x='9' y='8' width='22' height='16' fill='%23E8DFD2'/%3E%3Crect x='9' y='27' width='16' height='4' fill='%2314161A'/%3E%3C/svg%3E",
    noWrap: true,
    inputs: [
      {
        name: "source",
        type: "text",
        enum: ["product", "static"],
        defaultValue: "static",
        helperText:
          "product pulls live data from the Product model; static (default) uses the fields below.",
      },
      {
        name: "product",
        type: "reference",
        model: "product",
        showIf: (options: Map<string, unknown>) => options.get("source") === "product",
      },
      {
        name: "staticName",
        type: "text",
        defaultValue: "Cascade 3L Shell",
        showIf: (options: Map<string, unknown>) => options.get("source") === "static",
      },
      {
        name: "staticPrice",
        type: "number",
        defaultValue: 389,
        showIf: (options: Map<string, unknown>) => options.get("source") === "static",
      },
      {
        name: "staticCurrency",
        type: "text",
        defaultValue: "USD",
        showIf: (options: Map<string, unknown>) => options.get("source") === "static",
      },
      {
        name: "staticImage",
        type: "file",
        allowedFileTypes: ["jpeg", "jpg", "png", "webp"],
        showIf: (options: Map<string, unknown>) => options.get("source") === "static",
      },
      {
        name: "staticImageAlt",
        type: "text",
        defaultValue: "Cascade 3L Shell rain jacket in forest green",
        showIf: (options: Map<string, unknown>) => options.get("source") === "static",
      },
      {
        name: "staticHref",
        type: "url",
        defaultValue: "/products/cascade-3l-shell",
        showIf: (options: Map<string, unknown>) => options.get("source") === "static",
      },
      {
        name: "staticBadge",
        type: "text",
        defaultValue: "Best Seller",
        showIf: (options: Map<string, unknown>) => options.get("source") === "static",
      },
    ],
  },
  {
    component: ProductGrid,
    name: "ProductGrid",
    group: "Fieldnote",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23FFFFFF' stroke='%23E8DFD2' stroke-width='2'/%3E%3Crect x='6' y='7' width='11' height='11' fill='%231B3A2F'/%3E%3Crect x='23' y='7' width='11' height='11' fill='%23D4622A'/%3E%3Crect x='6' y='22' width='11' height='11' fill='%23D4622A'/%3E%3Crect x='23' y='22' width='11' height='11' fill='%231B3A2F'/%3E%3C/svg%3E",
    noWrap: true,
    inputs: [
      {
        name: "source",
        type: "text",
        enum: ["builder", "shopify", "api"],
        defaultValue: "builder",
        helperText:
          "builder uses the products list below; shopify/api fetch client-side from apiUrl. All three fall back to a static product set if the source is empty or fails.",
      },
      {
        name: "columns",
        type: "text",
        enum: ["2", "3", "4"],
        defaultValue: "3",
        helperText: "Number of grid columns at desktop width.",
      },
      {
        name: "heading",
        type: "text",
        defaultValue: "Shop the collection",
        helperText: "Heading shown above the grid.",
      },
      {
        name: "products",
        type: "list",
        subFields: [
          {
            name: "product",
            type: "reference",
            model: "product",
          },
        ],
        showIf: (options: Map<string, unknown>) => options.get("source") === "builder",
      },
      {
        name: "apiUrl",
        type: "url",
        // Defaults to the mock-Shopify-backed Route Handler (pattern 2 -
        // see the top-of-file ENTERPRISE PATTERN block and
        // src/app/api/shopify-products/route.ts). Point this at any other
        // JSON endpoint to demo a different commerce/PIM backend without
        // touching this component's code.
        defaultValue: "/api/shopify-products",
        helperText: "Endpoint returning a JSON array of products.",
        showIf: (options: Map<string, unknown>) => options.get("source") !== "builder",
      },
    ],
  },
  {
    component: FeatureCards,
    name: "FeatureCards",
    group: "Fieldnote",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23F7F5F1'/%3E%3Crect x='5' y='9' width='9' height='11' rx='2' fill='%23FFFFFF' stroke='%235C6670'/%3E%3Crect x='15.5' y='9' width='9' height='11' rx='2' fill='%23FFFFFF' stroke='%235C6670'/%3E%3Crect x='26' y='9' width='9' height='11' rx='2' fill='%23FFFFFF' stroke='%235C6670'/%3E%3Ccircle cx='9.5' cy='13' r='1.6' fill='%23D4622A'/%3E%3Ccircle cx='20' cy='13' r='1.6' fill='%23D4622A'/%3E%3Ccircle cx='30.5' cy='13' r='1.6' fill='%23D4622A'/%3E%3C/svg%3E",
    noWrap: true,
    inputs: [
      {
        name: "heading",
        type: "text",
        defaultValue: "Why gear up with Fieldnote",
        helperText: "Heading shown above the cards.",
      },
      {
        name: "columns",
        type: "text",
        enum: ["2", "3", "4"],
        defaultValue: "3",
        helperText: "Number of grid columns at desktop width.",
      },
      {
        name: "cards",
        type: "list",
        defaultValue: [
          {
            icon: "shield",
            title: "Lifetime repair guarantee",
            description:
              "Every Fieldnote piece is backed by free repairs for as long as you own it - rips, zippers, seams, all of it.",
          },
          {
            icon: "truck",
            title: "Free shipping over $75",
            description:
              "Standard shipping is free on orders over $75, with expedited options at checkout for trip-week orders.",
          },
          {
            icon: "mountain",
            title: "Field-tested, not lab-tested",
            description:
              "Every product spends a season with our guides on real trails before it ships to you.",
          },
        ],
        subFields: [
          {
            name: "icon",
            type: "text",
            enum: ["compass", "mountain", "shield", "truck", "leaf", "tag"],
            defaultValue: "compass",
            helperText: "Used unless an image is set below.",
          },
          {
            name: "image",
            type: "file",
            allowedFileTypes: ["jpeg", "jpg", "png", "webp", "svg"],
            helperText: "Optional - overrides the icon when set.",
          },
          { name: "title", type: "text", defaultValue: "Feature title" },
          {
            name: "description",
            type: "longText",
            defaultValue: "A short description of this feature or benefit.",
          },
          { name: "linkLabel", type: "text" },
          { name: "linkHref", type: "url" },
        ],
      },
    ],
  },
  {
    component: RichText,
    name: "RichText",
    group: "Fieldnote",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23FFFFFF' stroke='%23E8DFD2' stroke-width='2'/%3E%3Crect x='8' y='10' width='24' height='3' fill='%2314161A'/%3E%3Crect x='8' y='17' width='24' height='2.5' fill='%235C6670'/%3E%3Crect x='8' y='22' width='24' height='2.5' fill='%235C6670'/%3E%3Crect x='8' y='27' width='15' height='2.5' fill='%23D4622A'/%3E%3C/svg%3E",
    noWrap: true,
    inputs: [
      {
        name: "content",
        type: "richText",
        defaultValue:
          "<p>Every Fieldnote jacket, pack and boot goes through the same test before it ships: a season in the hands of our own guides, on the actual trips we sell you on.</p><p>That's the difference between gear that looks rugged on a shelf and gear that <strong>holds up on day nine of a ten-day traverse</strong> - worn, rained on, and packed away wet more times than we'd like to admit.</p><p>Read more about how we source materials and test in the field on our <a href=\"/sustainability\">sustainability page</a>.</p>",
        helperText: "Rendered as sanitized HTML - all output is passed through DOMPurify.",
      },
      {
        name: "width",
        type: "text",
        enum: ["narrow", "default", "wide"],
        defaultValue: "default",
        helperText: "Constrains the line length of long-form copy.",
      },
    ],
  },
  {
    component: Accordion,
    name: "Accordion",
    group: "Fieldnote",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23FFFFFF' stroke='%23E8DFD2' stroke-width='2'/%3E%3Crect x='6' y='8' width='28' height='8' rx='1' fill='%23F7F5F1'/%3E%3Cpath d='M29 11l2 2-2 2' fill='none' stroke='%23D4622A' stroke-width='1.5'/%3E%3Crect x='6' y='18' width='28' height='8' rx='1' fill='%23F7F5F1'/%3E%3Cpath d='M29 21l2 2-2 2' fill='none' stroke='%235C6670' stroke-width='1.5'/%3E%3C/svg%3E",
    noWrap: true,
    inputs: [
      {
        name: "heading",
        type: "text",
        defaultValue: "Shipping & returns",
        helperText: "Heading shown above the accordion.",
      },
      {
        name: "behavior",
        type: "text",
        enum: ["single", "multiple"],
        defaultValue: "single",
        helperText: "single closes other items when one opens; multiple allows several open at once.",
      },
      {
        name: "items",
        type: "list",
        defaultValue: [
          {
            question: "What's your return policy?",
            answer:
              "<p>Unworn gear can be returned within 60 days for a full refund. Worn gear that fails on the trail is covered by our lifetime repair guarantee instead of a return - <a href=\"/help\">contact us</a> and we'll sort out a repair or replacement.</p>",
          },
          {
            question: "How long does shipping take?",
            answer:
              "<p>Standard shipping arrives in 3-5 business days and is free on orders over $75. Expedited 2-day shipping is available at checkout if you're packing for a trip this week.</p>",
          },
          {
            question: "How do I find my size?",
            answer:
              "<p>Every product page has a size chart under the fit details. If you're between sizes, we generally recommend sizing up for layering room - our <a href=\"/help\">size guide</a> covers each category in more depth.</p>",
          },
        ],
        subFields: [
          { name: "question", type: "text", defaultValue: "Your question here" },
          {
            name: "answer",
            type: "richText",
            defaultValue: "<p>Rendered as sanitized HTML - all output is passed through DOMPurify.</p>",
          },
        ],
      },
    ],
  },
  {
    component: SearchBox,
    name: "SearchBox",
    group: "Fieldnote",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23FFFFFF' stroke='%23E8DFD2' stroke-width='2'/%3E%3Crect x='7' y='13' width='19' height='9' rx='4.5' fill='%23F7F5F1' stroke='%235C6670'/%3E%3Ccircle cx='27' cy='27' r='4' fill='none' stroke='%23D4622A' stroke-width='2'/%3E%3Cpath d='M30 30l3 3' stroke='%23D4622A' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E",
    noWrap: true,
    inputs: [
      {
        name: "placeholder",
        type: "text",
        defaultValue: "Search jackets, packs, boots...",
        helperText:
          "Filters the local product catalog client-side (name + category). Algolia isn't configured yet - this is a real, working filter, not a stub.",
      },
    ],
  },
  {
    component: Disclosure,
    name: "Disclosure",
    group: "Fieldnote",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23F7F5F1'/%3E%3Crect x='7' y='9' width='26' height='16' rx='2' fill='%23FFFFFF' stroke='%235C6670'/%3E%3Crect x='11' y='13' width='18' height='2' fill='%235C6670'/%3E%3Crect x='11' y='17' width='18' height='2' fill='%235C6670'/%3E%3Ccircle cx='30' cy='28' r='6' fill='%23D4622A'/%3E%3Cpath d='M30 25v3.5l2 2' stroke='%23FFFFFF' stroke-width='1.3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E",
    noWrap: true,
    inputs: [
      {
        name: "disclosure",
        type: "reference",
        model: "disclosure",
        helperText: "Resolves body, jurisdiction, effective date and version from the referenced disclosure entry.",
      },
      {
        name: "collapsed",
        type: "boolean",
        defaultValue: true,
        helperText: "When on, renders as click-to-expand; when off, the disclosure text is always visible.",
      },
      {
        name: "label",
        type: "text",
        defaultValue: "View important disclosures",
        helperText: "Clickable summary text shown when collapsed.",
      },
    ],
  },
  {
    component: LeadForm,
    name: "LeadForm",
    group: "Fieldnote",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23FFFFFF' stroke='%23E8DFD2' stroke-width='2'/%3E%3Crect x='8' y='9' width='24' height='4' rx='1' fill='%23F7F5F1' stroke='%235C6670'/%3E%3Crect x='8' y='16' width='24' height='4' rx='1' fill='%23F7F5F1' stroke='%235C6670'/%3E%3Crect x='8' y='25' width='13' height='6' rx='2' fill='%231B3A2F'/%3E%3C/svg%3E",
    noWrap: true,
    inputs: [
      {
        name: "heading",
        type: "text",
        defaultValue: "Talk to our Pro team",
        helperText: "Heading shown above the form.",
      },
      {
        name: "subheading",
        type: "longText",
        defaultValue:
          "Tell us about your outfitter, guide service, or fleet and we'll follow up with trade pricing and bulk ordering options.",
      },
      {
        name: "ctaLabel",
        type: "text",
        defaultValue: "Request trade pricing",
      },
      {
        name: "endpoint",
        type: "url",
        helperText:
          "No CRM is connected yet. Leave blank to simulate a real submission with a genuine success state; set a URL to POST leads there instead - no other change needed.",
      },
    ],
  },
  {
    component: ArticleList,
    name: "ArticleList",
    group: "Fieldnote",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23FFFFFF' stroke='%23E8DFD2' stroke-width='2'/%3E%3Crect x='5' y='8' width='11' height='9' fill='%23E8DFD2'/%3E%3Crect x='5' y='19' width='11' height='3' fill='%2314161A'/%3E%3Crect x='5' y='24' width='11' height='2.5' fill='%235C6670'/%3E%3Crect x='19' y='8' width='11' height='9' fill='%23E8DFD2'/%3E%3Crect x='19' y='19' width='11' height='3' fill='%2314161A'/%3E%3Crect x='19' y='24' width='11' height='2.5' fill='%235C6670'/%3E%3C/svg%3E",
    noWrap: true,
    inputs: [
      {
        name: "source",
        type: "text",
        enum: ["manual", "surface"],
        defaultValue: "manual",
        helperText:
          "manual uses the articles list below; surface auto-populates by querying the surface/topic filters instead of picking articles by hand.",
      },
      {
        name: "heading",
        type: "text",
        defaultValue: "From the field",
        helperText: "Heading shown above the list.",
      },
      {
        name: "columns",
        type: "text",
        enum: ["2", "3", "4"],
        defaultValue: "3",
        helperText: "Number of grid columns at desktop width.",
      },
      {
        name: "articles",
        type: "list",
        subFields: [
          {
            name: "article",
            type: "reference",
            model: "article",
          },
        ],
        showIf: (options: Map<string, unknown>) => options.get("source") === "manual",
      },
      {
        name: "surface",
        type: "text",
        enum: ["all", "help", "blog", "pro"],
        defaultValue: "all",
        showIf: (options: Map<string, unknown>) => options.get("source") === "surface",
      },
      {
        name: "topic",
        type: "reference",
        model: "help-topic",
        helperText: "Optional - narrows the surface query to one topic.",
        showIf: (options: Map<string, unknown>) => options.get("source") === "surface",
      },
    ],
  },
  {
    component: Testimonials,
    name: "Testimonials",
    group: "Fieldnote",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23F7F5F1'/%3E%3Cpath d='M10 12h8v7c0 2.8-2.2 5-5 5h-1v-3h1c1.1 0 2-.9 2-2h-5v-7z' fill='%231B3A2F'/%3E%3Cpath d='M22 12h8v7c0 2.8-2.2 5-5 5h-1v-3h1c1.1 0 2-.9 2-2h-5v-7z' fill='%23D4622A'/%3E%3C/svg%3E",
    noWrap: true,
    inputs: [
      {
        name: "heading",
        type: "text",
        defaultValue: "What our customers say",
        helperText: "Heading shown above the testimonials.",
      },
      {
        name: "layout",
        type: "text",
        enum: ["grid", "carousel"],
        defaultValue: "grid",
        helperText: "carousel is a real slider with prev/next controls and auto-advance (paused on hover).",
      },
      {
        name: "testimonials",
        type: "list",
        defaultValue: [
          {
            quote:
              "I've put the Cascade shell through three wet-season backpacking trips now and it still beads water like day one. First rain jacket I haven't had to re-treat every month.",
            authorName: "Priya Nandan",
            authorRole: "Backpacker, Portland OR",
          },
          {
            quote:
              "Ordered the Longhaul pack for a six-country trip and it fit in every overhead bin I threw at it, including the tiny regional ones in Southeast Asia.",
            authorName: "Diego Fuentes",
            authorRole: "Travel blogger",
          },
          {
            quote:
              "We outfit twelve guides a season and Fieldnote's the first brand where the repair guarantee actually held up when we used it. That's rare in this industry.",
            authorName: "Casey Whitfield",
            authorRole: "Owner, Ridge & River Guiding Co.",
          },
        ],
        subFields: [
          {
            name: "quote",
            type: "longText",
            defaultValue: "This gear held up exactly the way we hoped it would.",
          },
          { name: "authorName", type: "text", defaultValue: "Customer name" },
          { name: "authorRole", type: "text" },
          {
            name: "avatar",
            type: "file",
            allowedFileTypes: ["jpeg", "jpg", "png", "webp"],
          },
        ],
      },
    ],
  },
];

for (const info of CUSTOM_COMPONENTS) {
  register("component", info);
}

register("editor.settings", {
  styleStrictMode: true,
  allowOverridingTokens: false,
  designTokens: {
    colors: [
      { name: "Primary", value: "var(--fn-color-primary, #1B3A2F)" },
      { name: "Accent", value: "var(--fn-color-accent, #D4622A)" },
      { name: "Sand", value: "var(--fn-color-sand, #E8DFD2)" },
      { name: "Ink", value: "var(--fn-color-ink, #14161A)" },
      { name: "Slate", value: "var(--fn-color-slate, #5C6670)" },
      { name: "Surface", value: "var(--fn-color-surface, #FFFFFF)" },
      { name: "Surface Alt", value: "var(--fn-color-surface-alt, #F7F5F1)" },
      { name: "Success", value: "var(--fn-color-success, #2F6B4F)" },
      { name: "Warning", value: "var(--fn-color-warning, #B8791C)" },
      { name: "Danger", value: "var(--fn-color-danger, #A6342B)" },
    ],
    fontFamily: [
      { name: "Display", value: "var(--fn-font-display, Instrument Sans)" },
      { name: "Body", value: "var(--fn-font-body, Inter)" },
    ],
    fontSize: [
      { name: "XS", value: "var(--fn-text-xs, 12px)" },
      { name: "SM", value: "var(--fn-text-sm, 14px)" },
      { name: "Base", value: "var(--fn-text-base, 16px)" },
      { name: "LG", value: "var(--fn-text-lg, 18px)" },
      { name: "XL", value: "var(--fn-text-xl, 24px)" },
      { name: "2XL", value: "var(--fn-text-2xl, 32px)" },
      { name: "3XL", value: "var(--fn-text-3xl, 44px)" },
      { name: "4XL", value: "var(--fn-text-4xl, 56px)" },
    ],
    boxShadow: false,
  },
});
