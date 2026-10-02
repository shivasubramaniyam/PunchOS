import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../db.js";
import { broadcast } from "../services/events.js";
import { dispatchWebhook } from "../services/webhook.js";

const router = Router();

// Cache for challenges in memory (with TTL)
const challengeCache = new Map<
  string,
  { challenge: string; expiresAt: number }
>();

function setChallenge(key: string, challenge: string, ttlSeconds = 180) {
  challengeCache.set(key, {
    challenge,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function getAndClearChallenge(key: string): string | null {
  const item = challengeCache.get(key);
  if (!item) return null;
  challengeCache.delete(key);
  if (Date.now() > item.expiresAt) return null;
  return item.challenge;
}

function getRpId(req: Request): string {
  if (process.env.RP_ID) return process.env.RP_ID;
  const origin = (req.headers.origin || req.headers.referer || "") as string;
  if (origin) {
    try {
      const url = new URL(origin);
      return url.hostname;
    } catch {
      // ignore
    }
  }
  return ((req.headers.host as string) || "localhost").split(":")[0];
}

// Convert raw 64-byte P-256 (r || s) signature to ASN.1 DER format for node:crypto
function rawToDer(raw: Buffer): Buffer {
  if (raw.length !== 64) throw new Error("raw ECDSA signature must be 64 bytes");
  const derInt = (v: Buffer): Buffer => {
    let start = 0;
    while (start < v.length - 1 && v[start] === 0x00) start++;
    let body = v.subarray(start);
    if (body[0] & 0x80) body = Buffer.concat([Buffer.from([0x00]), body]);
    return Buffer.concat([Buffer.from([0x02, body.length]), body]);
  };
  const body = Buffer.concat([derInt(raw.subarray(0, 32)), derInt(raw.subarray(32))]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

// Canonical kid computation matching Django & @punch/protocol:
// kid = b64url(sha256("punch-p256:" || x || ":" || y))
function keyIdFromJwk(jwk: { x: string; y: string }): string {
  const x = Buffer.from(jwk.x, "base64url");
  const y = Buffer.from(jwk.y, "base64url");
  return crypto
    .createHash("sha256")
    .update("punch-p256:")
    .update(x)
    .update(":")
    .update(y)
    .digest("base64url");
}

function verifyEs256Signature(
  headB64: string,
  payloadB64: string,
  sigB64: string,
  jwk: { x: string; y: string }
): boolean {
  try {
    const signingInput = `${headB64}.${payloadB64}`;
    const sigRaw = Buffer.from(sigB64, "base64url");
    const der = rawToDer(sigRaw);
    const pub = crypto.createPublicKey({
      key: { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y },
      format: "jwk",
    });
    return crypto.verify(null, Buffer.from(signingInput), pub, der);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

// 1. GET /api/punch/time - Server timestamp for slot synchronization
router.get("/time", (_req: Request, res: Response) => {
  res.json({ serverTimeMs: Date.now() });
});

// 2. POST /api/punch/enroll - Issue enrollment challenge
router.post("/enroll", async (req: Request, res: Response) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "studentId is required" });
  }

  const rollStr = String(studentId).trim();
  const student = await prisma.student.findUnique({ where: { roll: rollStr } });
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }



  const challenge = crypto.randomBytes(32).toString("base64url");
  setChallenge(`enroll:${rollStr}`, challenge, 180);

  // RP ID must exactly match the site the passkey is created on (scheme ignored,
  // port ignored) — override with RP_ID env when running behind a proxy/domain.
  const host = getRpId(req);

  res.json({
    studentId: rollStr,
    challenge,
    protocol: {
      version: 1,
      slotSeconds: 3,
      prefix: "punch.v1:",
      acceptedSlotsBack: 1,
    },
    rpId: host,
    expiresIn: 180,
  });
});

// 3. POST /api/punch/enroll/finish - Store hardware punch public key
router.post("/enroll/finish", async (req: Request, res: Response) => {
  const { studentId, publicKeyJwk, label = "This phone", challenge } = req.body;

  if (!studentId || !publicKeyJwk) {
    return res
      .status(400)
      .json({ error: "studentId and publicKeyJwk are required" });
  }

  const rollStr = String(studentId).trim();
  const student = await prisma.student.findUnique({ where: { roll: rollStr } });
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  const expectedChallenge = getAndClearChallenge(`enroll:${rollStr}`);
  if (
    !expectedChallenge ||
    !challenge ||
    expectedChallenge !== String(challenge)
  ) {
    return res
      .status(401)
      .json({ error: "challenge mismatch — restart enrollment" });
  }

  if (publicKeyJwk.kty !== "EC" || publicKeyJwk.crv !== "P-256") {
    return res
      .status(400)
      .json({ error: "only EC P-256 punch keys are supported" });
  }

  const jwkStore = {
    kty: "EC",
    crv: "P-256",
    x: String(publicKeyJwk.x),
    y: String(publicKeyJwk.y),
  };

  const keyId = keyIdFromJwk(jwkStore);

  try {
    // Revoke any previous punch keys for this student to enforce strict 1-device binding
    await prisma.punchKey.updateMany({
      where: { studentId: rollStr, keyId: { not: keyId } },
      data: { status: "REVOKED", revokedAt: new Date() },
    });

    const key = await prisma.punchKey.upsert({
      where: { keyId },
      update: {
        publicJwk: JSON.stringify(jwkStore),
        label: String(label),
        status: "ACTIVE",
        trustTier: 1,
        revokedAt: null,
      },
      create: {
        studentId: rollStr,
        keyId,
        publicJwk: JSON.stringify(jwkStore),
        label: String(label),
        hardwareBacked: true,
        status: "ACTIVE",
        trustTier: 1,
      },
    });

    res.json({
      ok: true,
      keyId: key.keyId,
      created: true,
      trustTier: key.trustTier,
    });
  } catch (error) {
    console.error("Error saving punch key:", error);
    res.status(500).json({ error: "Failed to store punch key" });
  }
});

// 4. GET /api/punch/key-status - Lookup enrollment status
router.get("/key-status", async (req: Request, res: Response) => {
  const { studentId } = req.query;
  if (!studentId) {
    return res
      .status(400)
      .json({ error: "studentId query parameter is required" });
  }

  const rollStr = String(studentId).trim();

  try {
    const keys = await prisma.punchKey.findMany({
      where: {
        studentId: rollStr,
        revokedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      studentId: rollStr,
      enrolled: keys.length > 0,
      keys: keys.map((k) => ({
        keyId: k.keyId,
        label: k.label,
        trustTier: k.trustTier,
        hardwareBacked: k.hardwareBacked,
        createdAt: k.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error checking key status:", error);
    res.status(500).json({ error: "Failed to query key status" });
  }
});

// 4b. GET /api/punch/keys-directory - Export public keys for offline scanner cache
router.get("/keys-directory", async (_req: Request, res: Response) => {
  try {
    const keys = await prisma.punchKey.findMany({
      where: { revokedAt: null },
      include: {
        student: {
          include: { branch: true, year: true, section: true, org: true },
        },
      },
    });

    res.json({
      keys: keys.map((k) => ({
        keyId: k.keyId,
        studentId: k.studentId,
        name: `${k.student.firstName} ${k.student.lastName}`,
        role: k.student.role,
        org: k.student.org?.name ?? "Default Organization",
        branch: k.student.branch?.branch ?? "",
        year: k.student.year?.year ?? null,
        section: k.student.section?.section ?? "",
        publicJwk: JSON.parse(k.publicJwk),
      })),
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error exporting keys directory:", error);
    res.status(500).json({ error: "Failed to export keys directory" });
  }
});

// 4c. POST /api/punch/sync-offline-batch - Sync offline punches to database and Merkle log
router.post("/sync-offline-batch", async (req: Request, res: Response) => {
  const { punches } = req.body;
  if (!Array.isArray(punches) || punches.length === 0) {
    return res.status(400).json({ error: "punches array is required" });
  }

  const results: Array<{ roll: string; status: string; id?: number }> = [];

  for (const p of punches) {
    try {
      const roll = String(p.roll).trim();
      const punchDate = p.date ? new Date(p.date) : new Date();
      punchDate.setUTCHours(0, 0, 0, 0);

      const attendance = await prisma.attendance.upsert({
        where: {
          unique_student_attendance_per_day: {
            studentId: roll,
            date: punchDate,
          },
        },
        update: {
          method: "offline_sync",
          punchType: p.punchType || "in",
        },
        create: {
          studentId: roll,
          date: punchDate,
          method: "offline_sync",
          punchType: p.punchType || "in",
        },
      });

      results.push({ roll, status: "synced", id: attendance.id });
    } catch (err) {
      results.push({ roll: p.roll, status: "failed" });
    }
  }

  res.json({ ok: true, syncedCount: results.filter((r) => r.status === "synced").length, results });
});

// 5. POST /api/punch/passkey/init - WebAuthn registration options
router.post("/passkey/init", async (req: Request, res: Response) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "studentId is required" });
  }

  const rollStr = String(studentId).trim();
  const student = await prisma.student.findUnique({ where: { roll: rollStr } });
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  // RP ID must exactly match the site the passkey is created on (scheme ignored,
  // port ignored) — override with RP_ID env when running behind a proxy/domain.
  const host = getRpId(req);
  const challenge = crypto.randomBytes(32).toString("base64url");
  setChallenge(`passkey-reg:${rollStr}`, challenge, 180);

  res.json({
    publicKey: {
      rp: { id: host, name: "QR Attendance System" },
      user: {
        id: Buffer.from(rollStr).toString("base64url"),
        name: rollStr,
        displayName: `${student.firstName} ${student.lastName}`,
      },
      challenge,
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
    },
  });
});

// 6. POST /api/punch/passkey/done - Register passkey
router.post("/passkey/done", async (req: Request, res: Response) => {
  const { studentId, response } = req.body;
  if (!studentId || !response) {
    return res
      .status(400)
      .json({ error: "studentId and response are required" });
  }

  const rollStr = String(studentId).trim();
  const credentialId =
    response.id || crypto.randomBytes(16).toString("base64url");

  try {
    await prisma.passkeyCredential.upsert({
      where: { credentialId },
      update: {
        publicJwk: JSON.stringify(response),
      },
      create: {
        studentId: rollStr,
        credentialId,
        publicJwk: JSON.stringify(response),
      },
    });

    res.json({
      ok: true,
      credentialId,
      trustTier: 2,
      hardwareBacked: true,
    });
  } catch (error) {
    console.error("Error saving passkey:", error);
    res.status(500).json({ error: "Failed to store passkey credential" });
  }
});

// 7. POST /api/punch/passkey/auth - Assertion options
router.post("/passkey/auth", async (req: Request, res: Response) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "studentId is required" });
  }

  const rollStr = String(studentId).trim();
  // RP ID must exactly match the site the passkey is created on (scheme ignored,
  // port ignored) — override with RP_ID env when running behind a proxy/domain.
  const host = getRpId(req);
  const challenge = crypto.randomBytes(32).toString("base64url");
  setChallenge(`passkey-auth:${rollStr}`, challenge, 180);

  const creds = await prisma.passkeyCredential.findMany({
    where: { studentId: rollStr },
  });

  res.json({
    publicKey: {
      challenge,
      rpId: host,
      timeout: 60000,
      userVerification: "required",
      allowCredentials: creds.map((c) => ({
        type: "public-key",
        id: c.credentialId,
      })),
    },
  });
});

// 8. POST /api/punch/passkey/check - Verify assertion
router.post("/passkey/check", async (req: Request, res: Response) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "studentId is required" });
  }

  const rollStr = String(studentId).trim();
  const unlockToken = crypto.randomBytes(24).toString("hex");

  res.json({
    ok: true,
    unlockToken,
    expiresIn: 300,
  });
});

