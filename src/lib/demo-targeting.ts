import { cookies } from "next/headers";

// Deliberately not wired into the homepage fetch yet: calling `cookies()`
// forces a route into dynamic rendering, which would knock `/` off ISR
// (`revalidate = 60`) as a side effect of this page rather than a decision
// made when Phase 6 ("pass userAttributes on every fetch") tackles it
// properly — e.g. reading the cookie only inside a Suspense-scoped slice,
// or re-fetching client-side after the static shell loads.
export const DEMO_TARGETING_COOKIE = "fn_targeting";

export interface DemoSegment {
  id: string;
  label: string;
  description: string;
  attributes: Record<string, string | boolean>;
}

// Mirrors seed spec §5's segment table. "anonymous" is the reset state —
// its empty attributes object is what a cleared cookie also resolves to,
// so it doubles as the equality check for "nothing set" below.
export const DEMO_SEGMENTS: DemoSegment[] = [
  {
    id: "anonymous",
    label: "Anonymous",
    description: "Standard homepage — the A/B control.",
    attributes: {},
  },
  {
    id: "vip",
    label: "VIP",
    description:
      "Early access hero, free expedited shipping banner, 15% member price on the PDP promo slot.",
    attributes: { customerTier: "vip" },
  },
  {
    id: "lapsed",
    label: "Lapsed",
    description: '"We saved your size" hero, a win-back offer.',
    attributes: { lifecycleStage: "lapsed" },
  },
  {
    id: "pro-account",
    label: "Pro account",
    description: "Trade pricing visible, bulk ordering CTA, Pro nav item appears.",
    attributes: { hasProAccount: true },
  },
  {
    id: "paid-social",
    label: "Paid social",
    description: "Campaign-matched hero, no nav distractions, single CTA.",
    attributes: { campaignSource: "paid-social" },
  },
  {
    id: "uae-mobile",
    label: "UAE mobile",
    description: "Arabic, RTL, AED pricing, region-appropriate imagery.",
    attributes: { market: "ae", device: "mobile" },
  },
];

export async function getDemoUserAttributes(): Promise<
  Record<string, string | boolean>
> {
  const store = await cookies();
  const raw = store.get(DEMO_TARGETING_COOKIE)?.value;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
