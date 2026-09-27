/**
 * Comprehensive data dictionary and content for the Interactive Help & Learning Center.
 * Designed for both zero-crypto beginners and technical developers.
 */

export interface JourneyStep {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  badge: string;
  whatHappens: string;
  whyNeeded: string;
  simpleExample: {
    heading: string;
    details: string[];
    callout?: string;
  };
  technicalImplementation: {
    algorithm: string;
    codeSnippet: string;
    note: string;
  };
}

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: "student",
    stepNumber: "01",
    title: "Student Identity",
    subtitle: "Registered enrollment identity",
    badge: "Identity Layer",
    whatHappens:
      "The student opens their Punch Progressive Web App (PWA) on their personal phone. The system recognizes the student's unique institutional identity and roll number.",
    whyNeeded:
      "To prevent unauthorized people from checking in, attendance must be linked to a known, pre-enrolled student profile.",
    simpleExample: {
      heading: "Student Profile",
      details: [
        "Name: Shiva Subramaniam",
        "Roll No: 23CS101",
        "Identity URI: punch:TRUSTGRID:23CS101",
        "Status: Registered with college database",
      ],
      callout: "The identity is decentralized and device-bound — Shiva's phone acts as his digital badge.",
    },
    technicalImplementation: {
      algorithm: "W3C DID Format (`punch:<org>:<roll>`)",
      codeSnippet: `interface PunchPayload {
  sid: "punch:TRUSTGRID:23CS101"; // Subject Identity DID
  kid: "shiva-key-9b4f2c";        // Hardware Public Key Fingerprint
}`,
      note: "Stored in the local database (`Student` and `PunchKey` models) with zero external cloud dependencies.",
    },
  },
  {
    id: "create-qr",
    stepNumber: "02",
    title: "Create Short-Lived Punch",
    subtitle: "3-second time-slot timestamp",
    badge: "Anti-Proxy Window",
    whatHappens:
      "The phone captures the current clock time and computes a 3-second 'Slot Number'. It combines this slot with a fresh random number (nonce) and the student ID.",
    whyNeeded:
      "If QR codes lasted forever, a student could screenshot their code and text it to a friend. The 3-second window ensures the QR is only valid for someone standing right in front of the scanner.",
    simpleExample: {
      heading: "Time Slot Math",
      details: [
        "Wall Clock: 10:00:01 AM (Unix Epoch: 1780000001)",
        "Slot Duration: 3 seconds",
        "Calculated Slot: Math.floor(1780000001 / 3) = 593333333",
        "Nonce: Lk73Pq99 (One-time random seed)",
      ],
      callout: "The QR code visually changes every 3 seconds, ticking like a clock.",
    },
    technicalImplementation: {
      algorithm: "currentSlot(now) = floor(unix_ms / (3 * 1000))",
      codeSnippet: `export function currentSlot(now = Date.now()): number {
  return Math.floor(now / 1000 / SLOT_SECONDS); // SLOT_SECONDS = 3
}`,
      note: "Accepted backward tolerance: 1 slot (allows 3s camera shutter latency and sub-second network jitter).",
    },
  },
  {
    id: "sign-qr",
    stepNumber: "03",
    title: "Sign with Private Key",
    subtitle: "Hardware-bound digital stamp",
    badge: "Cryptographic Proof",
    whatHappens:
      "The phone takes the attendance data and stamps it using its secret Private Key stored securely inside the phone's browser/device storage. This creates a digital signature.",
    whyNeeded:
      "Anyone can write 'Shiva, 23CS101'. But only Shiva's real phone has the secret private key capable of producing a mathematically genuine signature.",
    simpleExample: {
      heading: "Digital Signature Creation",
      details: [
        "Data: Shiva + Slot 593333333 + Nonce Lk73Pq99",
        "Private Key: 🔐 Secret Key (Kept inside phone)",
        "Result: Digital Signature (64 bytes of cryptographic proof)",
      ],
      callout: "Think of the private key as a wax seal stamp that cannot be counterfeited.",
    },
    technicalImplementation: {
      algorithm: "ECDSA with curve P-256 and SHA-256 (ES256)",
      codeSnippet: `const sig = await crypto.subtle.sign(
  { name: "ECDSA", hash: "SHA-256" },
  keyPair.privateKey,
  new TextEncoder().encode(signingInput)
);`,
      note: "Keys are generated with `extractable: false` via the WebCrypto API preventing export by web scripts.",
    },
  },
  {
    id: "scan",
    stepNumber: "04",
    title: "Teacher Scans QR",
    subtitle: "Instant optical transmission",
    badge: "Terminal Ingestion",
    whatHappens:
      "The teacher or classroom scanner camera reads the QR code. The QR text contains the message payload plus the cryptographic signature in JWS format.",
    whyNeeded:
      "QR codes provide a high-bandwidth, contactless, offline-capable bridge between the student's mobile device and the faculty terminal without requiring Bluetooth pairing or cables.",
    simpleExample: {
      heading: "Raw QR Content",
      details: [
        "Prefix: punch.v1:",
        "Token: eyJhbGciOiJFUzI1NiJ9.eyJ2IjoxLCJraWQiOi... .sigBytes...",
        "Format: Header . Payload . Signature (Compact JWS)",
      ],
      callout: "The scanner decodes the standard Base64URL text in under 15 milliseconds.",
    },
    technicalImplementation: {
      algorithm: "RFC 7515 JSON Web Signature (Compact Serialization)",
      codeSnippet: `const qrText = \`\${PUNCH_PREFIX}\${headB64}.\${payloadB64}.\${sigB64}\`;
// Scanned by jsQR / HTML5 Video Camera Feed at 60fps`,
      note: "Base64URL is an encoding to make raw binary safe for QR codes; it is NOT encryption.",
    },
  },
  {
    id: "verify",
    stepNumber: "05",
    title: "Server Verification",
    subtitle: "8-point zero-trust validation pipeline",
    badge: "Zero-Trust Check",
    whatHappens:
      "The server looks up Shiva's registered Public Key. It runs a mathematical formula: does this signature match the public key and data? If yes, it checks if the 3-second slot is current and ensures the nonce hasn't been used before.",
    whyNeeded:
      "To ensure 100% authenticity: no tampering, no replay of yesterday's code, no fake student identities.",
    simpleExample: {
      heading: "The 4 Main Checks",
      details: [
        "1. Signature Check: ✓ Valid (Matches registered public key)",
        "2. Student Check: ✓ Shiva is enrolled in CSE Year 3",
        "3. Time Window: ✓ Slot is current (within 3 seconds)",
        "4. Nonce Check: ✓ Nonce is fresh (never seen before)",
      ],
      callout: "If any check fails, attendance is instantly rejected with a warning tone.",
    },
    technicalImplementation: {
      algorithm: "Node.js / WebCrypto ECDSA verify with DER conversion",
      codeSnippet: `// 1. Verify ES256 signature against registered Public Key
const isValid = verifyEs256Signature(headB64, payloadB64, sigB64, publicJwk);
// 2. Replay check
const exists = await prisma.punchEvent.findFirst({ where: { nonce } });`,
      note: "The public key only verifies signatures; it cannot be used to forge new punches.",
    },
  },
  {
    id: "record",
    stepNumber: "06",
    title: "Attendance Recorded & Broadcast",
    subtitle: "Database insertion & real-time SSE",
    badge: "Live Terminal",
    whatHappens:
      "Attendance is saved to the database. The system automatically broadcasts a real-time event via Server-Sent Events (SSE) so the teacher's dashboard instantly flashes green with Shiva's photo and details.",
    whyNeeded:
      "Teachers get instant visual confirmation without having to refresh the webpage or manually click buttons.",
    simpleExample: {
      heading: "Live Feed Update",
      details: [
        "Status: Attendance Marked (Method: Biometric QR)",
        "Student: Shiva Subramaniam (23CS101)",
        "Time: 10:00:02 AM",
        "Class: CSE 3rd Year Section A",
      ],
      callout: "The faculty dashboard plays an audible confirmation chime and updates attendance charts.",
    },
    technicalImplementation: {
      algorithm: "Prisma upsert constraint + SSE broadcast",
      codeSnippet: `await prisma.attendance.upsert({
  where: { unique_student_attendance_per_day: { studentId: "23CS101", date: today } },
  create: { studentId: "23CS101", date: today, method: "qr" }
});
broadcast("attendance.marked", studentRecord);`,
      note: "Database unique constraints guarantee a student can never be double-counted on the same date.",
    },
  },
  {
    id: "merkle",
    stepNumber: "07",
    title: "Append to Merkle Transparency Log",
    subtitle: "Cryptographic daily audit trail",
    badge: "Tamper-Proof Audit",
    whatHappens:
      "Shiva's attendance record is hashed (fingerprinted) and added to today's Merkle Tree. All attendance records for the day are combined into a single 32-byte Merkle Root hash.",
    whyNeeded:
      "If a rogue administrator or attacker tries to secretly delete or insert attendance records in the database later, the Merkle Root will no longer match, exposing the tampering immediately.",
    simpleExample: {
      heading: "The Daily Merkle Tree",
      details: [
        "Leaf #1: Shiva (Hash A94F...)",
        "Leaf #2: Ravi (Hash 7B21...)",
        "Daily Root Hash: 9A7C3D88... (32-byte cryptographic summary)",
        "Inclusion Receipt: Shiva can prove he was present with a 3-hash proof!",
      ],
      callout: "A student can download an inclusion proof receipt to independently verify their presence.",
    },
    technicalImplementation: {
      algorithm: "RFC 6962 Binary Merkle Tree (SHA-256)",
      codeSnippet: `const leaf = leafHashNode(Buffer.from(\`\${idx}:\${roll}:\${date}:\${markedAt}\`));
const dailyTree = await computeDailyMerkleTree();
// Root hash is signed into a Signed Tree Head (STH)`,
      note: "Merkle trees provide inclusion proofs; trust in the root relies on signed timestamps.",
    },
  },
];

