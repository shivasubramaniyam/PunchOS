"use client";

import { useEffect, useState, useCallback } from "react";
import {
  createDemoSigningKeys,
  signDemoPunch,
  verifyDemoPunch,
  type DemoKeyPair,
} from "./CryptoDemos";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Unlock,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileEdit,
  Binary,
} from "lucide-react";

interface SignatureTamperDemoProps {
  difficulty: "beginner" | "technical";
}

export default function SignatureTamperDemo({
  difficulty,
}: SignatureTamperDemoProps) {
  const [keys, setKeys] = useState<DemoKeyPair | null>(null);
  const [loading, setLoading] = useState(true);

  // Original genuine message
  const [studentName, setStudentName] = useState("Shiva");
  const [rollNumber, setRollNumber] = useState("23CS101");
  const [slot, setSlot] = useState(593333333);
  const [nonce, setNonce] = useState("Lk73Pq99");

  // Signed outputs
  const [signatureData, setSignatureData] = useState<{
    jws: string;
    headerB64: string;
    payloadB64: string;
    sigB64: string;
    rawSigHex: string;
  } | null>(null);

  // Tamper state
  const [tamperedRoll, setTamperedRoll] = useState("23CS101");
  const [isTampered, setIsTampered] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean>(true);
  const [verifying, setVerifying] = useState(false);

  // Initialize browser WebCrypto keys
  const initKeys = useCallback(async () => {
    setLoading(true);
    try {
      const newKeys = await createDemoSigningKeys();
      setKeys(newKeys);

      const payload = {
        v: 1,
        kid: newKeys.keyId,
        sid: `punch:TRUSTGRID:${rollNumber}`,
        slot,
        nonce,
        iat: Math.floor(Date.now() / 1000),
      };

      const signed = await signDemoPunch(newKeys.keyPair.privateKey, payload);
      setSignatureData(signed);
      setTamperedRoll(rollNumber);
      setIsTampered(false);
      setVerificationResult(true);
    } catch (e) {
      console.error("WebCrypto init error:", e);
    } finally {
      setLoading(false);
    }
  }, [rollNumber, slot, nonce]);

  useEffect(() => {
    initKeys();
  }, []);

  // Re-verify whenever tampered roll or signature changes
  const runVerification = useCallback(
    async (currentTamperedRoll: string) => {
      if (!keys || !signatureData) return;
      setVerifying(true);

      try {
        const payloadToVerify = {
          v: 1,
          kid: keys.keyId,
          sid: `punch:TRUSTGRID:${currentTamperedRoll}`,
          slot,
          nonce,
          iat: Math.floor(Date.now() / 1000),
        };

        // Create the modified payload string
        const payloadB64ToCheck = btoa(JSON.stringify(payloadToVerify))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const isValid = await verifyDemoPunch(
          keys.keyPair.publicKey,
          signatureData.headerB64,
          payloadB64ToCheck,
          signatureData.sigB64
        );

        setVerificationResult(isValid);
      } catch {
        setVerificationResult(false);
      } finally {
        setVerifying(false);
      }
    },
    [keys, signatureData, slot, nonce]
  );

  const handleTamper = (newRoll: string) => {
    setTamperedRoll(newRoll);
    const modified = newRoll !== rollNumber;
    setIsTampered(modified);
    runVerification(newRoll);
  };

  const handleReset = () => {
    setTamperedRoll(rollNumber);
    setIsTampered(false);
    runVerification(rollNumber);
  };

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold font-mono">
              04
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Interactive Digital Signature &amp; Tamper Playground
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Experience how mathematics makes digital signatures tamper-proof. Try altering Shiva&apos;s roll number to Ravi&apos;s and watch the signature fail.
          </p>
        </div>
        <button
          onClick={initKeys}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Generate New Keypair
        </button>
      </div>

      {/* Visual Analogy Box */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Private Key Box */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <Lock className="h-4 w-4" />
              Private Key (Signing Secret)
            </div>
            <p className="mt-2 text-xs text-zinc-300">
              Kept strictly secret inside Shiva&apos;s device. Acts like an unforgeable personal wax stamp that creates the signature.
            </p>
            <div className="mt-3 font-mono text-[11px] text-rose-300/80 bg-zinc-950 p-2 rounded-lg border border-rose-900/40 truncate">
              🔐 P-256 Secret: [Protected inside Browser WebCrypto]
            </div>
          </div>

          {/* Public Key Box */}
          <div className="rounded-xl border border-teal-500/30 bg-teal-950/10 p-4">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
              <Unlock className="h-4 w-4" />
              Public Key (Verification Key)
            </div>
            <p className="mt-2 text-xs text-zinc-300">
              Shared with the college server. Anyone can use it to verify the signature, but nobody can use it to forge a new signature.
            </p>
            <div className="mt-3 font-mono text-[11px] text-teal-300/80 bg-zinc-950 p-2 rounded-lg border border-teal-900/40 truncate">
              🔓 Public ID: kid={keys?.keyId || "generating..."}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tamper Stage */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left Box: Original Signed Data */}
        <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              1. Original Message Signed by Shiva
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              WebCrypto ES256
            </span>
          </div>

          <div className="space-y-3 rounded-xl bg-zinc-900 p-4 border border-zinc-800 text-xs font-mono">
            <div className="flex justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-zinc-500">Student Name:</span>
              <span className="text-zinc-200 font-semibold">{studentName}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-zinc-500">Original Roll:</span>
              <span className="text-emerald-400 font-bold">{rollNumber}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-zinc-500">Time Slot:</span>
              <span className="text-zinc-300">{slot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Nonce:</span>
              <span className="text-zinc-300">{nonce}</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-zinc-400 mb-1.5">
              Generated 64-Byte Digital Signature (Hex):
            </div>
            <div className="rounded-xl bg-zinc-900 p-3 font-mono text-[10px] text-indigo-300 break-all border border-indigo-500/20 max-h-20 overflow-y-auto select-all">
              {signatureData?.rawSigHex || "Generating signature..."}
            </div>
          </div>
        </div>

        {/* Right Box: Tamper Playground & Verification Live Result */}
        <div
          className={`lg:col-span-6 rounded-2xl border p-5 space-y-4 transition-all ${
            isTampered
              ? "border-rose-500/40 bg-rose-950/10 shadow-lg shadow-rose-500/5"
              : "border-emerald-500/40 bg-emerald-950/10 shadow-lg shadow-emerald-500/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isTampered ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              <FileEdit className="h-4 w-4" />
              2. Tamper Test &amp; Verifier Engine
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                verificationResult
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/30"
              }`}
            >
              {verificationResult ? "✓ Signature Valid" : "✕ Signature Broken"}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Modify the Roll Number being checked:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tamperedRoll}
                onChange={(e) => handleTamper(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Enter roll number..."
              />
              <button
                onClick={() => handleTamper("23CS999 (Ravi)")}
                className="rounded-xl border border-rose-500/30 bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
              >
                Change to Ravi
              </button>
              {isTampered && (
                <button
                  onClick={handleReset}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Real-time Verification Result Callout */}
          <div
            className={`rounded-xl border p-4 text-xs ${
              verificationResult
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/30 bg-rose-500/10 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {verificationResult ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  AUTHENTIC: Data Matches Original Signature!
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                  TAMPER DETECTED: Signature Rejected!
                </>
              )}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed opacity-90">
              {verificationResult
                ? "The public key mathematically confirms that the message data has not been modified by even 1 single bit since Shiva stamped it."
                : `The verifier compared the modified data ("${tamperedRoll}") with Shiva's original signature. Because the data changed, the mathematical equation failed. Attendance is immediately denied.`}
            </p>
          </div>

          <p className="text-[11px] text-zinc-400 italic">
            💡 <strong>Crucial Rule:</strong> A public key can only{" "}
            <em>verify</em> signatures — it can NEVER be used to recreate or
            forge a valid signature for modified data.
          </p>
        </div>
      </div>
    </div>
  );
}
