"use client";

type HeroVariant = "image" | "split" | "text";

interface HeroProps {
  variant?: HeroVariant;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
  heroImage?: string;
  heroImageAlt?: string;
  attributes?: Record<string, unknown>;
}

// Static lookup maps only — an interpolated class like `text-${variant}` never
// compiles, since Tailwind's scanner needs the literal class name in source.
const CONTAINER_CLASSES: Record<HeroVariant, string> = {
  image:
    "relative flex min-h-[480px] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-ink to-primary text-surface",
  split:
    "grid gap-8 rounded-lg bg-surface-alt p-8 md:grid-cols-2 md:items-center",
  text: "flex flex-col items-center gap-4 rounded-lg bg-sand px-6 py-16 text-center",
};

const COPY_WRAPPER_CLASSES: Record<HeroVariant, string> = {
  image: "relative z-10 flex max-w-xl flex-col items-center gap-4 px-6 text-center",
  split: "flex flex-col gap-4",
  text: "flex max-w-2xl flex-col items-center gap-4",
};

const SUBHEADING_CLASSES: Record<HeroVariant, string> = {
  image: "text-lg text-surface/90",
  split: "text-lg text-slate",
  text: "text-lg text-slate",
};

export function Hero({
  variant = "image",
  eyebrow,
  heading = "Gear for the long way round",
  subheading = "Technical outerwear and travel gear built to survive the trip you're actually taking.",
  ctaLabel = "Shop the collection",
  ctaHref = "/shop",
  heroImage,
  heroImageAlt,
  attributes,
}: HeroProps) {
  return (
    <section {...attributes} className={CONTAINER_CLASSES[variant]}>
      {variant === "image" && heroImage && (
        <img
          src={heroImage}
          alt={heroImageAlt ?? ""}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {variant === "image" && <div className="absolute inset-0 bg-ink/40" />}

      {variant === "split" && (
        <div className="overflow-hidden rounded-md bg-sand">
          {heroImage && (
            <img
              src={heroImage}
              alt={heroImageAlt ?? ""}
              className="aspect-[4/3] w-full object-cover"
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
        <h1 className="font-display text-4xl leading-tight">{heading}</h1>
        <p className={SUBHEADING_CLASSES[variant]}>{subheading}</p>
        <a
          href={ctaHref}
          className="inline-flex items-center rounded-md bg-accent px-6 py-3 text-sm font-medium text-surface transition hover:opacity-90"
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}