export interface PayloadFieldInfo {
  key: string;
  name: string;
  type: string;
  sample: string;
  simpleExplanation: string;
  technicalDetails: string;
  whyItMatters: string;
}

export const PAYLOAD_FIELDS: PayloadFieldInfo[] = [
  {
    key: "v",
    name: "Protocol Version",
    type: "Number (Integer)",
    sample: "1",
    simpleExplanation:
      "Version of the Punch protocol. It tells the scanner which set of rules this message follows.",
    technicalDetails:
      "Constant `PUNCH_VERSION = 1`. Ensures forward compatibility if new cryptographic algorithms or fields are introduced in future versions.",
    whyItMatters:
      "Prevents protocol confusion attacks where old or mismatched scanner software misinterprets message structures.",
  },
  {
    key: "kid",
    name: "Key Identifier",
    type: "String (Base64URL SHA-256)",
    sample: "punch-p256:x4Y9mZ...",
    simpleExplanation:
      "Identifies which registered public key belongs to this device. Like a badge number for your phone's signing key.",
    technicalDetails:
      "Computed as `b64url(sha256('punch-p256:' || x || ':' || y))`. The server uses `kid` to look up the public key from the database without needing to send the whole public key in the QR.",
    whyItMatters:
      "Keeps the QR code compact so phone cameras can scan it in milliseconds, even from across a desk.",
  },
  {
    key: "sid",
    name: "Student Subject ID",
    type: "String (DID URI)",
    sample: "punch:TRUSTGRID:23CS101",
    simpleExplanation:
      "The student's unique academic identity in decentralized format (Institution + Roll Number).",
    technicalDetails:
      "Follows W3C Decentralized Identifier (DID) convention `punch:<tenant/org>:<roll>`. Enables multi-tenant and multi-campus support.",
    whyItMatters:
      "Links the cryptographic punch to an enrolled student profile in the institution's roster.",
  },
  {
    key: "slot",
    name: "Time Slot Index",
    type: "Number (Epoch Slot)",
    sample: "593333333",
    simpleExplanation:
      "A short 3-second time window index. Calculated from the current clock time.",
    technicalDetails:
      "Calculated as `Math.floor(unixTimestampMs / (3 * 1000))`. The server verifies that `slot === currentSlot || slot === currentSlot - 1`.",
    whyItMatters:
      "Screenshot protection! An exported image or video of a QR code becomes completely invalid within 3 seconds.",
  },
  {
    key: "nonce",
    name: "One-Time Number (Nonce)",
    type: "String (8 Random Bytes / Base64URL)",
    sample: "Lk73Pq99aX",
    simpleExplanation:
      "A fresh random value generated for every single QR code. 'Number used once'.",
    technicalDetails:
      "`crypto.getRandomValues(new Uint8Array(8))` encoded in base64url. The server tracks consumed nonces in the `PunchEvent` database table.",
    whyItMatters:
      "Replay attack defense: Even within the 3-second slot window, a scanned QR code cannot be submitted twice.",
  },
  {
    key: "iat",
    name: "Issued At",
    type: "Number (Unix Seconds)",
    sample: "1780000001",
    simpleExplanation:
      "The exact second when the phone created this punch payload.",
    technicalDetails:
      "Standard JWT/JWS claim `iat` (seconds since Unix Epoch: Jan 1, 1970). Used for diagnostic logging and telemetry latency calculation.",
    whyItMatters:
      "Allows the server to measure optical transmission latency between student screen and faculty camera.",
  },
];

