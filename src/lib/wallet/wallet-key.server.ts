/**
 * Sovereign Key material (server-only). Everything is HMAC(WALLET_ID_SECRET) over
 * the account id with its own label, so the key's serial and token can neither be
 * computed from, nor linked to, the member's root or alias card numbers.
 * Without a strong secret there is no key pass at all (fails closed).
 */
import type { WalletKeyPayload } from "./wallet-key";

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function mac(secret: string, label: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(label)));
}

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

/** Builds the key for one account; `now` makes every issue/sync carry a fresh token. */
export async function walletKeyPayload(accountId: string, secret: string | undefined, now = Date.now()): Promise<WalletKeyPayload | null> {
  if (!secret || secret.length < 32 || !accountId) return null;
  const id = hex(await mac(secret, `rout-key:v1:id:${accountId}`)).slice(0, 16);
  const issued = Math.floor(now / 1000).toString(36);
  const sig = b64url(await mac(secret, `rout-key:v1:tap:${id}:${issued}`)).slice(0, 27);
  return { serial: `key_${id}`, token: `rk1.${id}.${issued}.${sig}`, label: id.slice(-4).toUpperCase() };
}

/** Constant-time check of a token presented by a reader (for the future reader endpoint). */
export async function verifyWalletKeyToken(token: string, secret: string | undefined): Promise<{ ok: true; keyId: string; issuedAt: number } | { ok: false }> {
  const m = /^rk1\.([0-9a-f]{16})\.([0-9a-z]{1,10})\.([A-Za-z0-9_-]{27})$/.exec(token);
  if (!m || !secret || secret.length < 32) return { ok: false };
  const expected = b64url(await mac(secret, `rout-key:v1:tap:${m[1]}:${m[2]}`)).slice(0, 27);
  let diff = 0;
  for (let i = 0; i < 27; i++) diff |= expected.charCodeAt(i) ^ m[3]!.charCodeAt(i);
  return diff === 0 ? { ok: true, keyId: m[1]!, issuedAt: parseInt(m[2]!, 36) * 1000 } : { ok: false };
}
