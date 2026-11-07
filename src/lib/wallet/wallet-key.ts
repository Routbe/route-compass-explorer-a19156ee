/**
 * Wallet compartmentalisation: three separate passes per member (pure, browser-safe).
 *
 *  PUBLIC_PROFILE  root ROUT Card: QR to the public profile hub, no NFC.
 *  STEALTH         alias ROUT Card: QR to the private alias (/u/<handle>), no NFC.
 *  SMART_TAP_KEY   Sovereign Key: no QR and no public profile data at all; an NFC
 *                  token for Google Smart Tap / Apple VAS readers only.
 *
 * The key pass never carries a handle, name, profile URL or card number, so a
 * photographed or shoulder-surfed key reveals nothing about the profile, and a
 * profile card never carries an NFC token.
 */
import { createLocalizedString } from "./wallet-i18n";
import type { GoogleCardClaims, GoogleLoyaltyClass, GoogleLoyaltyObject } from "./google-pass-types";

export type WalletPassType = "PUBLIC_PROFILE" | "STEALTH" | "SMART_TAP_KEY";
export const WALLET_PASS_TYPES: readonly WalletPassType[] = ["PUBLIC_PROFILE", "STEALTH", "SMART_TAP_KEY"];

/** Which profile namespace a QR pass shows; the key pass has none. */
export function passTypeSpace(type: WalletPassType): "root" | "alias" | null {
  return type === "PUBLIC_PROFILE" ? "root" : type === "STEALTH" ? "alias" : null;
}

/** Only the key pass may transmit over NFC; only profile passes may show a QR. */
export const PASS_TYPE_RULES: Record<WalletPassType, { qr: boolean; nfc: boolean }> = {
  PUBLIC_PROFILE: { qr: true, nfc: false },
  STEALTH: { qr: true, nfc: false },
  SMART_TAP_KEY: { qr: false, nfc: true },
};

type Env = Record<string, string | undefined>;

/** Google Smart Tap needs a redemption issuer (with collector keys) approved by Google. */
export function smartTapConfig(env: Env): { redemptionIssuerId: string } | null {
  const id = env["GOOGLE_WALLET_SMART_TAP_ISSUER_ID"]?.trim() ?? "";
  return /^[0-9]{6,25}$/.test(id) ? { redemptionIssuerId: id } : null;
}

/** Apple VAS needs Apple's NFC pass entitlement and the reader's P-256 public key (base64 DER). */
export function appleNfcConfig(env: Env): { encryptionPublicKey: string } | null {
  const key = env["APPLE_WALLET_NFC_PUBLIC_KEY"]?.trim() ?? "";
  return /^[A-Za-z0-9+/]{80,200}={0,2}$/.test(key) ? { encryptionPublicKey: key } : null;
}

/** Server-derived key material; see wallet-key.server.ts. Unlinkable to the profile cards. */
export type WalletKeyPayload = {
  /** Object/serial suffix, keyed per member, never the account id or card number. */
  serial: string;
  /** NFC token: `rk1.<key id>.<issued>.<mac>`, re-issued on every save, ≤ 64 bytes for Apple VAS. */
  token: string;
  /** Last four characters of the key id, for the member to recognise their key. */
  label: string;
};

export const KEY_TILE = "#0a0a0a";
const same = (value: string) => createLocalizedString({ nl: value, en: value, fr: value, de: value });
const text = (nl: string, en: string, fr: string, de: string) => createLocalizedString({ nl, en, fr, de });

export function googleKeyClass(issuerId: string, smartTap: { redemptionIssuerId: string }, logoUrl: string): GoogleLoyaltyClass {
  return {
    id: `${issuerId}.rout_sovereign_key`,
    issuerName: "ROUT",
    programName: "ROUT Sovereign Key",
    programLogo: { sourceUri: { uri: logoUrl }, contentDescription: same("ROUT") },
    hexBackgroundColor: KEY_TILE,
    reviewStatus: "UNDER_REVIEW",
    localizedAccountNameLabel: text("Type", "Type", "Type", "Typ"),
    localizedAccountIdLabel: text("Sleutel", "Key", "Clé", "Schlüssel"),
    enableSmartTap: true,
    redemptionIssuers: [smartTap.redemptionIssuerId],
    classTemplateInfo: { cardTemplateOverride: { cardRowTemplateInfos: [
      { oneItem: { item: { firstValue: { fields: [{ fieldPath: "object.accountName" }] } } } },
      { oneItem: { item: { firstValue: { fields: [{ fieldPath: "object.accountId" }] } } } },
    ] } },
  };
}

