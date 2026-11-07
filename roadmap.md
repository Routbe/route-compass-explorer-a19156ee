# Repository import

## Current request (7 Nov 2026): 1:1 import into this project, full read-through, then Neon

- [x] Byte-compare the GitHub repository with this project; restore unintended differences.
- [x] Read through all code, content and texts to understand the structure (420 routes, 1,118 lib files, 528 components, 217 content files, 4,005 translation keys with full parity, 200+ migrations).
- [ ] Link the Neon database only after the read-through.
- [ ] Verify the runtime role check and a database-backed page without changing records or permissions.

## Current request: exact import, then Neon

- [x] Compare all imported application source and assets with the supplied repository.
- [x] Restore any unintended differences and verify ROUT's public experience.
- [x] Link Neon only after the source-import verification passes.
- [x] Verify existing Neon compatibility without changing records or permissions.

- [x] Import ROUT source, assets, and required dependencies while preserving project metadata.
- [x] Verify the home page, navigation, QR workflow, and phone layout.
- [x] Run focused source tests and inspect automatic build diagnostics.
- [x] Document unconfigured accounts, data, and connected services.

## Current request: isolated browser cryptography

### Follow-up: correctness review and remaining hardening

- [x] Re-audit worker execution, secret-buffer ownership, expiry and account/UI lifecycle.
- [x] Fix verified memory, queue timeout, account-switch, stale UI completion and passkey cancellation gaps while preserving ciphertext and account behavior.
- [x] Expand to 83 behavioral tests; rerun Chromium cryptography, independently encrypted vault round trip, cancellation and restart with the UI crypto API disabled.
- [x] Recheck successful automatic build/type diagnostics and confirm production/auth verification blockers remain external.

- [x] Audit client cryptography and preserve ciphertext/storage compatibility.
- [x] Harden the existing dedicated worker, remove main-thread hash fallback and keep PRF bytes out of React.
- [x] Overwrite owned sensitive byte buffers on success and failure; document browser limitations.
- [x] Run 57 focused tests; verify real Chromium encryption, transfers, signing/tamper rejection and worker restart with zero main-thread SubtleCrypto calls.
- [x] Inspect successful automatic build/type diagnostics and verify development main-thread module separation.
- [ ] Compare minified production bundle sizes: blocked by absent comparable baseline/artifacts; development-served module bytes are not a production measurement.
- [ ] Verify authenticated ciphertext writes/readback in Neon: blocked by original ROUT account/signing configuration; browser-local encryption is verified, no database records changed.

## Previously identified external blockers

- [ ] Original account and private-data flows: Neon is linked and its runtime role checks pass; original signing keys, account configuration, and authenticated end-to-end checks remain required.
- [ ] Payment, email, OAuth, storage, and scheduled services: require provider configuration and end-to-end checks.

## Superseded request: Stealth Brutalism landing page (rolled back by correction)

- [x] Scope crisp borders, hard 4px shadows and mechanical action states to the public gateway only, including shared portals and preview controls.
- [x] Preserve the monospace terminal, ROUT typography, page content and existing navigation; remove conflicting hero scale-on-press animation.
- [x] Verify zero diffuse shadows/filters, exact 4px active displacement, QR changes, menu/dialogs, sign-in navigation and 1280/810/390px layouts in Chromium; 18 existing tests and automatic build checks pass.

## Current request: restore public login options and Google Wallet design

- [x] Compare original provider catalog and restore all seven public sign-in choices; preserve readiness checks, linked subjects, one-time sessions and 2FA.
- [x] Diagnose Google Wallet routes and existing-pass REST updates: logo route already works; official GenericObject schema confirms existing background field is correct, not a class field. Existing design/sync regression tests pass.
- [ ] Complete real Google Wallet saved-pass design delivery and OAuth sign-in: blocked by original account/provider credentials and access to a real saved pass/device; no new accounts or credentials substituted.

## Correction: homepage rollback and internal interface engine

- [x] Restore the original Gateway file byte-for-byte and remove all Stealth CSS while retaining auth restoration.
- [x] Add internal-only Sovereign (default) and Creator material variables, root attributes and persisted, live Settings/Aanpassen controls; artwork excluded.
- [x] Verify original globe and blur, QR workflow/download, exact 4px press, no internal diffuse effects, Creator persistence and 1280/810/390px layouts in Chromium; policy/lifecycle/auth/Wallet tests and automatic build pass.
- [ ] Verify signed-in Command Center, profile Studio, Analytics and Settings with real account data: blocked by original ROUT account/signing configuration; public QR Studio and its actual theme controls verified.
## Current request: Mechanical Elegance + Glass engine (approved plan, 7 Nov 2026)

