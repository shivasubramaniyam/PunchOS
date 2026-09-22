import { generateKeyPairSync } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  PUNCH_PREFIX,
  SLOT_SECONDS,
  b64urlDecode,
  b64urlEncode,
  bytesToHex,
  currentSlot,
  decodePunchQr,
  hexToBytes,
  leafToBytes,
  slotRemainingMs,
} from "../src/core";
import { buildDailyLog, merkleTree, verifyInclusion } from "../src/merkle";
import { keyIdFromJwk, makePunchQr, verifyPunchJws } from "../src/node";

describe("slot math", () => {
  it("floors timestamps into 3-second slots", () => {
    expect(currentSlot(0)).toBe(0);
    expect(currentSlot(2999)).toBe(0);
    expect(currentSlot(3000)).toBe(1);
    expect(currentSlot(SLOT_SECONDS * 1000 * 12345)).toBe(12345);
  });

  it("counts down within the slot", () => {
    expect(slotRemainingMs(0)).toBe(3000);
    expect(slotRemainingMs(2999)).toBe(1);
    expect(slotRemainingMs(3000)).toBe(3000);
  });
});

describe("punch QR codec", () => {
  it("round-trips make -> decode", () => {
    const { qr, payload } = makePunchQr(KEY_A.priv, {
      kid: "kid-1",
      sid: "punch:local:095",
      now: 1_700_000_000_000,
      nonce: "abc",
    });
    expect(qr.startsWith(PUNCH_PREFIX)).toBe(true);
    const decoded = decodePunchQr(qr);
    expect(decoded.kid).toBe(payload.kid);
    expect(decoded.sid).toBe("punch:local:095");
    expect(decoded.slot).toBe(payload.slot);
    expect(decoded.nonce).toBe("abc");
  });
});

describe("ES256 sign/verify", () => {
  it("verifies a legitimate punch", () => {
    const { qr } = makePunchQr(KEY_A.priv, {
      kid: "kid-1",
      sid: "punch:local:095",
      now: 1_700_000_000_000,
    });
    const payload = verifyPunchJws(qr.slice(PUNCH_PREFIX.length), KEY_A.pub);
    expect(payload.sid).toBe("punch:local:095");
  });

  it("rejects a tampered payload", () => {
    const { qr } = makePunchQr(KEY_A.priv, {
      kid: "kid-1",
      sid: "punch:local:095",
      now: 1_700_000_000_000,
    });
    // Deterministic tamper: decode the payload segment, swap the roll,
    // re-encode, splice back — the signature no longer matches.
    const jws = qr.slice(PUNCH_PREFIX.length);
    const [h, p, s] = jws.split(".");
    const payloadJson = new TextDecoder().decode(b64urlDecode(p));
    const tamperedPayloadB64 = b64urlEncode(
      new TextEncoder().encode(payloadJson.replace("095", "096"))
    );
    const tampered = `${h}.${tamperedPayloadB64}.${s}`;
    expect(() => verifyPunchJws(tampered, KEY_A.pub)).toThrow();
  });

  it("rejects signatures from a different key", () => {
    const { qr } = makePunchQr(KEY_A.priv, {
      kid: "kid-1",
      sid: "punch:local:095",
      now: 1_700_000_000_000,
    });
    expect(() => verifyPunchJws(qr.slice(PUNCH_PREFIX.length), KEY_B.pub)).toThrow();
  });

  it("derives a stable key ID from the public JWK", () => {
    const kid1 = keyIdFromJwk(KEY_A.pub);
    const kid2 = keyIdFromJwk(KEY_A.pub);
    expect(kid1).toBe(kid2);
    expect(kid1).toMatch(/^[A-Za-z0-9_-]{22,}$/);
    expect(kid1).not.toBe(keyIdFromJwk(KEY_B.pub));
  });
});

describe("Merkle transparency log", () => {
  it("proves inclusion for every leaf", async () => {
    const leaves = [
      { type: "attendance" as const, roll: "095", date: "2026-09-19", method: "qr" },
      { type: "attendance" as const, roll: "096", date: "2026-09-19", method: "manual" },
      { type: "enroll" as const, roll: "097", kid: "kid-2" },
    ];
    const { root, size, paths } = await merkleTree(leaves);
    expect(size).toBe(3);

    for (let i = 0; i < leaves.length; i++) {
      const ok = await verifyInclusion(leaves[i], {
        index: i,
        treeSize: size,
        rootHex: root,
        path: paths[i],
      });
      expect(ok).toBe(true);
    }
  });

  it("rejects a proof for the wrong leaf", async () => {
    const leaves = [
      { type: "attendance" as const, roll: "095", date: "2026-09-19", method: "qr" },
      { type: "attendance" as const, roll: "096", date: "2026-09-19", method: "qr" },
    ];
    const { root, size, paths } = await merkleTree(leaves);
    const wrongLeaf = { type: "attendance" as const, roll: "097", date: "2026-09-19", method: "qr" };
    const ok = await verifyInclusion(wrongLeaf, {
      index: 0,
      treeSize: size,
      rootHex: root,
      path: paths[0],
    });
    expect(ok).toBe(false);
  });

  it("builds a daily log with a stable root", async () => {
    const leaves = [
      { type: "enroll" as const, roll: "095", kid: "kid-1" },
      { type: "attendance" as const, roll: "095", date: "2026-09-19", method: "qr" },
    ];
    const a = await buildDailyLog(leaves);
    const b = await buildDailyLog(leaves);
    expect(a.root).toBe(b.root);
    expect(a.size).toBe(2);
  });
});

describe("leaf serialization", () => {
  it("serializes deterministically", () => {
    const leaf = { type: "attendance" as const, roll: "095", date: "2026-09-19", method: "qr" };
    expect(bytesToHex(leafToBytes(leaf))).toBe(bytesToHex(leafToBytes({ ...leaf })));
    expect(hexToBytes("ff00")).toEqual(new Uint8Array([255, 0]));
  });
});

// --- fixtures ---------------------------------------------------------------

function generateJwkPair() {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  return {
    pub: publicKey.export({ format: "jwk" }) as never,
    priv: privateKey.export({ format: "jwk" }) as never,
  };
}

const KEY_A = generateJwkPair();
const KEY_B = generateJwkPair();
