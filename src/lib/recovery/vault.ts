/**
 * Recovery vault: a fresh 256-bit vault key encrypts the Master Key entropy
 * (AES-256-GCM, AAD bound to vault id + version); the vault key, not the
 * Master Key, is split 3-of-5. Rotating creates a new vault id and key, so
 * every old shard stops matching the stored commitments and ciphertext.
 * Runs inside the crypto enclave worker; callers wipe the entropy they pass.
 */
import { combine, split } from "./shamir";
import { SHARD_VERSION, VAULT_ID_BYTES, commitmentOf, decodeShard, encodeShard, hex, unhex } from "./shard-codec";

export const RECOVERY_THRESHOLD = 3;
export const RECOVERY_SHARDS = 5;

export type RecoveryVault = {
  vaultId: string; // hex
  version: number;
  threshold: number;
  sealedMaster: string; // base64url iv.ct
  commitments: string[]; // index-1 ordered
};

const enc = new TextEncoder();
const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const aad = (vaultId: string, version: number) => enc.encode(`rout.recovery.master.v${version}|${vaultId}`);

export async function createVault(entropy: Uint8Array): Promise<{ vault: RecoveryVault; shards: string[] }> {
  const vaultKey = crypto.getRandomValues(new Uint8Array(32));
  const vaultIdBytes = crypto.getRandomValues(new Uint8Array(VAULT_ID_BYTES));
  const vaultId = hex(vaultIdBytes);
  const shares = split(vaultKey, RECOVERY_THRESHOLD, RECOVERY_SHARDS);
  try {
    const key = await crypto.subtle.importKey("raw", vaultKey as BufferSource, "AES-GCM", false, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad(vaultId, SHARD_VERSION) as BufferSource }, key, entropy as BufferSource));
    const shards: string[] = [];
    const commitments: string[] = [];
    for (const s of shares) {
      shards.push(await encodeShard({ version: SHARD_VERSION, threshold: RECOVERY_THRESHOLD, index: s.x, vaultId: vaultIdBytes, share: s.y }));
      commitments.push(await commitmentOf(vaultIdBytes, s.x, s.y));
    }
    return { vault: { vaultId, version: SHARD_VERSION, threshold: RECOVERY_THRESHOLD, sealedMaster: `${b64u(iv)}.${b64u(ct)}`, commitments }, shards };
  } finally {
    vaultKey.fill(0);
    for (const s of shares) s.y.fill(0);
  }
}

export type ShardCheck = { index: number; ok: boolean; reason?: "wrong_vault" | "forged" | "duplicate" | "unreadable" };

/** Validates one typed/scanned shard against the vault without reconstructing anything. */
export async function checkShard(text: string, vault: RecoveryVault): Promise<ShardCheck> {
  let s;
  try { s = await decodeShard(text); } catch { return { index: 0, ok: false, reason: "unreadable" }; }
  try {
    if (hex(s.vaultId) !== vault.vaultId) return { index: s.index, ok: false, reason: "wrong_vault" };
    const expected = vault.commitments[s.index - 1];
    const ok = expected !== undefined && (await commitmentOf(s.vaultId, s.index, s.share)) === expected;
    return ok ? { index: s.index, ok: true } : { index: s.index, ok: false, reason: "forged" };
  } finally {
    s.share.fill(0);
  }
}

/** Reconstructs the Master Key entropy. Throws unless `threshold` valid, distinct shards are given. */
export async function openVault(texts: string[], vault: RecoveryVault): Promise<Uint8Array> {
  const vaultIdBytes = unhex(vault.vaultId);
  const seen = new Map<number, Uint8Array>();
  try {
    for (const t of texts) {
      const s = await decodeShard(t);
      if (hex(s.vaultId) !== vault.vaultId) throw new Error("wrong_vault");
      if ((await commitmentOf(vaultIdBytes, s.index, s.share)) !== vault.commitments[s.index - 1]) throw new Error("forged_shard");
      if (!seen.has(s.index)) seen.set(s.index, s.share); else s.share.fill(0);
    }
    if (seen.size < vault.threshold) throw new Error("not_enough_shards");
    const chosen = [...seen.entries()].slice(0, vault.threshold).map(([x, y]) => ({ x, y }));
    const vaultKey = combine(chosen);
    try {
      const key = await crypto.subtle.importKey("raw", vaultKey as BufferSource, "AES-GCM", false, ["decrypt"]);
      const [iv, ct] = vault.sealedMaster.split(".");
      try {
        return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64u(iv ?? "") as BufferSource, additionalData: aad(vault.vaultId, vault.version) as BufferSource }, key, fromB64u(ct ?? "") as BufferSource));
      } catch {
        throw new Error("decrypt_failed");
      }
    } finally {
      vaultKey.fill(0);
    }
  } finally {
    for (const y of seen.values()) y.fill(0);
  }
}