/** Key object: no barcode, no handle, no profile link; the token travels only over NFC. */
export function googleKeyObject(key: WalletKeyPayload, issuerId: string): GoogleLoyaltyObject {
  return {
    id: `${issuerId}.${key.serial}`,
    classId: `${issuerId}.rout_sovereign_key`,
    state: "ACTIVE",
    accountName: "NFC · Hardware key",
    accountId: `•••• ${key.label}`,
    smartTapRedemptionValue: key.token,
    textModulesData: [
      { id: "key", localizedHeader: text("Hardwaresleutel", "Hardware key", "Clé matérielle", "Hardware-Schlüssel"), localizedBody: text(
        "Deze pas toont geen QR-code en geen profielgegevens. Hij werkt alleen door je telefoon tegen een goedgekeurde ROUT-lezer te houden.",
        "This pass shows no QR code and no profile data. It only works by holding your phone to an approved ROUT reader.",
        "Ce pass n’affiche ni QR code ni données de profil. Il ne fonctionne qu’en approchant votre téléphone d’un lecteur ROUT agréé.",
        "Dieser Pass zeigt keinen QR-Code und keine Profildaten. Er funktioniert nur, wenn du dein Telefon an ein zugelassenes ROUT-Lesegerät hältst.",
      ) },
      { id: "separate", localizedHeader: text("Gescheiden van je profiel", "Separate from your profile", "Séparé de votre profil", "Getrennt von deinem Profil"), localizedBody: text(
        "Je openbare ROUT Card en deze sleutel zijn bewust twee passen. Wie je profielkaart ziet of scant, krijgt nooit je sleutel.",
        "Your public ROUT Card and this key are deliberately two passes. Anyone who sees or scans your profile card never gets your key.",
        "Votre ROUT Card publique et cette clé sont volontairement deux pass. Voir ou scanner votre carte de profil ne donne jamais votre clé.",
        "Deine öffentliche ROUT Card und dieser Schlüssel sind bewusst zwei Pässe. Wer deine Profilkarte sieht oder scannt, erhält nie deinen Schlüssel.",
      ) },
    ],
  };
}

export function googleKeySaveClaims(key: WalletKeyPayload, cfg: { issuerId: string; serviceAccountEmail: string; origins: string[]; logoUrl: string; smartTap: { redemptionIssuerId: string } }): GoogleCardClaims {
  return {
    iss: cfg.serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    origins: cfg.origins,
    payload: { loyaltyClasses: [googleKeyClass(cfg.issuerId, cfg.smartTap, cfg.logoUrl)], loyaltyObjects: [googleKeyObject(key, cfg.issuerId)] },
  };
}

/** Apple pass.json for the key: VAS `nfc` dictionary, deliberately no `barcodes`. */
export function appleKeyPassJson(key: WalletKeyPayload, cfg: { passTypeId: string; teamId: string }, nfc: { encryptionPublicKey: string }) {
  return {
    formatVersion: 1,
    passTypeIdentifier: cfg.passTypeId,
    teamIdentifier: cfg.teamId,
    serialNumber: key.serial,
    organizationName: "ROUT",
    description: "ROUT Sovereign Key",
    logoText: "ROUT",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(10, 10, 10)",
    labelColor: "rgb(160, 160, 160)",
    nfc: { message: key.token, encryptionPublicKey: nfc.encryptionPublicKey, requiresAuthentication: true },
    storeCard: {
      primaryFields: [{ key: "type", label: "SOVEREIGN KEY", value: "NFC" }],
      secondaryFields: [{ key: "key", label: "SLEUTEL", value: `•••• ${key.label}` }],
      backFields: [{ key: "about", label: "Over", value: "Geen QR-code en geen profielgegevens. Werkt alleen tegen een goedgekeurde ROUT-lezer." }],
    },
  };
}