- [x] Reproduce loading jump: stored material and colour mode applied only after hydration (seconds in dev).
- [ ] Preferences known before first paint (cookie for server render + head boot script); no attribute removal on re-render.
- [ ] Mechanical (default): pill actions, 16px hairline surfaces without shadows, ghost icon buttons, 2px action shadow with exact 2px press, dark-mode counterpart.
- [ ] Glass: original imported cascade untouched; legacy sovereign/creator choices mapped.
- [ ] "Weergave" section first on account settings with live preview cards; compact switch in menus.
- [ ] Dev-only material lab for signed-out visual verification; tests; Chromium verification; homepage unchanged.
- [ ] Account-level sync of the choice: blocked by original ROUT sign-in configuration (device + cookie works now).

## Current request: Google Wallet ROUT Card as Loyalty pass (7 Nov 2026)

- [x] Check Google's official Loyalty spec: tile colour and logo exist only on the shared class (LoyaltyClass), not per card (LoyaltyObject).
- [x] Owner chose one Loyalty class per tile colour so every member keeps their own colour.
- [x] Switch save link + existing-pass refresh from generic to loyalty class/object.
- [x] Handle in the main card line, long security texts only in the detail section.
- [x] Logo 660x660 / 17.5% padding and hero 1032x812 kept; image responses get open access + one-year immutable caching.
- [x] Tests for the new payload (124 Wallet tests pass).
- [ ] Real saved pass on a phone: blocked by missing Google Wallet issuer/service-account keys in this project.

## Current request: 3-card Wallet compartmentalisation + APDU engine (7 Nov 2026)

- [x] Three separate export cards (Public Node, Stealth/Alias, Sovereign Key) with hard block shadows; key card black with heavier ledge and warning.
- [x] Pass types and payloads: key has Smart Tap / Apple VAS NFC token, no QR and no profile data; profile cards never carry NFC.
- [x] ISO 7816-4 APDU codec + key session (SELECT AID, GET CHALLENGE, INTERNAL AUTHENTICATE, replay refusal) with tests.
- [x] Signed-out visual check of the three cards in light and dark mode.
- [ ] Sovereign Key issuance: blocked by Google Smart Tap approval (redemption issuer + collector keys) and Apple NFC pass entitlement.
- [ ] Real NFC taps: browsers cannot emulate a card; needs a native Android app (HCE) and a reader endpoint.
- [ ] Samsung Wallet: needs a Samsung Wallet partner account.
- [ ] Rotating Aztec code for the alias card: needs Google rotating-barcode (TOTP) setup.
- [ ] Owner view of the export inside the ROUT Card screen: blocked by sign-in keys (BETTER_AUTH_SECRET).


## Current request: keys, sharing, ask page, wallet card, identity layer (7 Nov 2026)

- [x] Mobile check: buttons must never stick out of rounded button groups/frames (signed-out pages scanned at 390px; signed-in pages blocked by missing sign-in keys).
- [x] Mechanical: high-end keycaps (depth, shadow, press), still calm, rounded, strong colours.
- [x] Move the Mechanical/Glass switch out of the menus into Account & Beveiliging.
- [x] "Wat wil je delen": official Snapchat, Instagram and WhatsApp logos.
- [x] Sharing pre-fills the link (Snapchat attachment, WhatsApp text; Instagram copies the link).
- [x] Dedicated anonymous-question page with nothing else on it.
- [x] ROUT card appears in one go, never first without its design.
- [x] Wallet: ROUT card first (NFC, freeze/block, physical order later); "Profielkaart" shows profile-hub cards.
- [ ] Live 4-digit codes and secure back link on a real account: blocked by missing CARD_LIVENESS_SECRET and sign-in keys.
- [x] Card front: big QR rout.be/<user>/<4 digits changing every 10 min>; back: small QR + NFC with a very long secret link.
- [ ] Identity layer: SUPREME (server router) and OMEGA (no server mapping, client ZK proofs) contradict each other; needs owner choice.
- [ ] Identity uploads (PRF derivation + E2EE of birth date/names + ZK/VC, decoupled tables; Shamir recovery vault, service-worker integrity, OHTTP): needs owner decision — encrypting birth dates breaks the server-side minor/parent-consent checks, and a service worker cannot protect against a server that serves a changed worker.
