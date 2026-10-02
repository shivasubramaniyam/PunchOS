# 📱 PunchOS Student PWA — Dynamic Biometric Attendance App

> **Mobile-first Progressive Web App (PWA)** built with Next.js 16, TypeScript, WebAuthn Passkeys, and WebCrypto ECDSA P-256 signatures for zero-trust anti-proxy attendance tracking.

---

## 🌟 Key Features

### 1. 🔑 Hardware-Bound Passkey Biometrics
- **Secure Enclave / TEE Key Generation:** Generates non-extractable (`extractable: false`) ECDSA P-256 key pairs inside the device's hardware enclave.
- **Biometric Unlock Gate:** WebAuthn Passkeys (TouchID / FaceID / Fingerprint) gate every punch signing session.
- **1-Device Binding:** Automated single-device policy; registering a new device revokes older keys on the server.

### 2. ⚡ 3-Second Dynamic Rotating QR
- **Cryptographic JWS Token:** Every 3 seconds, signs a fresh JWS token: `punch.v1:<compact-jws>`.
- **Wall-Clock Slot Synchronization:** Measures server time offset (`/api/punch/time`) to ensure slot parity even when the phone's clock drifts.
- **Anti-Screenshot Security:** Screenshots expire in 3 seconds; forwarding QR images to friends is mathematically impossible.

### 3. 🎯 Real-Time Activity Rings & Exam Predictor
- **Apple Watch Style Activity Gauge:** Animated circular SVG ring displaying current attendance percentage vs 75% cutoff.
- **Real-Time SSE Sync:** Connects directly to backend Server-Sent Events (`/api/events`) with 3s polling fallback. The UI updates instantly when scanned at a faculty kiosk.
- **Exam Readiness Predictor:** Calculates exact missable class buffers (e.g. *"🛡️ Safe: You can miss up to 2 more classes"*).

### 4. 📅 Dynamic Weekly Habit Heatmap
- **Mon..Sun Visual Heatmap:** Renders actual weekly attendance from database history (`stats.history`).
- **Visual Statuses:** Color-coded dots for Attended (`.active`), Missed (`.missed`), Weekend (`.weekend`), and Upcoming (`.future`).

### 5. 🛡️ Web3 RFC 6962 Cryptographic Merkle Proof Receipts
- **Verifiable Inclusion Proofs:** One-click receipt trigger (`/api/punch/receipt/:roll`) fetching Merkle tree leaf index, root hash, and sibling path hashes.
- **Case-Insensitive Roll Lookup:** Case-insensitive student roll lookup.

---

## 🚀 Getting Started

### Development Mode

```bash
# From project root
npm run dev:pwa

# Or directly in punch-pwa directory
cd punch-pwa
npm run dev -- -p 3001
```

Open **`http://localhost:3001`** in your browser or scan the local LAN IP on a mobile phone connected to the same Wi-Fi network.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Styling:** Vanilla CSS (Glassmorphism & Dark Neon design system)
- **Cryptography:** WebCrypto API (`window.crypto.subtle`) & WebAuthn / FIDO2
- **QR Engine:** `qrcode` & `@punch/protocol` SDK
- **Real-Time Data:** Server-Sent Events (`EventSource`) & Fetch API