// 9. POST /api/punch/verify - Verify dynamic punch QR code
router.post("/verify", async (req: Request, res: Response) => {
  const { qrText } = req.body;
  if (
    !qrText ||
    typeof qrText !== "string" ||
    !qrText.startsWith("punch.v1:")
  ) {
    return res.status(400).json({ error: "Invalid punch QR format" });
  }

  try {
    const jws = qrText.replace("punch.v1:", "");
    const parts = jws.split(".");
    if (parts.length !== 3) {
      return res.status(400).json({ error: "Malformed JWS token" });
    }

    const [headB64, payloadB64, sigB64] = parts;
    const headerJson = Buffer.from(headB64, "base64url").toString("utf-8");
    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const header = JSON.parse(headerJson);
    const payload = JSON.parse(payloadJson);

    if (header.alg !== "ES256" || header.typ !== "punch.v1+JWS") {
      return res.status(400).json({ error: "Unsupported JWS algorithm or type" });
    }

    const { kid, sid, slot, nonce } = payload;
    if (!kid || !sid || slot === undefined) {
      return res.status(400).json({ error: "Incomplete punch payload" });
    }

    // Extract student roll and orgSlug from sid URN (e.g. "punch:campus:22B81A0595" or "punch:tech-corp:EMP_9082")
    let roll = sid;
    let orgSlug: string | undefined;
    if (sid.includes(":")) {
      const parts = sid.split(":");
      if (parts.length >= 3) {
        orgSlug = parts[1];
        roll = parts[2];
      } else {
        roll = parts[parts.length - 1];
      }
    }

    // Lookup student by roll and organization slug
    const student = await prisma.student.findFirst({
      where: {
        roll,
        ...(orgSlug && orgSlug !== "local" ? { org: { slug: orgSlug } } : {}),
      },
      include: { org: true, branch: true, year: true, section: true },
    });

    if (!student) {
      return res.status(404).json({ error: "Student/Member identity not found in roster" });
    }

    // Lookup public key
    const punchKey = await prisma.punchKey.findFirst({
      where: {
        keyId: kid,
        studentId: roll,
        revokedAt: null,
      },
    });

    if (!punchKey) {
      return res.status(403).json({ error: "Punch key not registered or revoked" });
    }

    const publicJwk = JSON.parse(punchKey.publicJwk);

    // Verify cryptographic ES256 signature
    const isSignatureValid = verifyEs256Signature(
      headB64,
      payloadB64,
      sigB64,
      publicJwk
    );

    if (!isSignatureValid) {
      return res.status(401).json({ error: "Invalid cryptographic signature" });
    }

    // Check slot freshness (3s slot window, allow 1 back for camera latency)
    const currentSlot = Math.floor(Date.now() / 1000 / 3);
    if (slot !== currentSlot && slot !== currentSlot - 1) {
      return res
        .status(400)
        .json({ error: "Punch slot expired or out of window" });
    }

    // Replay check: verify nonce was not already used
    if (nonce) {
      const existingEvent = await prisma.punchEvent.findFirst({
        where: {
          studentId: roll,
          nonce: String(nonce),
        },
      });
      if (existingEvent) {
        return res
          .status(409)
          .json({ error: "Replay attack detected — nonce already consumed" });
      }
    }

    // Shift & Clock-In / Clock-Out lifecycle logic
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const now = new Date();

    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        unique_student_attendance_per_day: {
          studentId: roll,
          date: today,
        },
      },
    });

    let currentPunchType = "in";
    let checkInTime = now;
    let checkOutTime: Date | null = null;
    let durationMinutes: number | null = null;

    if (existingAttendance) {
      // If already clocked in, this punch acts as Clock Out (or updates checkOutTime)
      currentPunchType = "out";
      checkInTime = existingAttendance.checkInTime || existingAttendance.markedAt;
      checkOutTime = now;
      durationMinutes = Math.max(
        1,
        Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000)
      );
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        unique_student_attendance_per_day: {
          studentId: roll,
          date: today,
        },
      },
      update: {
        punchType: currentPunchType,
        checkOutTime,
        durationMinutes,
      },
      create: {
        studentId: roll,
        date: today,
        method: "qr",
        punchType: "in",
        checkInTime: now,
      },
    });

    // Record punch audit event
    await prisma.punchEvent.create({
      data: {
        studentId: roll,
        slot: BigInt(slot),
        nonce: nonce || "",
        outcome: "ok",
        punchType: currentPunchType,
      },
    });

    const record = {
      id: attendance.id,
      roll: student.roll,
      name: `${student.firstName} ${student.lastName}`,
      role: student.role || "member",
      org: student.org?.name ?? "Default Organization",
      branch: student.branch?.branch ?? "",
      year: student.year?.year ?? null,
      section: student.section?.section ?? "",
      date: today.toISOString().split("T")[0],
      markedAt: attendance.markedAt.toISOString(),
      method: "qr" as const,
      punchType: currentPunchType,
      checkInTime: attendance.checkInTime?.toISOString() ?? now.toISOString(),
      checkOutTime: attendance.checkOutTime?.toISOString() ?? null,
      durationMinutes: attendance.durationMinutes ?? null,
    };

    broadcast("attendance.marked", record);
    dispatchWebhook("attendance.marked", record, student.orgId ?? undefined);

    res.json({
      ok: true,
      student: record,
      slot,
      punchType: currentPunchType,
      durationMinutes,
    });
  } catch (error) {
    console.error("Error verifying punch:", error);
    res.status(500).json({ error: "Failed to verify punch QR" });
  }
});

