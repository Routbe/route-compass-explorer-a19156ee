import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Blind verifier for the payment/access QR on the back of the ROUT Card.
 * Accepts only `rout:access:<token>`; any web or profile URL gets 403.
 * Returns validity only, never names, e-mail or profile data.
 */
const Body = z.object({ payload: z.string().min(1).max(700) });
const json = (b: unknown, status = 200) => Response.json(b, { status, headers: { "cache-control": "no-store" } });

export const Route = createFileRoute("/api_/access/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { hitRateLimit, clientIp } = await import("@/lib/rate-limit-db.server");
        const limit = await hitRateLimit("access-verify", clientIp(request), { limit: 30, windowSec: 60 }, { failClosed: true });
        if (!limit.ok) return json({ valid: false, error: "limited" }, 429);
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ valid: false, error: "bad_request" }, 400);
        const { parseAccessPayload } = await import("@/lib/wallet/card-token");
        const p = parseAccessPayload(parsed.data.payload);
        if (!p.ok) return json({ valid: false, error: p.reason }, 403);
        const { verifySecureCardTokenCore } = await import("@/lib/wallet/card-verify.server");
        const v = await verifySecureCardTokenCore(p.token);
        if (v.status !== "valid") return json({ valid: false, error: v.status }, 403);
        return json({ valid: true, replay_protected: true });
      },
    },
  },
});
