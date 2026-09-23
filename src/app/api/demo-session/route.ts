import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  encodeDemoSession,
  type DemoSessionAttributes,
} from "@/lib/demo-session";

/**
 * ENTERPRISE PATTERN: REAL CUSTOMER SEGMENT / TIER SIMULATION
 *
 * `/demo-switcher` (see `src/app/demo-switcher/PersonaButtons.tsx`) POSTs a
 * persona's attribute object here. This route signs it (see
 * `src/lib/demo-session.ts`) and sets it as an httpOnly cookie — httpOnly so
 * client JS can't read or forge it directly, only the server can issue and
 * verify it. The client then does a full page reload, which re-runs
 * `src/middleware.ts` and any dynamic route reading these attributes with
 * the new persona active.
 *
 * Posting an empty attributes object (the "Anonymous" persona) clears the
 * cookie entirely rather than setting an empty-but-signed one — there's no
 * reason to carry a session cookie at all once every attribute is reset.
 */
export async function POST(request: NextRequest) {
  const attributes = (await request.json()) as DemoSessionAttributes;
  const response = NextResponse.json({ ok: true, attributes });

  if (Object.keys(attributes).length === 0) {
    response.cookies.delete(DEMO_SESSION_COOKIE);
  } else {
    response.cookies.set(DEMO_SESSION_COOKIE, encodeDemoSession(attributes), {
      path: "/",
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}
