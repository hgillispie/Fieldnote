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
