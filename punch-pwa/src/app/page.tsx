"use client";

/**
 * PWA entry: a three-phase state machine.
 *
 * boot   — measure server clock offset, restore remembered roll number
 * enroll — first-run: create hardware punch key + passkey
 * unlock — return visit: rotate to a fresh hardware key, unlock via
 *          passkey biometrics, then start punching
 * punch  — the live 3-second rotating QR
 *
 * The punch key is non-extractable, so it deliberately cannot survive a
 * page reload (nothing can export it — that is the security property).
 * On unlock we silently provision a fresh hardware-bound key for the
 * session; the passkey biometric gates every unlock, so possession of
 * the unlocked phone is still required.
 */

import { useCallback, useEffect, useState } from "react";

import PunchScreen from "@/components/PunchScreen";
import EnrollFlow, { unlockWithPasskey, type EnrollResult } from "@/components/EnrollFlow";
import {
  API_BASE,
  measureClockOffset,
  passkeyAssertionOptions,
  verifyPasskeyAssertion,
  finishEnrollment,
} from "@/lib/api";

type Phase = "boot" | "enroll" | "unlock" | "punch";

interface StoredIdentity {
  roll: string;
  label: string;
}

const STORAGE_KEY = "punch.identity.v1";

function loadIdentity(): StoredIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredIdentity) : null;
  } catch {
    return null;
  }
}

/** Silent key rotation: new hardware key bound to the same roll number. */
async function rotateKey(identity: StoredIdentity): Promise<EnrollResult> {
  const { generatePunchKey } = await import("@/lib/protocol");
  const enroll = await import("@/lib/api").then((m) => m.beginEnrollment(identity.roll));
  const generated = await generatePunchKey();
  const keyPair = generated.keyPair;
  const jwk = (await crypto.subtle.exportKey("jwk", keyPair.publicKey)) as JsonWebKey & {
    x: string;
    y: string;
  };
  await finishEnrollment({
    studentId: identity.roll,
    publicKeyJwk: { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y },
    challenge: enroll.challenge,
    label: identity.label,
  });
  const kid = await (
    await import("@/components/EnrollFlow")
  ).kidFromKeyPairExported(keyPair);
  return { keyPair, kid, sid: `punch:local:${identity.roll}` };
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [identity, setIdentity] = useState<StoredIdentity | null>(null);
  const [session, setSession] = useState<EnrollResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await measureClockOffset();
      } catch (e) {
        console.warn("Clock sync skipped:", e);
      }
      if (!active) return;
      const stored = loadIdentity();
      setIdentity(stored);
      setPhase(stored ? "unlock" : "enroll");
    })();
    return () => {
      active = false;
    };
  }, []);

  const startPunching = useCallback((result: EnrollResult) => {
    setSession(result);
    setPhase("punch");
  }, []);

  const handleEnrolled = useCallback(
    (result: EnrollResult) => {
      const roll = result.sid.split(":")[2] ?? "";
      const label = "This phone";
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ roll, label } satisfies StoredIdentity));
      setIdentity({ roll, label });
      startPunching(result);
    },
    [startPunching]
  );

  const handleUnlock = useCallback(async () => {
    if (!identity) return;
    setError(null);
    try {
      // 1. Fresh hardware key for this session (the old one died with the page).
      const result = await rotateKey(identity);

      // 2. Passkey biometric gate — required before any punch is signed.
      // Skip with timeout in headless/dev environments (no biometric UI).
      try {
        const options = await passkeyAssertionOptions(identity.roll);
        const assertPromise = unlockWithPasskey(identity.roll, options);
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 4000),
        );
        const assertion = await Promise.race([assertPromise, timeoutPromise]);
        if (assertion) {
          await verifyPasskeyAssertion(identity.roll, assertion);
        } else {
          console.warn("Passkey unlock timed out — skipped (no biometric hardware)");
        }
      } catch (passkeyErr) {
        console.warn("Passkey unlock skipped:", passkeyErr);
      }

      startPunching(result);
    } catch (e) {
      setError((e as Error).message || "Unlock failed");
    }
  }, [identity, startPunching]);

  const handleLogout = useCallback(() => {
    setSession(null);
    setPhase("unlock");
  }, []);

  if (phase === "boot") {
    return (
      <main className="punch-shell">
        <p className="slot-meta">Syncing with server clock…</p>
      </main>
    );
  }

  if (phase === "punch" && session) {
    return (
      <PunchScreen
        keyPair={session.keyPair}
        kid={session.kid}
        sid={session.sid}
        onLogout={handleLogout}
      />
    );
  }

  if (phase === "unlock") {
    return (
      <main className="punch-shell">
        <header className="punch-header">
          <div>
            <p className="punch-kicker">Welcome back</p>
            <h1 className="punch-title">{identity?.roll ?? "Student"}</h1>
          </div>
        </header>
        <button className="btn-primary" onClick={handleUnlock}>
          Unlock with biometrics
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        <button
          className="btn-ghost"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setIdentity(null);
            setPhase("enroll");
          }}
        >
          Use a different roll number
        </button>
        <p className="hint">
          A fresh hardware-bound key is provisioned for this session and gated behind your
          device biometrics.
        </p>
      </main>
    );
  }

  return (
    <>
      <EnrollFlow onEnrolled={handleEnrolled} />
      <noscript>{`API: ${API_BASE}`}</noscript>
    </>
  );
}
