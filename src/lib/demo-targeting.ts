import { cookies } from "next/headers";
import {
  DEMO_SESSION_COOKIE,
  decodeDemoSession,
  type DemoSessionAttributes,
} from "@/lib/demo-session";

/**
 * ENTERPRISE PATTERN: TARGETING
 *
 * This is where per-visitor custom attributes (customerTier, lifecycleStage,
 * hasProAccount, market, ...) are read out of the request and shaped into
 * the object Builder's `userAttributes` fetch option expects. Two read paths
 * exist, deliberately, for two different situations:
 *
 *   1. `getDemoUserAttributes()` below reads the cookie directly via
 *      `next/headers`'s `cookies()`. This is only safe to call from a route
 *      that's *already* dynamic (reading `cookies()` forces that, by Next's
 *      own rule) — `src/app/demo-switcher/page.tsx` is exactly that kind of
 *      route, since it needs to read the active segment to render the
 *      "Active" badge regardless of targeting.
 *   2. `src/middleware.ts` reads the same cookie at the edge on *every*
 *      request (including ones bound for statically-cached ISR routes) and
 *      forwards the attributes as `x-fn-*` request headers, so a route that
 *      wants them without itself becoming fully dynamic has that option
 *      available via `headers()` — though reading `headers()` carries the
 *      same dynamic-rendering cost as `cookies()` does. There is no way to
 *      read per-request personalization data in a Server Component for free;
 *      the choice is always which specific routes accept that cost.
 *
 * Deliberately NOT wired into the homepage's own fetch (`src/app/page.tsx`)
 * — see that file's caching comment block for exactly why turning `/` itself
 * dynamic to support this would be the wrong trade at this route's traffic
 * level.
 */
export const DEMO_TARGETING_COOKIE = DEMO_SESSION_COOKIE;

export interface DemoSegment {
  id: string;
  label: string;
  description: string;
  attributes: DemoSessionAttributes;
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

export async function getDemoUserAttributes(): Promise<DemoSessionAttributes> {
  const store = await cookies();
  return decodeDemoSession(store.get(DEMO_SESSION_COOKIE)?.value);
}
