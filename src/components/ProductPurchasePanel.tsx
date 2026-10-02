"use client";

// ENTERPRISE PATTERN: INTERACTIVE PDP CHROME, SERVER-FETCHED DATA
//
// `src/app/products/[slug]/page.tsx` stays a Server Component (one Builder
// round-trip, cached via `React.cache`, no client-side data fetching) and
// hands this component the already-resolved variant/price data as plain
// props. Only the genuinely interactive surface -- which color/size is
// selected, the quantity stepper, the add-to-cart button's transient
// "Added" state -- needs to run on the client, so it's isolated here rather
// than promoting the whole PDP to a Client Component.
//
// This is deliberately NOT wired to a real cart: there's no cart model, no
// persisted line-item state, no checkout. Clicking "Add to cart" updates
// this component's own local state for visual feedback only -- a demo PDP needs to
// *look* like a real storefront's purchase flow (variant picker, qty
// stepper, confirmation state), not actually run one.
import Link from "next/link";
import { useState } from "react";

interface ProductColor {
  name?: string;
  hex?: string;
  swatchImage?: string;
}

interface ProductSize {
  size?: string;
}

interface ProductPurchasePanelProps {
  colors: ProductColor[];
  sizes: ProductSize[];
  inStock: boolean;
}

export function ProductPurchasePanel({
  colors,
  sizes,
  inStock,
}: ProductPurchasePanelProps) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    colors[0]?.name,
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    undefined,
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const sizeOptions = sizes
    .map((item) => item.size)
    .filter((size): size is string => !!size);
  const needsSize = sizeOptions.length > 0;
  const canAddToCart = inStock && (!needsSize || !!selectedSize);

  function decrement() {
    setQuantity((qty) => Math.max(1, qty - 1));
  }

  function increment() {
    setQuantity((qty) => Math.min(10, qty + 1));
  }

  function handleAddToCart() {
    if (!canAddToCart) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      {colors.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink">
            Color{selectedColor ? ` — ${selectedColor}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((color, index) => {
              const isSelected = color.name === selectedColor;
              return (
                <button
                  key={`${color.name}-${index}`}
                  type="button"
                  onClick={() => setSelectedColor(color.name)}
                  aria-pressed={isSelected}
                  aria-label={color.name ?? "Color option"}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                    isSelected
                      ? "border-ink bg-ink text-surface"
                      : "border-sand bg-surface text-ink hover:border-ink"
                  }`}
                >
                  {color.hex && (
                    <span
                      className="h-4 w-4 rounded-full border border-sand/60"
                      style={{ backgroundColor: color.hex }}
                    />
                  )}
                  <span className="text-sm">{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {needsSize && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">
              Size{selectedSize ? ` — ${selectedSize}` : ""}
            </p>
            <Link
              href="/help/how-do-i-find-my-size"
              className="text-xs font-medium text-slate underline-offset-2 hover:text-ink hover:underline"
            >
              Size guide
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizeOptions.map((size, index) => {
              const isSelected = size === selectedSize;
              return (
                <button
                  key={`${size}-${index}`}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={isSelected}
                  className={`min-w-11 rounded-md border px-3 py-1.5 text-sm transition ${
                    isSelected
                      ? "border-ink bg-ink text-surface"
                      : "border-sand bg-surface text-ink hover:border-ink"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          {needsSize && !selectedSize && (
            <p className="mt-1.5 text-xs text-slate">Select a size to continue.</p>
          )}
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-ink">Quantity</p>
        <div className="mt-2 inline-flex items-center rounded-md border border-sand">
          <button
            type="button"
            onClick={decrement}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-10 w-10 items-center justify-center text-lg text-ink transition hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
          >
            &minus;
          </button>
          <span
            className="flex h-10 w-10 items-center justify-center text-sm font-medium text-ink"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={increment}
            disabled={quantity >= 10}
            aria-label="Increase quantity"
            className="flex h-10 w-10 items-center justify-center text-lg text-ink transition hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!canAddToCart}
        className={`flex h-12 w-full items-center justify-center rounded-md text-sm font-semibold transition ${
          added
            ? "bg-success text-surface"
            : canAddToCart
              ? "bg-ink text-surface hover:bg-ink/90"
              : "cursor-not-allowed bg-sand text-slate"
        }`}
      >
        {added
          ? "Added to cart ✓"
          : inStock
            ? "Add to cart"
            : "Out of stock"}
      </button>
    </div>
  );
}
