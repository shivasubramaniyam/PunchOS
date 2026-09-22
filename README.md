# ⚡ PunchOS — Cult.fit-Style Web3 Biometric Punch Protocol & OS

> **Zero-trust, anti-proxy biometric attendance platform** featuring a plug-and-play TypeScript SDK (`@punch/protocol`), Next.js 16 live camera terminal, RFC 6962 Merkle tree transparency logs, and WebAuthn hardware-signed 3-second dynamic QR codes.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![WebAuthn](https://img.shields.io/badge/WebAuthn-Passkeys-green?logo=fido&logoColor=white)](https://webauthn.io/)
[![Merkle Log](https://img.shields.io/badge/RFC_6962-Merkle_Tree-purple)](#-4-web3-rfc-6962-merkle-tree-audit--verifiable-receipts)

---

## 💡 The Core Innovation: Inverted Cult.fit-Style Web3 Flow

Traditional classroom QR attendance projects suffer from a fatal flaw: **the faculty displays a static QR code and students take a picture or share it in WhatsApp groups to buddy-punch for absent friends.**

**PunchOS inverts the entire paradigm** using Web3 cryptographic standards:

```
+-----------------------------------------------------------------------------------------+
|                                    1. STUDENT DEVICE (PWA)                              |
|  - Student logs in via biometric Passkey / TouchID / FaceID (WebAuthn).                 |
|  - WebCrypto generates a non-extractable ECDSA P-256 hardware key.                     |
|  - Every 3 SECONDS, device signs a fresh JWS token: `punch.v1:<compact-jws>`            |
|  - Token is bound to current wall-clock slot + unique cryptographic nonce.              |
|  - A screenshot expires in 3 seconds; forwarding or proxying is impossible.            |
+--------------------------------------------+--------------------------------------------+
                                             |
                                  Student shows dynamic QR
                                             v
+-----------------------------------------------------------------------------------------+
|                           2. FACULTY / KIOSK CAMERA SCANNER TERMINAL                    |
|  - Faculty or entryway terminal keeps high-speed 60fps camera scanner open.             |
|  - Instantly decodes student's dynamic QR code as they walk in / punch in.              |
|  - Verifies ES256 signature against student's registered public key.                   |
|  - Validates slot freshness (3s window) and consumes nonce to block replay attacks.     |
|  - Plays Cult.fit harmonic audio chime & holographic biometric verification card.       |
|  - Logs entry into an RFC 6962 Merkle Tree transparency log with verifiable proofs.     |
+-----------------------------------------------------------------------------------------+
```

---

## 🌟 4 Key Innovations Built Into PunchOS

### 1. ⚡ Cult.fit Holographic Check-In & Sound Synthesis
- **Web Audio Sound Effects**: High-frequency harmonic audio synthesis chime when a dynamic QR is scanned.
- **Visual Feedback**: Emerald pulse ripple animations and laser reticle.
- **Streak Badges**: Displays current check-in streaks (e.g., 🔥 7-day punch streak).

### 2. 🏢 1-Click Multi-Tenant Organization Switcher
- **Universal Adaptor**: Instantly switch modes in the Faculty Terminal:
  - 🎓 **University Campus** (`Student Roll`, `Branch & Year`, `Class Attendance`)
  - 🏋️‍♂️ **Cult.fit Gym** (`Member ID`, `Workout Slot`, `Gym Check-In`)
  - 💼 **Tech Enterprise** (`Employee Badge`, `Dept & Floor`, `Desk Check-In`)
  - 🎟️ **Web3 Hackathon** (`Hacker / Wallet`, `Track / Team`, `POAP Check-In`)

### 3. 🎯 Apple Watch Activity Rings & Exam Predictor (Student PWA)
- **Activity Rings**: Circular SVG progress gauge showing attendance percentage against minimum cutoffs.
- **Exam Eligibility Predictor**: Calculates safety margins (e.g. *"🛡️ Safe: You can miss up to 2 more classes without dropping below 75%"*).
- **Weekly Habit Heatmap**: 7-day activity tracking consistency.

### 4. 🔗 Web3 RFC 6962 Merkle Tree Audit & Verifiable Receipts
- **Cryptographic Merkle Root**: Daily attendance events are hashed into an RFC 6962 Merkle Tree with `0x00` leaf and `0x01` internal node separation.
- **Faculty Merkle Inspector**: Click **"Audit Merkle Tree"** on the dashboard to inspect the current daily root hash and tree size.
- **Cryptographic Receipts**: Students can click **"View Cryptographic Punch Receipt"** to load and copy zero-knowledge JSON inclusion proofs (`path`, `index`, `rootHex`).

---

## 🛠️ Architecture

```
PunchOS/
├── protocol/          # @punch/protocol — Universal SDK for any organization
├── server/            # Express TypeScript backend, Prisma ORM, SSE live events, Merkle Tree
├── dashboard/         # Next.js Faculty Camera Scanner Terminal & Analytics
├── punch-pwa/         # Next.js Student 3-Second Biometric Rotating QR App
└── package.json       # Workspace root scripts
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm --prefix server install
npm --prefix protocol install
npm --prefix dashboard install
npm --prefix punch-pwa install
```

### 2. Initialize Database & Seed Sample Students
```bash
npm run db:push
npm run seed
```

### 3. Start the Platform
```bash
# Terminal 1: Backend Server (Port 8000)
npm run dev:server

# Terminal 2: Faculty Camera Scanner Terminal (Port 3000)
npm run dev:dashboard

# Terminal 3: Student Punch PWA (Port 3001)
npm run dev:pwa
```

---

## 🌐 Application Endpoints

| Portal | URL | Description |
|---|---|---|
| **Faculty Camera Scanner Terminal** | `http://localhost:3000` | Real-time camera scanner, live SSE feed, analytics charts, Merkle auditor |
| **Student Biometric Punch PWA** | `http://localhost:3001` | Biometric passkey enrollment, 3s rotating dynamic QR, activity rings |
| **Backend REST & SSE API** | `http://localhost:8000/api` | Punch verification, Merkle receipts, students CRUD, SSE stream |

---

## 🛡️ Anti-Proxy Security Guarantees

1. **Zero Screenshot Forwarding:** Every dynamic QR rotates within **3 seconds**. By the time a screenshot is sent to a friend, the token is expired and rejected by the server.
2. **Cryptographic Hardware Binding:** The signing private key is generated inside the phone's Secure Enclave (`extractable: false`) and gated by WebAuthn passkeys.
3. **Nonce Replay Protection:** Every nonce is stored and consumed in the database; duplicate submissions are instantly blocked.
4. **Zero-Trust Merkle Verification:** All punches are cryptographically committed to an RFC 6962 Merkle Tree, allowing tamper-proof audit trails.
