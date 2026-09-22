/**
 * Simulate a dashboard scanner punch: generate a valid JWS for the current
 * slot using a freshly enrolled key, then POST it to /api/punch/verify.
 *
 * Usage: node protocol/punch-live.mjs <roll>
 */

import { webcrypto } from "node:crypto";

const subtle = webcrypto.subtle;
const roll = process.argv[2] || "1JT21CS095";
const API = "http://localhost:8000";

const PUNCH_PREFIX = "punch.v1:";
const SLOT_SECONDS = 3;

function b64urlEncode(data) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlBytes(seg) {
  const b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
}

// 1. Generate a fresh ECDSA P-256 keypair
const keyPair = await subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"]
);
const pubJwk = await subtle.exportKey("jwk", keyPair.publicKey);
console.log("Generated key:", pubJwk.x?.substring(0, 10) + "...");

// 2. Derive key ID (same as SDK/Python: SHA-256 over punch-p256:x:y)
const x = b64urlBytes(pubJwk.x);
const y = b64urlBytes(pubJwk.y);
const kidInput = new Uint8Array(11 + x.length + 1 + y.length);
kidInput.set(new TextEncoder().encode("punch-p256:"), 0);
kidInput.set(x, 11);
kidInput[11 + x.length] = 0x3a; // ':'
kidInput.set(y, 11 + x.length + 1);
const digest = await subtle.digest("SHA-256", kidInput);
const kid = b64urlEncode(new Uint8Array(digest));
console.log("Key ID:", kid);

// 3. Enroll this key
const enrollRes = await fetch(`${API}/api/punch/enroll`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ studentId: roll }),
});
const enrollData = await enrollRes.json();
console.log("Enroll:", enrollRes.status);

const finishRes = await fetch(`${API}/api/punch/enroll/finish`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    studentId: roll,
    publicKeyJwk: { kty: pubJwk.kty, crv: pubJwk.crv, x: pubJwk.x, y: pubJwk.y },
    challenge: enrollData.challenge,
    label: "scanner-test",
  }),
});
console.log("Enroll finish:", finishRes.status, await finishRes.text());

// 4. Open a punch session
const sessionRes = await fetch(`${API}/api/punch/session/open`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
const sessionData = await sessionRes.json();
console.log("Session:", JSON.stringify(sessionData));

// 5. Build and sign the punch JWS
const slot = Math.floor(Date.now() / (SLOT_SECONDS * 1000));
const payload = {
  v: 1,
  kid,
  sid: `punch:local:${roll}`,
  slot,
  nonce: crypto.randomUUID(),
  iat: Math.floor(Date.now() / 1000),
};

const header = { alg: "ES256", typ: "punch.v1+JWS" };
const headerB64 = b64urlEncode(JSON.stringify(header));
const payloadB64 = b64urlEncode(JSON.stringify(payload));

const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
const sig = await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keyPair.privateKey, signingInput);
const sigB64 = b64urlEncode(new Uint8Array(sig));

const jws = `${headerB64}.${payloadB64}.${sigB64}`;
const qrText = `${PUNCH_PREFIX}${jws}`;

console.log("\nQR payload:", qrText.substring(0, 60) + "...");
console.log("Slot:", slot);

// 6. Punch!
const punchRes = await fetch(`${API}/api/punch/verify`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ qr: qrText }),
});
const punchResult = await punchRes.json();
console.log("\n🎯 PUNCH RESULT:", JSON.stringify(punchResult, null, 2));

// Clean up session
await fetch(`${API}/api/punch/session/close`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
});