export interface SecurityScenario {
  id: string;
  title: string;
  icon: string;
  threatDescription: string;
  whatAttackerTries: string;
  whatSystemDoes: string;
  verdict: "BLOCKED" | "DETECTED" | "TOLERATED";
  verdictBadgeColor: string;
  technicalReason: string;
}

export const SECURITY_SCENARIOS: SecurityScenario[] = [
  {
    id: "screenshot",
    title: "What if a student takes a screenshot and sends it to a friend?",
    icon: "Camera",
    threatDescription: "Proxy attendance via chat app / screenshot sharing (Buddy Punching).",
    whatAttackerTries:
      "Shiva screenshots his QR at home and WhatsApps it to Ravi, who is sitting in the classroom.",
    whatSystemDoes:
      "By the time Ravi opens the picture and holds it to the scanner (even 5 seconds later), the 3-second time slot has already expired. The server rejects the punch with 'Slot expired'.",
    verdict: "BLOCKED",
    verdictBadgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    technicalReason:
      "Slot duration is strictly bounded to 3 seconds with only 1 slot of network tolerance (`ACCEPTED_SLOTS_BACK = 1`).",
  },
  {
    id: "tamper-id",
    title: "What if someone edits the QR code to change the roll number?",
    icon: "FileEdit",
    threatDescription: "Data tampering / identity impersonation.",
    whatAttackerTries:
      "An attacker intercepts Shiva's QR and changes the payload field from `sid: '23CS101'` to `sid: '23CS999'`.",
    whatSystemDoes:
      "The digital signature was computed over Shiva's original data. Changing even a single character makes the cryptographic signature invalid. The server immediately rejects it.",
    verdict: "BLOCKED",
    verdictBadgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    technicalReason:
      "ECDSA ES256 signatures are mathematically tied to the exact byte content of the header and payload. Any alteration breaks the cryptographic verification.",
  },
  {
    id: "replay-slot",
    title: "What if someone tries to scan the same QR code twice within 3 seconds?",
    icon: "RotateCcw",
    threatDescription: "Instant replay attack within the active slot window.",
    whatAttackerTries:
      "An attacker quickly scans a recorded QR token a second time before the 3-second countdown ends.",
    whatSystemDoes:
      "The server records the unique `nonce` from the first punch. When the second punch arrives with the same nonce, the server detects duplicate submission and rejects it with 409 Conflict.",
    verdict: "BLOCKED",
    verdictBadgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    technicalReason:
      "Stateful nonce tracking in `PunchEvent` table ensures nonces are single-use per student.",
  },
  {
    id: "no-private-key",
    title: "What if someone tries to generate a QR on a fake website or device?",
    icon: "KeyRound",
    threatDescription: "Unauthorized key generation & impersonation.",
    whatAttackerTries:
      "An attacker creates a script that tries to generate punch QR codes claiming to be Shiva without Shiva's phone.",
    whatSystemDoes:
      "The attacker does not possess Shiva's private key. If the attacker generates their own key, the signature will not match the registered public key in the college database.",
    verdict: "BLOCKED",
    verdictBadgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    technicalReason:
      "The server queries `PunchKey` by student roll and `kid`. Only signatures created with the corresponding private key can be mathematically validated by the public key.",
  },
  {
    id: "db-tampering",
    title: "What if a rogue database admin edits yesterday's attendance in SQLite?",
    icon: "DatabaseZap",
    threatDescription: "Historical record tampering / administrative fraud.",
    whatAttackerTries:
      "An insider modifies the database directly to mark an absent student present for yesterday's class.",
    whatSystemDoes:
      "When the daily Merkle Tree is recomputed, the leaf hash for that student changes. The resulting Merkle Root will not match the previously published/signed root, immediately proving tampering.",
    verdict: "DETECTED",
    verdictBadgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    technicalReason:
      "RFC 6962 Merkle tree root is a deterministic function of all daily records. Any row change, addition, or deletion alters the root hash.",
  },
  {
    id: "clock-drift",
    title: "What if the student's phone clock is 1 or 2 seconds off?",
    icon: "Clock",
    threatDescription: "Minor clock skew and camera optical processing latency.",
    whatAttackerTries:
      "A student's phone has a sub-second clock drift or the camera takes 1.5 seconds to focus and decode the QR.",
    whatSystemDoes:
      "The protocol provides a 1-slot backward tolerance (`ACCEPTED_SLOTS_BACK = 1`). A punch from the immediately preceding 3-second slot is safely accepted.",
    verdict: "TOLERATED",
    verdictBadgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    technicalReason:
      "Slot validation check: `if (slot === currentSlot || slot === currentSlot - 1)`. The PWA also periodically syncs with `/api/punch/time`.",
  },
];

