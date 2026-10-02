# PunchOS — LinkedIn Promotion Kit

## 📌 Post Option A — Storytelling & Technical Breakdown (Recommended)

Every "smart" QR attendance project and legacy campus ERP I've seen (CollPoll, ERPNext, static QR tools) suffers from the same fatal flaw:

The professor projects a static QR code on screen. Someone takes a photo, drops it into the class WhatsApp group, and 30 absent friends mark themselves present from their hostel beds.

Legacy MFA tools (Okta, Duo, Google Authenticator) solved TOTP for logins, but classroom check-ins and gym kiosks still use unverified, screenshotable barcodes.

So I built **PunchOS** — an anti-proxy biometric attendance protocol where the QR code is cryptographically useless to anyone except the person holding the physical phone.

Here is how it kills buddy-punching and outperforms legacy systems:

🔐 **Hardware-bound identity** — Students enroll with WebAuthn passkeys (FaceID/TouchID). The ECDSA P-256 key is generated with `extractable: false` inside the phone's Secure Enclave / TEE — it can never be exported or cloned.

⚡ **3-second dynamic rotating QR** — Unlike static projector QRs or 30-second TOTP, the phone signs a fresh JWS token (`punch.v1:...`) every 3 seconds bound to a wall-clock epoch slot + single-use nonce. A screenshot expires before it can be forwarded over WhatsApp.

📷 **60fps camera kiosk terminal** — A live camera scanner decodes the QR on approach, verifies ES256 signatures against the student's registered public key, burns the nonce to block replay attacks, and confirms check-in with a Cult.fit-style holographic audio chime.

🌳 **Web3 RFC 6962 Merkle Tree audit** — Unlike proprietary database records that can be manually edited, every punch is committed to a daily Merkle tree transparency log. Students get zero-knowledge inclusion proofs (`path`, `index`, `rootHex`) as receipts.

📦 **Plug-and-play TypeScript SDK** — The wire protocol, slot math, signing, and Merkle toolkit are published as `@shivasubramaniyam/punch-protocol` — allowing any campus, gym, enterprise, or Web3 event to build custom scanner kiosks.

Built with: TypeScript · Next.js 16 · Express · Prisma / PostgreSQL · Web Crypto API · WebAuthn Passkeys · tsup · Vitest

Big thanks to the WebAuthn & FIDO2 ecosystem for making hardware-backed cryptography accessible on the web.

What would you add to make this production-ready? Feedback welcome 👇

🔗 GitHub: [repo link]
🌐 Live demo: [demo link]

#TypeScript #WebAuthn #Passkeys #CyberSecurity #SoftwareEngineering #NextJS #FullStack #SystemDesign #OpenSource #Web3 #EdTech #BuildInPublic

---

## 📌 Post Option B — Short & Punchy (High Impact)

Static QR attendance codes can be screenshotted and shared on WhatsApp. Mine can't.

**PunchOS** — biometric attendance where the QR rotates every 3 seconds:

→ Signed inside the phone's Secure Enclave (WebAuthn Passkeys, ECDSA P-256)
→ Each token is bound to a 3-second time slot + single-use nonce
→ Camera scanner verifies signature + slot freshness + replay protection
→ RFC 6962 Merkle tree issues zero-knowledge receipts for every check-in
→ Shipped as a plug-and-play npm SDK (`@shivasubramaniyam/punch-protocol`)

Compared to legacy campus ERPs and static barcode scanners:
Screenshots expire. Forwarding fails. Attendance becomes cryptographically verifiable.

🔗 [repo link] · 🌐 [demo link]

#TypeScript #Passkeys #WebAuthn #CyberSecurity #FullStack #SystemDesign #OpenSource #BuildInPublic

---

## ⚔️ Competitor Comparison Matrix (Add to Post Comments / Article)

| Feature | Legacy ERPs (CollPoll / Static QR) | Enterprise MFA (Okta / Duo) | Cult.fit / Gym Kiosks | **PunchOS Protocol** |
|---|---|---|---|---|
| **QR Code Lifetime** | Static / Infinite | N/A (Push / 30s TOTP) | Static Barcode | **3-Second Rotating Epoch** |
| **Anti-Screenshot Guarantee** | ❌ No (easily shared) | ⚠️ Partial | ❌ No | **✅ Yes (3s slot expiration)** |
| **Hardware Enclave Binding** | ❌ No | ✅ Yes | ❌ No | **✅ Yes (WebAuthn P-256)** |
| **Biometric Gate** | ❌ No | ✅ Yes | ❌ No | **✅ Yes (TouchID / FaceID)** |
| **Audit Trail** | ❌ Centralized DB (editable) | ❌ Private Server Log | ❌ Centralized DB | **✅ RFC 6962 Merkle Proofs** |
| **SDK Integration** | ❌ Closed Source | ⚠️ Enterprise API | ❌ Proprietary | **✅ `@punch/protocol` SDK** |

---

## 🪝 Top-Performing Hooks (First 2 lines before "…see more")

1. *"I made screenshots of QR codes useless. On purpose."*
2. *"Your friend can't punch in for you anymore. I made sure of it — cryptographically."*
3. *"Static QR codes are the weakest link in modern attendance systems. So I inverted the entire protocol."*
4. *"Why static QR attendance is broken — and how WebAuthn hardware passkeys fix it forever."*

---

## 📈 Optimization & Hashtag Strategy

### Recommended Primary Hashtags (High Relevance & Reach)
- `#TypeScript`
- `#WebAuthn`
- `#Passkeys`
- `#CyberSecurity`
- `#SoftwareEngineering`
- `#NextJS`
- `#FullStack`
- `#SystemDesign`
- `#OpenSource`
- `#BuildInPublic`

### Posting Best Practices
1. **Link Placement:** Place GitHub and Live Demo links in the **first comment** to avoid LinkedIn algorithm reach penalties.
2. **Media Attachments:** Attach the 5-slide carousel visual deck (`punchos_story_carousel.md`) or a 30-second screen recording.
3. **Engagement Window:** Reply to every comment within the first 60 minutes after posting.
