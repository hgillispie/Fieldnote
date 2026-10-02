"use client";

import { SectionShell } from "./SectionShell";

export type HeroVariant = "image" | "split" | "text" | "minimal";

// ENTERPRISE PATTERN: DAM COEXISTENCE (Builder Asset Manager + Cloudinary)
// The shape stored by the `cloudinaryImage` custom field type — see
// `plugins/cloudinary-picker/plugin.tsx` for where this is registered and
// why it's a secondary, optional image source rather than replacing
// `heroImage`.
interface HeroCloudinaryImage {
  secureUrl?: string;
}

export interface HeroProps {
  variant?: HeroVariant;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
  heroImage?: string;
  heroImageAlt?: string;
  cloudinaryImage?: HeroCloudinaryImage;
  attributes?: Record<string, unknown>;
}

// Static lookup maps only — an interpolated class like `text-${variant}` never
// compiles, since Tailwind's scanner needs the literal class name in source.
const CONTAINER_CLASSES: Record<HeroVariant, string> = {
  image:
    "relative isolate flex min-h-[480px] items-center justify-center overflow-hidden rounded-lg text-surface md:min-h-[560px]",
  split:
    "grid gap-8 rounded-lg bg-surface-alt p-8 md:grid-cols-2 md:items-center md:gap-12 md:p-12",
  text: "flex flex-col items-center gap-5 rounded-lg bg-sand px-6 py-16 text-center md:py-24",
  minimal: "border-b border-sand pb-8 md:pb-10",
};

// The image variant only paints a background when no image is set. A rounded
// element that both clips a child and paints its own background shows that
// background as a hairline along each corner arc where the clip anti-aliases
// — no child can cover it, because it is the clipping element's own paint.
const IMAGE_VARIANT_FALLBACK_BACKGROUND = "bg-gradient-to-br from-ink to-primary";

const COPY_WRAPPER_CLASSES: Record<HeroVariant, string> = {
  image:
    "relative z-10 flex max-w-2xl flex-col items-center gap-5 px-6 py-16 text-center md:gap-6",
  split: "flex flex-col gap-5",
  text: "flex max-w-2xl flex-col items-center gap-5",
  minimal: "flex max-w-3xl flex-col gap-3",
};

const HEADING_CLASSES: Record<HeroVariant, string> = {
  image: "font-display text-3xl leading-tight md:text-4xl",
  split: "font-display text-3xl leading-tight md:text-4xl",
  text: "font-display text-3xl leading-tight md:text-4xl",
  minimal: "font-display text-2xl leading-tight text-ink md:text-3xl",
};

const SUBHEADING_CLASSES: Record<HeroVariant, string> = {
  image: "text-lg text-surface/90",
  split: "text-lg text-slate",
  text: "text-lg text-slate",
  minimal: "text-sm text-slate",
};

const CTA_CLASSES: Record<HeroVariant, string> = {
  image:
    "mt-2 inline-flex items-center rounded-md bg-accent px-7 py-3.5 text-sm font-medium text-surface transition hover:opacity-90",
  split:
    "mt-2 inline-flex items-center self-start rounded-md bg-accent px-7 py-3.5 text-sm font-medium text-surface transition hover:opacity-90",
  text: "mt-2 inline-flex items-center rounded-md bg-accent px-7 py-3.5 text-sm font-medium text-surface transition hover:opacity-90",
  minimal:
    "mt-1 inline-flex items-center gap-1 self-start text-sm font-medium text-accent underline-offset-4 hover:underline",
};

const SECTION_SPACING: Record<HeroVariant, "sm" | "md"> = {
  image: "md",
  split: "md",
  text: "md",
  minimal: "sm",
};

export function Hero({
  variant = "image",
  eyebrow,
  heading,
  subheading,
  ctaLabel,
  ctaHref,
  heroImage,
  heroImageAlt,
  cloudinaryImage,
  attributes,
}: HeroProps) {
  // Cloudinary, when an editor has picked one via the "Choose from
  // Cloudinary" field, wins over Builder's own Asset Manager image — see
  // the ENTERPRISE PATTERN comment on `cloudinaryImage` in
  // src/builder-registry.ts.
  const resolvedImage = cloudinaryImage?.secureUrl || heroImage;

  // No fallback copy at render time: a page that never set a CTA (legal,
  // informational) must not inherit a commerce button from a default.
  const showCta = Boolean(ctaLabel?.trim() && ctaHref?.trim());

  const heroCardClassName =
    variant === "image" && !resolvedImage
      ? `${CONTAINER_CLASSES.image} ${IMAGE_VARIANT_FALLBACK_BACKGROUND}`
      : CONTAINER_CLASSES[variant];

  return (
    <SectionShell attributes={attributes} spacing={SECTION_SPACING[variant]}>
      <div className={heroCardClassName}>
        {variant === "image" && resolvedImage && (
          <img
            src={resolvedImage}
            alt={heroImageAlt ?? ""}
            className="absolute inset-0 h-full w-full rounded-lg object-cover"
          />
        )}
        {variant === "image" && <div className="absolute inset-0 rounded-lg bg-ink/45" />}

        {variant === "split" && (
          <div className="overflow-hidden rounded-md bg-sand">
            {resolvedImage && (
              <img
                src={resolvedImage}
                alt={heroImageAlt ?? ""}
                className="aspect-[4/3] w-full rounded-md object-cover"
              />
            )}
          </div>
        )}

        <div className={COPY_WRAPPER_CLASSES[variant]}>
          {eyebrow && (
            <span className="text-sm font-medium uppercase tracking-wide text-accent">
              {eyebrow}
            </span>
          )}
          {heading && <h1 className={HEADING_CLASSES[variant]}>{heading}</h1>}
          {subheading && <p className={SUBHEADING_CLASSES[variant]}>{subheading}</p>}
          {showCta && (
            <a href={ctaHref} className={CTA_CLASSES[variant]}>
              {ctaLabel}
            </a>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