export interface TechnicalSpecItem {
  feature: string;
  specification: string;
  whatItIs: string;
  whyItExists: string;
  whereUsed: string;
}

export const TECHNICAL_SPECS: TechnicalSpecItem[] = [
  {
    feature: "Protocol Version",
    specification: "punch.v1",
    whatItIs: "The protocol wire specification identifier.",
    whyItExists: "Enables protocol versioning and safe future evolution without breaking legacy terminals.",
    whereUsed: "QR prefix `punch.v1:` and JWS header `typ: 'punch.v1+JWS'`",
  },
  {
    feature: "Signature Algorithm",
    specification: "ES256 (ECDSA over P-256 with SHA-256)",
    whatItIs: "Elliptic Curve Digital Signature Algorithm using the NIST P-256 curve.",
    whyItExists: "Produces compact 64-byte signatures with high cryptographic strength (128-bit security level) and ultra-fast hardware verification.",
    whereUsed: "Student device signing via WebCrypto SubtleCrypto / Node.js crypto module",
  },
  {
    feature: "Cryptographic Hash",
    specification: "SHA-256 (256-bit Secure Hash Algorithm)",
    whatItIs: "One-way cryptographic hash producing 32-byte digests.",
    whyItExists: "Provides pre-image resistance and collision resistance for leaf hashes, key IDs, and Merkle tree nodes.",
    whereUsed: "Key ID computation, Merkle leaf & node hashing, and JWS signing input",
  },
  {
    feature: "QR Wire Format",
    specification: "RFC 7515 Compact JWS (JSON Web Signature)",
    whatItIs: "URL-safe string format consisting of 3 Base64URL segments separated by dots (`head.payload.sig`).",
    whyItExists: "Standardized, compact, and battle-tested serialization format supported across all web standards.",
    whereUsed: "Rendered as optical QR on student phone and decoded by faculty camera",
  },
  {
    feature: "Slot Duration",
    specification: "3 Seconds (Sliding Window)",
    whatItIs: "The temporal validity unit for each generated punch token.",
    whyItExists: "Thwarts video recording and remote screenshot forwarding attacks while remaining practical for optical scanning.",
    whereUsed: "Student PWA slot clock countdown and server slot range verification",
  },
  {
    feature: "Nonce Length",
    specification: "8 Random Bytes (64 bits of entropy)",
    whatItIs: "Cryptographically random single-use seed generated per punch.",
    whyItExists: "Guarantees uniqueness across punches created in the same second and powers stateful replay protection.",
    whereUsed: "`PunchPayload.nonce` and `PunchEvent` database table index",
  },
  {
    feature: "Merkle Leaf Prefix",
    specification: "0x00 (Single Byte)",
    whatItIs: "Domain separation byte prepended to leaf data before hashing (RFC 6962).",
    whyItExists: "Prevents second-preimage attacks where an internal node hash could be maliciously substituted for a leaf hash.",
    whereUsed: "Leaf hashing in `@punch/protocol` and server Merkle tree builder",
  },
  {
    feature: "Merkle Node Prefix",
    specification: "0x01 (Single Byte)",
    whatItIs: "Domain separation byte prepended to concatenated child hashes before hashing.",
    whyItExists: "Ensures internal tree nodes have a distinct cryptographic domain from leaves.",
    whereUsed: "Internal branch node hashing across all tree levels",
  },
];

