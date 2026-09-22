# @punch/protocol

Wire protocol, slot math, signing, and Merkle transparency-log toolkit for the **Punch Attendance System**.

## Install

```bash
npm install @punch/protocol
```

Or with pnpm / yarn:

```bash
pnpm add @punch/protocol
yarn add @punch/protocol
```

## Quick Start

### Browser / React / PWA

```ts
import { generatePunchKey, signCurrentPunch, SLOT_SECONDS } from "@punch/protocol";

// 1. Generate a hardware-bound ECDSA P-256 keypair
const { keyPair } = await generatePunchKey();

// 2. Sign the current 3-second slot
const { qr, slot, expiresIn } = await signCurrentPunch(keyPair, {
  kid: "your-key-id",
  sid: "punch:local:1JT21CS095",
  now: Date.now(),
});

// qr is a JWS string like "punch.v1:eyJhbGci..."
// Display it as a QR code in your UI
```

### Node.js (server-side verification)

```ts
import { verifyPunchJws, keyIdFromJwk, makePunchQr } from "@punch/protocol/node";

// Verify a scanned QR payload
const result = verifyPunchJws(publicJwk, qrText);
// result.ok === true if signature is valid

// Derive key ID from a public JWK
const kid = keyIdFromJwk(publicJwk);

// Build a QR text from a JWS
const qrText = makePunchQr(jws);
```

### Merkle Transparency Log

```ts
import { buildDailyLog, verifyInclusion } from "@punch/protocol";

const leaves = [
  { type: "enroll", roll: "1JT21CS095", kid: "abc..." },
  { type: "attendance", roll: "1JT21CS095", date: "2026-09-19", method: "qr" },
];

const { root, paths } = await buildDailyLog(leaves);

// Verify inclusion of a leaf
const proof = paths[0];
const leaf = leaves[0];
const valid = await verifyInclusion(leaf, proof, root, leaves.length);
```

## Entry Points

| Import | Environment | What it exports |
|--------|-------------|-----------------|
| `@punch/protocol` | Isomorphic (browser + Node) | Types, constants, slot math, Merkle tree, `generatePunchKey`, `signCurrentPunch` |
| `@punch/protocol/web` | Browser only | `generatePunchKey`, `signCurrentPunch`, `exportPublicJwk` |
| `@punch/protocol/node` | Node.js only | `verifyPunchJws`, `keyIdFromJwk`, `makePunchQr` |

## Protocol Overview

```
Student Phone (PWA)                  Dashboard Scanner
┌──────────────────┐                 ┌──────────────────┐
│ 1. Generate ECDSA│                 │                  │
│    P-256 keypair │                 │                  │
│ 2. Sign current  │    QR code      │ 3. Verify JWS    │
│    3s slot       │ ──────────────▶ │    signature     │
│ 3. Display QR    │  punch.v1:JWS   │ 4. Check slot    │
│    for 3 seconds │                 │    freshness     │
└──────────────────┘                 │ 5. Dedup nonce   │
                                     │ 6. Write record  │
                                     └──────────────────┘
```

### QR Format

```
punch.v1:<base64url-header>.<base64url-payload>.<base64url-signature>
```

**Header:**
```json
{ "alg": "ES256", "typ": "punch.v1+JWS" }
```

**Payload:**
```json
{
  "v": 1,
  "kid": "<key-id>",
  "sid": "punch:local:<roll>",
  "slot": 596612813,
  "nonce": "<uuid>",
  "iat": 1726766531
}
```

### Security Properties

- **Hardware-bound key** — private key generated with `extractable: false` (lives in TEE/StrongBox/Secure Enclave)
- **3-second expiry** — each slot is only valid for its time window
- **Replay protection** — each nonce can only be consumed once
- **ECDSA P-256** — same curve used by WebAuthn, FIDO2, and Apple/Google wallet keys
- **Merkle transparency log** — RFC 6962-style daily batch for verifiable attendance records

## Development

```bash
cd protocol
npm install
npm test          # run vitest
npm run typecheck # tsc --noEmit
npm run build     # build to dist/
```

## License

MIT
