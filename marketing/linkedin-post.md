# PunchOS — LinkedIn Promotion Kit

## 📌 Post Option A — Storytelling (recommended for portfolio)

Every "smart" QR attendance system I've seen has the same fatal flaw:

The professor puts a static QR code on the projector. Someone photographs it, drops it in the class WhatsApp group, and 30 absent friends get marked present from their hostel beds.

So I built **PunchOS** — an anti-proxy biometric attendance protocol where the QR code is cryptographically useless to anyone except the person holding the phone.

Here's how it kills buddy-punching:

🔐 **Hardware-bound identity** — Students enroll with a WebAuthn passkey (FaceID/TouchID). The ECDSA P-256 private key is generated with `extractable: false` — it never leaves the phone's Secure Enclave.

⚡ **3-second dynamic QR** — Every 3 seconds, the phone signs a fresh JWS token (`punch.v1:...`) bound to the current time slot + a one-time nonce. A screenshot expires before it can be forwarded. The scanner verifies the signature, slot freshness, and burns the nonce to block replay.

📷 **Faculty camera terminal** — A 60fps live scanner decodes the QR on approach, verifies ES256 signatures against the student's registered public key, and confirms the punch with a Cult.fit-style holographic check-in.

🌳 **Tamper-proof audit trail** — Every punch is committed to an RFC 6962-style Merkle tree. Students get cryptographic inclusion proofs as receipts; nobody can silently edit yesterday's attendance.

📦 **The core shipped as an SDK** — The wire protocol, slot math, signing, and Merkle toolkit are published as `@shivasubramaniyam/punch-protocol` on GitHub Packages — so any campus, gym, or company can build their own scanner on top.

Built with: TypeScript · Next.js · Express · Prisma/PostgreSQL · Web Crypto API · WebAuthn · tsup · Vitest

🔗 GitHub: [repo link]
🌐 Live demo: [demo link]

Big thanks to the passkey/WebAuthn ecosystem for making hardware-backed crypto accessible on the web.

What would you add to make this production-ready? Feedback welcome 👇

#TypeScript #WebDevelopment #WebAuthn #Passkeys #CyberSecurity #FullStackDeveloper #NextJS #OpenSource #ProjectShowcase #SoftwareEngineering

---

## 📌 Post Option B — Short & punchy

Static QR attendance codes can be screenshotted and shared. Mine can't.

**PunchOS** — biometric attendance where the QR rotates every 3 seconds:

→ Signed inside the phone's Secure Enclave (WebAuthn passkeys, ECDSA P-256)
→ Each token is bound to a 3-second time slot + one-time nonce
→ Camera scanner verifies signature + freshness + replay protection
→ RFC 6962 Merkle tree issues cryptographic receipts for every punch
→ Core protocol published as an npm SDK

Screenshots expire. Forwarding fails. Attendance becomes verifiable.

🔗 [repo link] · 🌐 [demo link]

#TypeScript #Passkeys #WebAuthn #FullStack #BuildInPublic

---

## 🪝 Alternative hooks (first 2 lines decide everything — that's all that shows before "…see more")

1. "I made screenshots of QR codes useless. On purpose."
2. "Your friend can't punch in for you anymore. I made sure of it — cryptographically."
3. "Attendance fraud is a cryptography problem, not an attendance problem. Here's my fix."
4. "The QR code on the projector is the weakest link in every classroom. So I inverted the flow: now the *student's phone* displays the code."

---

## 🎬 Media (do this — posts with video/demos get 3-5x engagement)

- **Best:** a 30–60s screen recording: faculty scanner open → student phone shows rotating QR → walks into frame → chime + green holographic card → Merkle receipt popup. Record at phone-camera angle if possible; it sells the "real check-in" feeling.
- **Good:** a 4-panel carousel: Problem (screenshot flaw) → Dynamic QR → Scanner verify → Merkle receipt.
- **Minimum:** the architecture diagram from the README as an image.

## 📈 Posting tips

- Put the GitHub/demo links in the **first comment** — LinkedIn's algorithm sometimes deprioritizes posts with external links in the body.
- Post **Tuesday–Thursday, 9–11am** in your audience's timezone.
- Reply to every comment within the first 2 hours (comments are the strongest engagement signal).
- Pin the repo on your GitHub profile and add the demo link to your LinkedIn Featured section.
- One caveat: your package lives on **GitHub Packages**, which requires an auth token to install. Either mention it as "published as a GitHub package" (fine for the story) or publish to the public npm registry for a clean one-line install link.
