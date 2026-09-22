"use client";

/**
 * The single Builder component + editor-settings registry for this app.
 * Client-only: `@builder.io/sdk-react` cannot register React Server
 * Components (SDK constraint, not a Builder one — see CLAUDE.md).
 *
 * Imported once from RenderBuilderContent so registration runs wherever
 * Builder content is rendered. Exemplar components (Hero, Section,
 * ProductCard) register themselves here in Phase 2. Insert menus for
 * every component must be registered unconditionally — never gated on
 * `builder.editingModel`, which is what hid 9 components in the old build.
 */
import { register } from "@builder.io/sdk-react";

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
