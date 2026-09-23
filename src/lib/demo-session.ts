import { createHmac, timingSafeEqual } from "crypto";

/**
 * ENTERPRISE PATTERN: REAL CUSTOMER SEGMENT / TIER SIMULATION
 *
 * This is a legitimate lightweight approach for anonymous/session-based
 * personalization — the shape a huge number of real Builder customers
 * actually run in production for visitors who haven't logged in (and often
 * even for logged-in visitors, as a fast first pass before a slower identity
 * lookup resolves). The full loop is:
 *
 *   1. `src/app/api/demo-session/route.ts` (POST) signs a small attribute
 *      payload (customerTier, lifecycleStage, hasProAccount, market) with an
 *      HMAC and sets it as an httpOnly cookie.
 *   2. `src/middleware.ts` runs on every request, verifies that signature,
 *      and forwards the attributes as request headers so Server Components
 *      downstream can read them without re-parsing or re-verifying a cookie.
 *   3. `src/lib/demo-targeting.ts` reads the same cookie directly (for pages
 *      that are already dynamic, like `/demo-switcher`) and shapes those
 *      attributes into the `userAttributes` object passed to
 *      `fetchOneEntry`/`fetchEntries`, so Builder's own targeting engine
 *      resolves the right variation server-side.
 *
 * WHY SIGN THE COOKIE AT ALL
 * An unsigned cookie is just a suggestion — any visitor can open devtools
 * and set `hasProAccount=true` or `customerTier=vip` on themselves. For a
 * pure marketing-content demo that might be an acceptable risk; the moment
 * targeting attributes gate something that matters (trade pricing
 * visibility, a regulated disclosure variant, a discount), an org needs the
 * server to trust that the attribute actually came from its own
 * previously-issued session, not from a visitor editing their own cookie.
 * HMAC-signing with a server-only secret gives you that: `decodeDemoSession`
 * rejects any payload whose signature doesn't match, so a tampered cookie is
 * treated as if it were empty, not as free-form untrusted input.
 *
 * THE REAL EXTENSION POINT: SWAPPING THIS FOR A CDP / IDENTITY SERVICE
 * This whole file simulates what a real org would get from a Customer Data
 * Platform (Segment, mParticle) or its own customer database. The
 * boundary is deliberately narrow — everything downstream of this module
 * only ever consumes a `DemoSessionAttributes` object, never a cookie
 * directly — so swapping the source is a one-function change:
 *
 *   // Real implementation, same call shape:
 *   async function resolveCustomerAttributes(
 *     request: NextRequest,
 *   ): Promise<DemoSessionAttributes> {
 *     const identityId = request.cookies.get("segment_anonymous_id")?.value
 *       ?? request.headers.get("x-customer-id");
 *     if (!identityId) return {};
 *     // Real call: a CDP profile API, an internal customer-360 service, etc.
 *     const profile = await segmentProfileApi.traits(identityId);
 *     return {
 *       customerTier: profile.traits.tier,
 *       lifecycleStage: profile.traits.lifecycleStage,
 *       hasProAccount: profile.traits.accountType === "pro",
 *       market: profile.traits.market,
 *     };
 *   }
 *
 * That function would replace `decodeDemoSession(cookie)` in
 * `src/middleware.ts` and `src/lib/demo-targeting.ts`; a real integration
 * would likely also cache the profile lookup (Redis, an edge KV store) since
 * middleware runs on every single request and a CDP API call on every
 * request would add real latency at scale — this cookie-based approach is
 * partly popular specifically because it avoids that per-request network
 * call for the common case.
 */

export const DEMO_SESSION_COOKIE = "fn_demo_session";

export interface DemoSessionAttributes {
  customerTier?: string;
  lifecycleStage?: string;
  hasProAccount?: boolean;
  market?: string;
  campaignSource?: string;
  device?: string;
}

// A real deployment sets DEMO_SESSION_SECRET via the platform's secret
// manager (Vercel env vars, etc.) — never commit a real secret. The
// fallback here exists only so local dev/demo works out of the box; it's
// intentionally obviously-not-production ("do-not-use-in-prod" in the
// value itself) rather than silently insecure-by-default.
const SECRET =
  process.env.DEMO_SESSION_SECRET ?? "fieldnote-demo-session-dev-secret-do-not-use-in-prod";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function encodeDemoSession(attributes: DemoSessionAttributes): string {
  const payload = Buffer.from(JSON.stringify(attributes)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/**
 * Verifies the HMAC signature before trusting anything in the cookie.
 * `timingSafeEqual` (rather than `===`) avoids leaking the valid signature
 * one byte at a time via response-time differences — a standard precaution
 * for any signature comparison, even in a demo like this one.
 */
export function decodeDemoSession(cookieValue: string | undefined | null): DemoSessionAttributes {
  if (!cookieValue) return {};

  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return {};

  const expected = sign(payload);
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) {
    return {};
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