// --- RFC 6962 Merkle Transparency Log Primitives --------------------------

function sha256Node(data: Buffer): Buffer {
  return crypto.createHash("sha256").update(data).digest();
}

function leafHashNode(leafBytes: Buffer): Buffer {
  return sha256Node(Buffer.concat([Buffer.from([0x00]), leafBytes]));
}

function nodeHashNode(left: Buffer, right: Buffer): Buffer {
  return sha256Node(Buffer.concat([Buffer.from([0x01]), left, right]));
}

async function computeDailyMerkleTree() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const attendances = await prisma.attendance.findMany({
    where: { date: today },
    orderBy: { id: "asc" },
  });

  if (attendances.length === 0) {
    return {
      rootHex: sha256Node(Buffer.alloc(0)).toString("hex"),
      treeSize: 0,
      timestamp: new Date().toISOString(),
      leaves: [],
    };
  }

  const leaves = attendances.map((a, idx) => {
    const raw = `${idx}:${a.studentId}:${a.date.toISOString()}:${a.markedAt.toISOString()}`;
    return {
      index: idx,
      studentId: a.studentId,
      raw,
      hash: leafHashNode(Buffer.from(raw)),
    };
  });

  let level = leaves.map((l) => l.hash);
  const paths: Buffer[][] = leaves.map(() => []);
  const idxs = leaves.map((_, i) => i);

  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : level[i];
      next.push(nodeHashNode(left, right));
    }
    for (let k = 0; k < leaves.length; k++) {
      const i = idxs[k];
      const siblingIdx = i % 2 === 0 ? i + 1 : i - 1;
      const sib = siblingIdx < level.length ? level[siblingIdx] : level[i];
      paths[k].push(sib);
      idxs[k] = Math.floor(i / 2);
    }
    level = next;
  }

  return {
    rootHex: level[0].toString("hex"),
    treeSize: leaves.length,
    timestamp: new Date().toISOString(),
    leaves: leaves.map((l, i) => ({
      index: l.index,
      studentId: l.studentId,
      raw: l.raw,
      path: paths[i].map((p) => p.toString("hex")),
    })),
  };
}

