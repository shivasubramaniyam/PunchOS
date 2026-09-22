/**
 * Node-only extensions: ES256 signing/verification over `node:crypto`,
 * used by tests, CLIs, and server-side tooling. The browser uses
 * `web.ts` (WebCrypto) instead.
 */

import { createHash, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { randomBytes as nodeRandomBytes } from "node:crypto";

import {
  PUNCH_VERSION,
  b64urlDecode,
  b64urlEncode,
  bytesToHex,
  currentSlot,
  decodePunchQr,
  payloadToQrText,
  slotRemainingMs,
  type PunchHeader,
  type PunchJwk,
  type PunchPayload,
  type PunchQr,
} from "./core";

function derToRaw(der: Buffer): Uint8Array {
  let pos = 2; // skip 0x30 + total length
  const rLen = der[pos + 1];
  const r = der.subarray(pos + 2, pos + 2 + rLen);
  pos += 2 + rLen;
  const sLen = der[pos + 1];
  const s = der.subarray(pos + 2, pos + 2 + sLen);
  const pad = (v: Buffer): Uint8Array => {
    const out = new Uint8Array(32);
    const start = 32 - Math.min(v.length, 32);
    out.set(v.length > 32 ? v.subarray(v.length - 32) : v, start);
    return out;
  };
  const out = new Uint8Array(64);
  out.set(pad(r), 0);
  out.set(pad(s), 32);
  return out;
}

function rawToDer(raw: Uint8Array): Buffer {
  if (raw.length !== 64) throw new Error("raw ECDSA signature must be 64 bytes");
  const derInt = (v: Uint8Array): Buffer => {
    let start = 0;
    while (start < v.length - 1 && v[start] === 0x00) start++;
    let body = Buffer.from(v.slice(start));
    if (body[0] & 0x80) body = Buffer.concat([Buffer.from([0x00]), body]);
    return Buffer.concat([Buffer.from([0x02, body.length]), body]);
  };
  const body = Buffer.concat([derInt(raw.slice(0, 32)), derInt(raw.slice(32))]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

/**
 * Encode + sign a payload into a full punch QR string (Node).
 * Accepts a JWK with b64url coords (+ optional private `d`).
 */
export function makePunchQr(
  privateKeyJwk: PunchJwk,
  opts: { kid: string; sid: string; now?: number; nonce?: string }
): PunchQr {
  const now = opts.now ?? Date.now();
  const slot = currentSlot(now);
  const payload: PunchPayload = {
    v: PUNCH_VERSION,
    kid: opts.kid,
    sid: opts.sid,
    slot,
    nonce: opts.nonce ?? b64urlEncode(nodeRandomBytes(8)),
    iat: Math.floor(now / 1000),
  };
  const header: PunchHeader = { alg: "ES256", typ: "punch.v1+JWS" };
  const headB64 = b64urlEncode(JSON.stringify(header));
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const signingInput = `${headB64}.${payloadB64}`;

  const priv = createPrivateKey({
    key: { kty: "EC", crv: "P-256", x: privateKeyJwk.x, y: privateKeyJwk.y, d: privateKeyJwk.d! },
    format: "jwk",
  });
  const sig = sign(null, Buffer.from(signingInput), priv); // DER
  const raw = derToRaw(sig);
  // JWS ES256 signature is ONE b64url segment over the full 64-byte P||S.
  const jws = `${signingInput}.${b64urlEncode(raw)}`;
  return { qr: payloadToQrText(jws), payload, slot, expiresIn: slotRemainingMs(now) / 1000 };
}

/** Verify a compact punch JWS against a public JWK. Returns the payload. */
export function verifyPunchJws(jws: string, publicJwk: PunchJwk): PunchPayload {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Error("malformed JWS");
  const [headB64, payloadB64, sigB64] = parts;
  const signingInput = `${headB64}.${payloadB64}`;

  const payload = decodePunchQr(payloadToQrText(jws)); // header + version checks

  const sigRaw = b64urlDecode(sigB64);
  const der = rawToDer(sigRaw);
  const pub = createPublicKey({
    key: { kty: "EC", crv: "P-256", x: publicJwk.x, y: publicJwk.y },
    format: "jwk",
  });
  const ok = verify(null, Buffer.from(signingInput), pub, der);
  if (!ok) throw new Error("signature verification failed");
  return payload;
}

/** kid = b64url(sha256("punch-p256:" || x || ":" || y)) — must match Django. */
export function keyIdFromJwk(publicJwk: PunchJwk): string {
  const x = b64urlDecode(publicJwk.x);
  const y = b64urlDecode(publicJwk.y);
  const hash = createHash("sha256")
    .update("punch-p256:")
    .update(x)
    .update(":")
    .update(y)
    .digest();
  return b64urlEncode(new Uint8Array(hash));
}

export { bytesToHex };
