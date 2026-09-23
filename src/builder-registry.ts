"use client";

/**
 * The single Builder component + editor-settings registry for this app.
 * Client-only: `@builder.io/sdk-react` cannot register React Server
 * Components (SDK constraint, not a Builder one — see CLAUDE.md).
 *
 * Imported once from RenderBuilderContent so registration runs wherever
 * Builder content is rendered. All `register()` calls below run
 * unconditionally at module scope — never gated on `builder.editingModel`,
 * which is what hid 9 components in the old build. New components Builder
 * Code adds get registered the same way, in this same file.
 *
 * ⚠️ `register("component", info)` alone is NOT enough to render — it only
 * posts a message to the Visual Editor iframe so the component shows up in
 * the insert menu and options panel (confirmed from the SDK's compiled
 * source: the registered-component store it writes to is never read by
 * `<Content>`'s own render path). `<Content>` resolves components to render
 * from an explicit `customComponents` prop instead. So every component here
 * is registered *and* collected into `CUSTOM_COMPONENTS`, which
 * RenderBuilderContent.tsx passes to `<Content customComponents={...}>`.
 * Skip either half and the component silently no-ops — no error, just a
 * console warning ("Could not find a registered component named X") and a
 * blank space where it should render.
 */
import { register } from "@builder.io/sdk-react";
import type { RegisteredComponent } from "@builder.io/sdk-react";
import { Hero } from "@/components/builder/Hero";
import { Section } from "@/components/builder/Section";
import { ProductCard } from "@/components/builder/ProductCard";
import { ProductGrid } from "@/components/builder/ProductGrid";
import { FeatureCards } from "@/components/builder/FeatureCards";
import { RichText } from "@/components/builder/RichText";
import { Accordion } from "@/components/builder/Accordion";
import { SearchBox } from "@/components/builder/SearchBox";

export const CUSTOM_COMPONENTS: RegisteredComponent[] = [
  {
    component: Hero,
    name: "Hero",
    group: "Fieldnote",
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
        helperText:
          "Required — gated by the accessibility workflow rule on Hero images.",
        showIf: (options: Map<string, unknown>) => options.get("variant") !== "text",
      },
    ],
  },
  {
    component: Section,
    name: "Section",
    group: "Fieldnote",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%23F7F5F1'/%3E%3Crect x='7' y='11' width='26' height='6' fill='%235C6670'/%3E%3Crect x='7' y='23' width='26' height='6' fill='%23D4622A'/%3E%3C/svg%3E",
    noWrap: true,
    canHaveChildren: true,
    // A Section wraps arbitrary page content, so it isn't scoped to any
    // `models` list and doesn't restrict child component types generally —
    // it's the universal layout wrapper. The one guardrail worth having is
    // stopping editors from nesting a Section inside another Section, which
    // breaks the width/padding/background assumptions of both.
    childRequirements: {
      message: "Sections can't be nested. Add content directly, or start a new Section.",
      query: { "component.name": { $nin: ["Section"] } },
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
    component: ProductCard,
    name: "ProductCard",
    group: "Fieldnote",
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
              "Every Fieldnote piece is backed by free repairs for as long as you own it — rips, zippers, seams, all of it.",
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
            helperText: "Optional — overrides the icon when set.",
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
          "<p>Every Fieldnote jacket, pack and boot goes through the same test before it ships: a season in the hands of our own guides, on the actual trips we sell you on.</p><p>That's the difference between gear that looks rugged on a shelf and gear that <strong>holds up on day nine of a ten-day traverse</strong> \u2014 worn, rained on, and packed away wet more times than we'd like to admit.</p><p>Read more about how we source materials and test in the field on our <a href=\"/sustainability\">sustainability page</a>.</p>",
        helperText: "Rendered as sanitized HTML \u2014 all output is passed through DOMPurify.",
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
              "<p>Unworn gear can be returned within 60 days for a full refund. Worn gear that fails on the trail is covered by our lifetime repair guarantee instead of a return \u2014 <a href=\"/help\">contact us</a> and we'll sort out a repair or replacement.</p>",
          },
          {
            question: "How long does shipping take?",
            answer:
              "<p>Standard shipping arrives in 3\u20135 business days and is free on orders over $75. Expedited 2-day shipping is available at checkout if you're packing for a trip this week.</p>",
          },
          {
            question: "How do I find my size?",
            answer:
              "<p>Every product page has a size chart under the fit details. If you're between sizes, we generally recommend sizing up for layering room \u2014 our <a href=\"/help\">size guide</a> covers each category in more depth.</p>",
          },
        ],
        subFields: [
          { name: "question", type: "text", defaultValue: "Your question here" },
          {
            name: "answer",
            type: "richText",
            defaultValue: "<p>Rendered as sanitized HTML \u2014 all output is passed through DOMPurify.</p>",
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
          "Filters the local product catalog client-side (name + category). Algolia isn't configured yet — this is a real, working filter, not a stub.",
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
