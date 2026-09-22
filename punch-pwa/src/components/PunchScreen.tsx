"use client";

/**
 * Punch screen: renders the current capability as a QR and rotates it
 * exactly on the wall-clock slot boundary (every SLOT_SECONDS).
 *
 * Rendering is scheduled by the slot math itself — not a fixed interval —
 * so the code flips the instant the server's slot flips.
 */

import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

import { SLOT_SECONDS, signCurrentPunch } from "@/lib/protocol";
import { serverNow } from "@/lib/api";
import StudentAnalytics from "@/components/StudentAnalytics";

export interface PunchScreenProps {
  keyPair: CryptoKeyPair;
  kid: string;
  sid: string;
  onLogout: () => void;
}

interface QrState {
  dataUrl: string;
  slot: number;
  expiresIn: number;
}

export default function PunchScreen({ keyPair, kid, sid, onLogout }: PunchScreenProps) {
  const [state, setState] = useState<QrState | null>(null);
  const [progress, setProgress] = useState(1);
  const [punchCount, setPunchCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  const rollNumber = sid.split(":")[2] ?? sid;

  const renderSlot = useCallback(async () => {
    const now = serverNow();
    const signed = await signCurrentPunch(keyPair, { kid, sid, now });
    const dataUrl = await QRCode.toDataURL(signed.qr, {
      width: 280,
      margin: 2,
      color: { dark: "#0a0a0a", light: "#ffffff" },
      errorCorrectionLevel: "L",
    });
    setState({ dataUrl, slot: signed.slot, expiresIn: signed.expiresIn });
    setPunchCount((c) => c + 1);
  }, [keyPair, kid, sid]);

  useEffect(() => {
    let cancelled = false;

    const schedule = () => {
      const remaining = SLOT_SECONDS * 1000 - (serverNow() % (SLOT_SECONDS * 1000));
      timerRef.current = window.setTimeout(async () => {
        if (cancelled) return;
        await renderSlot();
        schedule();
      }, remaining);
    };

    (async () => {
      await renderSlot();
      schedule();
    })();

    return () => {
      cancelled = true;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [renderSlot]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((serverNow() % (SLOT_SECONDS * 1000)) / (SLOT_SECONDS * 1000));
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="punch-shell">
      <header className="punch-header">
        <div>
          <p className="punch-kicker">Show this code to the scanner</p>
          <h1 className="punch-title">{rollNumber}</h1>
        </div>
        <button className="btn-ghost" onClick={onLogout}>
          Lock
        </button>
      </header>

      <section className="qr-stage">
        {state ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.dataUrl}
              alt="Punch QR code"
              width={280}
              height={280}
              style={{ borderRadius: "var(--radius, 12px)", background: "#fff", padding: 12 }}
            />
            <div className="slot-meter" aria-hidden>
              <div className="slot-meter-fill" style={{ width: `${(1 - progress) * 100}%` }} />
            </div>
            <p className="slot-meta">
              slot {state.slot} · rotates in {Math.max(0, Math.ceil(state.expiresIn))}s
            </p>
          </>
        ) : (
          <p className="slot-meta">Signing first slot…</p>
        )}
      </section>

      {/* Apple Watch Activity Rings, Exam Predictor, Streak & Merkle Receipts */}
      <StudentAnalytics roll={rollNumber} />

      <footer className="punch-footer">
        <span className="live-pill">
          <span className="pulse-dot" /> hardware-signed · refreshed {punchCount}×
        </span>
        <p className="hint">
          Signed inside this device&apos;s secure hardware. A screenshot stops working after{" "}
          {SLOT_SECONDS}s.
        </p>
      </footer>
    </main>
  );
}
