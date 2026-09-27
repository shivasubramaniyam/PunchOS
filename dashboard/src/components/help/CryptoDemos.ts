/**
 * Browser cryptographic helpers for the interactive educational demonstrations.
 * Uses native WebCrypto SubtleCrypto APIs for genuine SHA-256 and ES256 math.
 */

// --- Base64URL Helpers ---
export function b64urlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// --- Live SHA-256 Hashing ---
export async function computeSha256Hex(text: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return "crypto-api-unavailable";
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

export async function computeSha256Bytes(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data as BufferSource);
  return new Uint8Array(hashBuffer);
}

// --- RFC 6962 Merkle Tree Helpers ---
export async function rfcLeafHash(leafText: string): Promise<Uint8Array> {
  const leafBytes = new TextEncoder().encode(leafText);
  const prefixed = new Uint8Array(leafBytes.length + 1);
  prefixed[0] = 0x00; // RFC 6962 leaf prefix
  prefixed.set(leafBytes, 1);
  return computeSha256Bytes(prefixed);
}

export async function rfcNodeHash(left: Uint8Array, right: Uint8Array): Promise<Uint8Array> {
  const buf = new Uint8Array(1 + left.length + right.length);
  buf[0] = 0x01; // RFC 6962 internal node prefix
  buf.set(left, 1);
  buf.set(right, 1 + left.length);
  return computeSha256Bytes(buf);
}

export interface DemoMerkleLeaf {
  id: string;
  name: string;
  roll: string;
  time: string;
  hashHex: string;
  hashBytes: Uint8Array;
}

export interface DemoMerkleTree {
  leaves: DemoMerkleLeaf[];
  level1: { leftHex: string; rightHex: string; nodeHex: string; leftBytes: Uint8Array; rightBytes: Uint8Array; nodeBytes: Uint8Array }[];
  rootHex: string;
}

export async function buildDemoMerkleTree(students: { name: string; roll: string; time: string }[]): Promise<DemoMerkleTree> {
  const leaves: DemoMerkleLeaf[] = [];
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const raw = `att:${s.roll}:2026-09-27:${s.time}:qr`;
    const hashBytes = await rfcLeafHash(raw);
    leaves.push({
      id: `leaf-${i}`,
      name: s.name,
      roll: s.roll,
      time: s.time,
      hashHex: bytesToHex(hashBytes),
      hashBytes,
    });
  }

  // Level 1: pair leaves (0,1) and (2,3)
  const level1: DemoMerkleTree["level1"] = [];
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i].hashBytes;
    const right = i + 1 < leaves.length ? leaves[i + 1].hashBytes : leaves[i].hashBytes;
    const nodeBytes = await rfcNodeHash(left, right);
    level1.push({
      leftHex: bytesToHex(left),
      rightHex: bytesToHex(right),
      nodeHex: bytesToHex(nodeBytes),
      leftBytes: left,
      rightBytes: right,
      nodeBytes,
    });
  }

  // Root: hash level 1 nodes
  let rootHex = "";
  if (level1.length === 1) {
    rootHex = level1[0].nodeHex;
  } else if (level1.length === 2) {
    const rootBytes = await rfcNodeHash(level1[0].nodeBytes, level1[1].nodeBytes);
    rootHex = bytesToHex(rootBytes);
  }

  return { leaves, level1, rootHex };
}

// --- Live Browser ES256 Signing & Verification Demo ---
export interface DemoKeyPair {
  keyPair: CryptoKeyPair;
  publicKeyJwk: JsonWebKey;
  keyId: string;
}

export async function createDemoSigningKeys(): Promise<DemoKeyPair> {
  const keyPair = (await window.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true, // extractable for interactive demo inspection
    ["sign", "verify"]
  )) as CryptoKeyPair;

  const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const x = publicKeyJwk.x || "";
  const y = publicKeyJwk.y || "";
  const kidHash = await computeSha256Hex(`punch-p256:${x}:${y}`);
  const keyId = kidHash.slice(0, 16);

  return { keyPair, publicKeyJwk, keyId };
}

export async function signDemoPunch(
  privateKey: CryptoKey,
  payload: Record<string, unknown>
): Promise<{ jws: string; headerB64: string; payloadB64: string; sigB64: string; rawSigHex: string }> {
  const header = { alg: "ES256", typ: "punch.v1+JWS" };
  const headerB64 = b64urlEncode(JSON.stringify(header));
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const sigBuffer = await window.crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const rawSig = new Uint8Array(sigBuffer);
  const sigB64 = b64urlEncode(rawSig);
  const jws = `${signingInput}.${sigB64}`;

  return {
    jws,
    headerB64,
    payloadB64,
    sigB64,
    rawSigHex: bytesToHex(rawSig),
  };
}

export async function verifyDemoPunch(
  publicKey: CryptoKey,
  headerB64: string,
  payloadB64: string,
  sigB64: string
): Promise<boolean> {
  try {
    const signingInput = `${headerB64}.${payloadB64}`;
    const sigBytes = b64urlDecode(sigB64);

    return await window.crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      sigBytes as BufferSource,
      new TextEncoder().encode(signingInput)
    );
  } catch {
    return false;
  }
}
