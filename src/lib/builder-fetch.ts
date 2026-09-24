/**
 * Next.js 16's instrumented `fetch` hands back the raw gzip bytes of a
 * compressed response while dropping the `content-encoding` header, so the
 * SDK's `response.json()` throws `SyntaxError: Unexpected token` and every
 * Builder fetch fails soft to empty content. Verified against this Next.js
 * version by comparing `globalThis.fetch` (patched: gzip magic `1f 8b` in the
 * body, no `content-encoding`) with plain Node's `fetch` (correctly decoded).
 *
 * Asking the CDN for an uncompressed body sidesteps it. That costs bandwidth,
 * so it is scoped to non-production: Vercel's production runtime decodes
 * correctly today (confirmed against the deployed site), and this must not
 * silently disable compression there. `undefined` makes the SDK use the
 * global `fetch`, so production behaviour is byte-for-byte unchanged.
 *
 * Re-test after any Next.js upgrade; delete this once it decodes correctly.
 */
type BuilderFetch = (input: string, init?: object) => Promise<Response>;

const uncompressedFetch: BuilderFetch = (input, init) => {
  const requestInit = (init ?? {}) as RequestInit;
  return fetch(input, {
    ...requestInit,
    headers: {
      ...(requestInit.headers as Record<string, string> | undefined),
      "accept-encoding": "identity",
    },
  });
};

export const builderFetch: BuilderFetch | undefined =
  process.env.NODE_ENV === "production" ? undefined : uncompressedFetch;