export interface CodeMappingItem {
  functionName: string;
  sourceFile: string;
  purpose: string;
  plainEnglishDescription: string;
}

export const CODE_MAPPINGS: CodeMappingItem[] = [
  {
    functionName: "currentSlot(now)",
    sourceFile: "protocol/src/core.ts",
    purpose: "Slot calculation math",
    plainEnglishDescription: "Divides current unix epoch milliseconds by (3 * 1000) to get the active 3-second slot number.",
  },
  {
    functionName: "signCurrentPunch(keyPair, opts)",
    sourceFile: "protocol/src/web.ts",
    purpose: "Punch QR generation & signing",
    plainEnglishDescription: "Gathers current slot and fresh nonce, builds the JWS payload, and signs it with the device's private key.",
  },
  {
    functionName: "decodePunchQr(qrText)",
    sourceFile: "protocol/src/core.ts",
    purpose: "QR text decoding",
    plainEnglishDescription: "Validates the `punch.v1:` prefix, unpacks the 3 JWS parts, and parses the JSON header and payload.",
  },
  {
    functionName: "verifyEs256Signature(head, payload, sig, jwk)",
    sourceFile: "server/src/routes/punch.ts",
    purpose: "Cryptographic signature check",
    plainEnglishDescription: "Converts the raw 64-byte signature to ASN.1 DER and checks if it mathematically matches the student's public key.",
  },
  {
    functionName: "sha256(data)",
    sourceFile: "protocol/src/merkle.ts",
    purpose: "SHA-256 digest creation",
    plainEnglishDescription: "Computes a 256-bit cryptographic fingerprint using browser/Node WebCrypto.",
  },
  {
    functionName: "leafHash(leafBytes)",
    sourceFile: "protocol/src/merkle.ts",
    purpose: "RFC 6962 leaf hashing",
    plainEnglishDescription: "Prepends `0x00` domain separator byte to the attendance string and computes the SHA-256 hash.",
  },
  {
    functionName: "nodeHash(left, right)",
    sourceFile: "protocol/src/merkle.ts",
    purpose: "RFC 6962 internal node hashing",
    plainEnglishDescription: "Prepends `0x01` domain separator byte to left and right sibling hashes and computes SHA-256.",
  },
  {
    functionName: "merkleTree(leaves)",
    sourceFile: "protocol/src/merkle.ts",
    purpose: "Build full Merkle tree & paths",
    plainEnglishDescription: "Builds bottom-up hash tree levels, handles odd leaves via RFC 6962 duplication, and computes audit paths for every leaf.",
  },
  {
    functionName: "verifyInclusion(leaf, proof)",
    sourceFile: "protocol/src/merkle.ts",
    purpose: "Client-side proof verification",
    plainEnglishDescription: "Reconstructs the root hash from a single student leaf and its sibling path, comparing it against the known tree root.",
  },
  {
    functionName: "sthSigningInput(sth)",
    sourceFile: "protocol/src/merkle.ts",
    purpose: "Signed Tree Head canonical serialization",
    plainEnglishDescription: "Formats `${treeSize}|${rootHex}|${timestamp}` as canonical bytes for institutional server signing.",
  },
];

