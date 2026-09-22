/**
 * @punch/protocol — isomorphic core: types, constants, slot math, payload
 * codec. No Node or DOM-only APIs; safe in browsers, workers, and Node.
 */

export const PUNCH_VERSION = 1;
export const PUNCH_PREFIX = "punch.v1:";
export const SLOT_SECONDS = 3;
export const NONCE_TTL_SECONDS = 600;
export const ACCEPTED_SLOTS_BACK = 1;
export const MERKLE_LEAF_PREFIX = 0x00;

// --- Types ---------------------------------------------------------------

export interface PunchHeader {
  alg: "ES256";
  typ: "punch.v1+JWS";
}

export interface PunchPayload {
  v: typeof PUNCH_VERSION;
  kid: string;
  /** Student identity, DID-style: `punch:<institution>:<roll>` */
  sid: string;
  slot: number;
  nonce: string;
  /** Issued-at unix seconds. */
  iat: number;
}

export interface PunchJwk {
  kty: "EC";
  crv: "P-256";
  x: string; // b64url
  y: string; // b64url
  d?: string; // b64url, private — never sent to the server
}

export interface PunchQr {
  qr: string;
  payload: PunchPayload;
  slot: number;
  expiresIn: number; // seconds until this slot ends
}

export interface MerkleLeaf {
  /** Enrollment record: `enroll:<roll>:<kid>` */
  type: "enroll";
  roll: string;
  kid: string;
}

export interface MerkleLeafAttendance {
  /** Attendance record: `att:<roll>:<date>:<method>` */
  type: "attendance";
  roll: string;
  date: string;
  method: string;
}

export type PunchLeaf = MerkleLeaf | MerkleLeafAttendance;

// --- b64url / hex helpers --------------------------------------------------

export function b64urlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(segment: string): Uint8Array {
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("odd-length hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// --- Slot math ----------------------------------------------------------------

export function currentSlot(now: number = Date.now()): number {
  return Math.floor(now / 1000 / SLOT_SECONDS);
}

export function slotRemainingMs(now: number = Date.now()): number {
  const msInSlots = SLOT_SECONDS * 1000;
  return msInSlots - (now % msInSlots);
}

/** Structural decode of a QR text without verification. */
export function decodePunchQr(qrText: string): PunchPayload {
  if (!qrText.startsWith(PUNCH_PREFIX)) throw new Error("unknown punch prefix");
  const jws = qrText.slice(PUNCH_PREFIX.length);
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Error("malformed JWS");
  const header = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0]))) as PunchHeader;
  if (header.alg !== "ES256" || header.typ !== "punch.v1+JWS") {
    throw new Error("unsupported JWS header");
  }
  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1]))) as PunchPayload;
  if (payload.v !== PUNCH_VERSION) throw new Error("unsupported payload version");
  return payload;
}

export function payloadToQrText(jws: string): string {
  return `${PUNCH_PREFIX}${jws}`;
}

/** Canonical serialization for a transparency-log leaf. */
export function leafToBytes(leaf: PunchLeaf): Uint8Array {
  if (leaf.type === "enroll") {
    return new TextEncoder().encode(`enroll:${leaf.roll}:${leaf.kid}`);
  }
  return new TextEncoder().encode(`att:${leaf.roll}:${leaf.date}:${leaf.method}`);
}
