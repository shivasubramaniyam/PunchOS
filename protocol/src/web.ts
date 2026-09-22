/**
 * Browser-only extensions: WebCrypto key generation and punch signing.
 *
 * The punch key is generated with `extractable: false`. On supporting
 * platforms the key material is generated and used inside the device's
 * TEE / StrongBox / Secure Enclave and can never be exported — the
 * hardware root of trust for this protocol.
 */

import { PUNCH_VERSION, b64urlEncode, currentSlot, payloadToQrText, slotRemainingMs, type PunchHeader, type PunchPayload, type PunchQr } from "./core";

export interface GeneratedPunchKey {
  keyPair: CryptoKeyPair;
  /** SPKI public key in raw EC point form, for exporting as JWK. */
  publicJwk: JsonWebKey;
}

/** Generate a non-extractable ECDSA P-256 punch key in the browser. */
export async function generatePunchKey(): Promise<GeneratedPunchKey> {
  const keyPair = (await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false, // extractable: false — the crux of the hardware binding
    ["sign", "verify"]
  )) as CryptoKeyPair;
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  return { keyPair, publicJwk };
}

/** Export the public half as a storable JSON JWK (b64url coords). */
export async function exportPublicJwk(keyPair: CryptoKeyPair): Promise<PunchJwkLite> {
  const jwk = (await crypto.subtle.exportKey("jwk", keyPair.publicKey)) as JsonWebKey & {
    x: string;
    y: string;
  };
  return { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y };
}

export interface PunchJwkLite {
  kty: "EC";
  crv: "P-256";
  x: string;
  y: string;
}

/**
 * Sign the current punch slot with the device-bound key and return the
 * QR text. The private key is non-extractable; this function only ever
 * hands the signed JWS to the caller.
 */
export async function signCurrentPunch(
  keyPair: CryptoKeyPair,
  opts: { kid: string; sid: string; now?: number; nonce?: Uint8Array }
): Promise<PunchQr> {
  const now = opts.now ?? Date.now();
  const slot = currentSlot(now);
  const nonce = b64urlEncode(
    opts.nonce ?? crypto.getRandomValues(new Uint8Array(8))
  );
  const payload: PunchPayload = {
    v: PUNCH_VERSION,
    kid: opts.kid,
    sid: opts.sid,
    slot,
    nonce,
    iat: Math.floor(now / 1000),
  };
  const header: PunchHeader = { alg: "ES256", typ: "punch.v1+JWS" };
  const headB64 = b64urlEncode(JSON.stringify(header));
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const signingInput = `${headB64}.${payloadB64}`;

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    keyPair.privateKey,
    new TextEncoder().encode(signingInput)
  );
  const raw = new Uint8Array(sig); // WebCrypto returns raw P||S (64 bytes)
  // JWS ES256 signature is ONE b64url segment over the full 64-byte P||S.
  const jws = `${signingInput}.${b64urlEncode(raw)}`;
  return {
    qr: payloadToQrText(jws),
    payload,
    slot,
    expiresIn: slotRemainingMs(now) / 1000,
  };
}