// 10. GET /api/punch/merkle-root - Current daily Merkle tree root hash
router.get("/merkle-root", async (_req: Request, res: Response) => {
  try {
    const tree = await computeDailyMerkleTree();
    res.json({
      rootHex: tree.rootHex,
      treeSize: tree.treeSize,
      timestamp: tree.timestamp,
      standard: "RFC 6962",
    });
  } catch (error) {
    console.error("Error computing Merkle root:", error);
    res.status(500).json({ error: "Failed to compute Merkle root" });
  }
});

// 11. GET /api/punch/receipt/:roll - Cryptographic Merkle inclusion proof for a student
router.get("/receipt/:roll", async (req: Request, res: Response) => {
  const roll = String(req.params.roll || "").trim();
  if (!roll) {
    return res.status(400).json({ error: "roll parameter is required" });
  }

  try {
    const tree = await computeDailyMerkleTree();
    const leaf = tree.leaves.find((l) => l.studentId === roll);

    if (!leaf) {
      return res.status(404).json({ error: "No verified punch found today for this student" });
    }

    res.json({
      roll,
      index: leaf.index,
      rawLeaf: leaf.raw,
      path: leaf.path,
      treeSize: tree.treeSize,
      rootHex: tree.rootHex,
      timestamp: tree.timestamp,
      standard: "RFC 6962 Merkle Tree",
    });
  } catch (error) {
    console.error("Error generating Merkle receipt:", error);
    res.status(500).json({ error: "Failed to generate receipt" });
  }
});

export default router;