export interface GlossaryTerm {
  term: string;
  category: "Identity" | "Cryptography" | "Protocol" | "Transparency";
  simpleExplanation: string;
  realWorldAnalogy: string;
  howProjectUsesIt: string;
  technicalDetails: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "SSI (Self-Sovereign Identity)",
    category: "Identity",
    simpleExplanation: "A digital identity model where the user owns and controls their credentials and cryptographic keys rather than relying on a centralized corporate identity provider.",
    realWorldAnalogy: "Carrying a physical driver's license in your wallet. You own the physical card and choose when to show it.",
    howProjectUsesIt: "Students hold their signing keys locally on their personal phones; their identity `punch:<org>:<roll>` is proven via signed proofs rather than passwords.",
    technicalDetails: "Based on W3C DID Core principles with local keypair generation and decentralized verification.",
  },
  {
    term: "DID (Decentralized Identifier)",
    category: "Identity",
    simpleExplanation: "A globally unique, cryptographically verifiable identifier string that does not require a centralized registration authority.",
    realWorldAnalogy: "An international passport number formatted with specific country codes.",
    howProjectUsesIt: "Formats student identities as `punch:TRUSTGRID:23CS101` inside the `PunchPayload.sid` field.",
    technicalDetails: "Custom lightweight DID method scheme `punch:<tenant>:<subject>`.",
  },
  {
    term: "Private Key",
    category: "Cryptography",
    simpleExplanation: "A secret piece of mathematical data that only your phone knows. Used to create digital signatures.",
    realWorldAnalogy: "Your personal wax seal stamp or a secret pen that only your hand can write with.",
    howProjectUsesIt: "Generated inside the student's browser with `extractable: false` and used to sign 3-second attendance punches.",
    technicalDetails: "NIST P-256 scalar coordinate `d`. Kept strictly in client storage; never transmitted across the network.",
  },
  {
    term: "Public Key",
    category: "Cryptography",
    simpleExplanation: "The public counterpart to your private key. Anyone can see it and use it to verify that a signature was genuinely created by your private key.",
    realWorldAnalogy: "A sample of your official signature published on an institutional bulletin board for comparison.",
    howProjectUsesIt: "Registered once with the server during enrollment (`POST /api/punch/enroll/finish`) and stored in the database.",
    technicalDetails: "Stored as EC JWK coordinates `{ kty: 'EC', crv: 'P-256', x: '...', y: '...' }`.",
  },
  {
    term: "Digital Signature",
    category: "Cryptography",
    simpleExplanation: "A mathematical code produced by a private key over specific data. Proves authenticity and detects any tampering.",
    realWorldAnalogy: "An unforgeable wax seal pressed onto a letter. If the letter is opened or altered, the seal shatters.",
    howProjectUsesIt: "Attached as the 3rd segment of the JWS token in the QR code.",
    technicalDetails: "ECDSA P-256 (r, s) integers encoded as 64 raw bytes and serialized to Base64URL.",
  },
  {
    term: "Hash / SHA-256",
    category: "Cryptography",
    simpleExplanation: "A one-way mathematical function that turns any input text into a fixed-length 64-character digital fingerprint.",
    realWorldAnalogy: "A blender: easy to blend fruit into a smoothie; impossible to turn the smoothie back into fruit.",
    howProjectUsesIt: "Used to compute key IDs (`kid`), hash attendance leaves, and build the Merkle tree.",
    technicalDetails: "256-bit Secure Hash Algorithm standard (FIPS 180-4).",
  },
  {
    term: "ECDSA",
    category: "Cryptography",
    simpleExplanation: "Elliptic Curve Digital Signature Algorithm — a modern type of cryptography that provides strong security with small key sizes.",
    realWorldAnalogy: "A high-security combination lock that uses geometric curve math instead of heavy bulky keys.",
    howProjectUsesIt: "The foundational signature algorithm powering the Punch protocol.",
    technicalDetails: "Operates over prime field $F_p$ with generator point $G$.",
  },
  {
    term: "ES256",
    category: "Cryptography",
    simpleExplanation: "The standard name for ECDSA using curve P-256 and SHA-256 hashing.",
    realWorldAnalogy: "The specific model number of an institutional security seal.",
    howProjectUsesIt: "Specified in the JWS header `alg: 'ES256'`.",
    technicalDetails: "Defined in RFC 7518 Section 3.1.",
  },
  {
    term: "P-256 (secp256r1)",
    category: "Cryptography",
    simpleExplanation: "The specific elliptic curve geometry used for generating keys in this protocol.",
    realWorldAnalogy: "The exact blueprint and dimensions used to manufacture standard security locks.",
    howProjectUsesIt: "Standard curve supported by all web browsers via WebCrypto and hardware chips (Secure Enclaves).",
    technicalDetails: "NIST curve with 256-bit prime modulus $p = 2^{256} - 2^{224} + 2^{192} + 2^{96} - 1$.",
  },
  {
    term: "JWS (JSON Web Signature)",
    category: "Protocol",
    simpleExplanation: "A standard way to format signed data so that web browsers and servers can easily read and verify it.",
    realWorldAnalogy: "A standard legal document format with a header, body, and signature block at the bottom.",
    howProjectUsesIt: "The QR code payload is formatted as a 3-part JWS: `Header.Payload.Signature`.",
    technicalDetails: "RFC 7515 standard with Base64URL compact serialization.",
  },
  {
    term: "JWK (JSON Web Key)",
    category: "Protocol",
    simpleExplanation: "A standard JSON format for saving and transmitting public keys.",
    realWorldAnalogy: "A business card that lists your public contact coordinates.",
    howProjectUsesIt: "The server stores student public keys as JWK JSON in SQLite/Postgres.",
    technicalDetails: "RFC 7517 specification (`kty`, `crv`, `x`, `y`).",
  },
  {
    term: "Nonce",
    category: "Protocol",
    simpleExplanation: "A random 'number used once' that makes every single punch unique, even if generated in the same second.",
    realWorldAnalogy: "A single-use raffle ticket stub with a unique serial number.",
    howProjectUsesIt: "Embedded in `PunchPayload.nonce` and tracked by the server in the database to prevent duplicate submissions.",
    technicalDetails: "8 random bytes (64 bits of entropy) from `crypto.getRandomValues()`.",
  },
  {
    term: "Time Slot",
    category: "Protocol",
    simpleExplanation: "A fixed 3-second time window. The QR code is tied to this slot and expires when the slot ends.",
    realWorldAnalogy: "A boarding pass that only allows entry during a 3-second gate window.",
    howProjectUsesIt: "Prevents screenshot sharing by making old codes invalid almost immediately.",
    technicalDetails: "`slot = floor(unixSeconds / 3)`. Checked on server against wall-clock time.",
  },
  {
    term: "Replay Attack",
    category: "Protocol",
    simpleExplanation: "An attack where an adversary records a valid message and tries to play it back later to trick the system.",
    realWorldAnalogy: "Photocopying a single-use concert ticket and trying to scan the photocopy at the entrance.",
    howProjectUsesIt: "Defeated by combining 3-second slot expiration with single-use nonce tracking.",
    technicalDetails: "Database query `prisma.punchEvent.findFirst({ where: { studentId, nonce } })` blocks reused nonces.",
  },
  {
    term: "Merkle Tree",
    category: "Transparency",
    simpleExplanation: "A cryptographic tree where pairs of records are hashed together until a single master root hash is created.",
    realWorldAnalogy: "A championship tournament bracket where winners advance round by round until one champion is crowned.",
    howProjectUsesIt: "Organizes all daily attendance records into an immutable audit tree.",
    technicalDetails: "Binary hash tree constructed per RFC 6962 with `0x00` leaf and `0x01` node domain prefixes.",
  },
  {
    term: "Merkle Root",
    category: "Transparency",
    simpleExplanation: "The single 32-byte top hash of a Merkle Tree representing the exact state of all attendance records.",
    realWorldAnalogy: "The final checksum or seal on a daily manifest of 1,000 cargo containers.",
    howProjectUsesIt: "Published daily at `GET /api/punch/merkle-root` for independent audit.",
    technicalDetails: "32-byte SHA-256 hash formatted as a 64-character hex string.",
  },
  {
    term: "Inclusion Proof",
    category: "Transparency",
    simpleExplanation: "A short list of sibling hashes that proves a specific student's record is included in the daily Merkle Root without needing the entire database.",
    realWorldAnalogy: "Showing just your branch of a family tree to prove you belong to the family lineage.",
    howProjectUsesIt: "Students can request `GET /api/punch/receipt/:roll` to get a cryptographic attendance receipt.",
    technicalDetails: "$O(\\log_2 N)$ sibling hash path that recomputes to the published root.",
  },
  {
    term: "Transparency Log",
    category: "Transparency",
    simpleExplanation: "An append-only audit log structured so that any deletion, insertion, or change to historical records is mathematically detectable.",
    realWorldAnalogy: "A notary public's bound daily ledger where every page number and entry is permanently recorded.",
    howProjectUsesIt: "Ensures teachers and administrators cannot secretly alter past attendance records without detection.",
    technicalDetails: "Inspired by RFC 6962 Certificate Transparency logs.",
  },
  {
    term: "Signed Tree Head (STH)",
    category: "Transparency",
    simpleExplanation: "An official cryptographic statement signed by the server certifying the tree size, root hash, and timestamp.",
    realWorldAnalogy: "An official dated, stamped, and signed seal from the university registrar on the day's attendance book.",
    howProjectUsesIt: "Provides cryptographic commitment to log state at a specific point in time.",
    technicalDetails: "Signature over canonical string `${treeSize}|${rootHex}|${timestamp}`.",
  },
  {
    term: "Base64URL",
    category: "Protocol",
    simpleExplanation: "A safe way to encode raw binary numbers (like cryptographic signatures) into plain letters and numbers suitable for URLs and QR codes.",
    realWorldAnalogy: "Translating Morse code or radio signals into simple alphanumeric text.",
    howProjectUsesIt: "Encodes JWS headers, payloads, signatures, and key IDs.",
    technicalDetails: "RFC 4648 Base64 variant using `-` and `_` with no `=` padding.",
  },
];
