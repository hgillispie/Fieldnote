"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SEGMENTS, DEMO_TARGETING_COOKIE } from "@/lib/demo-targeting";

export async function setDemoSegment(formData: FormData) {
  const segmentId = formData.get("segmentId");
  const segment = DEMO_SEGMENTS.find((s) => s.id === segmentId);
  const store = await cookies();

  if (!segment || Object.keys(segment.attributes).length === 0) {
    store.delete(DEMO_TARGETING_COOKIE);
  } else {
    store.set(DEMO_TARGETING_COOKIE, JSON.stringify(segment.attributes), {
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }

  redirect("/");
}
