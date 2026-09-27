"use client";

import { useState } from "react";
import {
  QrCode,
  FileCode,
  Key,
  ShieldCheck,
  Clock,
  RotateCcw,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Layers,
} from "lucide-react";

interface VerificationPipelineVisualizerProps {
  difficulty: "beginner" | "technical";
}

type ScenarioType = "valid" | "tampered_sig" | "expired_slot" | "reused_nonce" | "unknown_student";

interface PipelineStep {
  id: string;
  name: string;
  description: string;
  evaluates: (scenario: ScenarioType) => {
    passed: boolean;
    statusText: string;
    detail: string;
  };
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "decode",
    name: "1. Decode QR Text",
    description: "Unpack prefix 'punch.v1:' and parse 3 Base64URL JWS segments (Header, Payload, Signature).",
    evaluates: () => ({
      passed: true,
      statusText: "JWS Valid",
      detail: "Header: ES256, typ: punch.v1+JWS. Payload parsed successfully.",
    }),
  },
  {
    id: "read_kid",
    name: "2. Read Key ID (kid)",
    description: "Extract the public key fingerprint from payload to locate the student's registered key.",
    evaluates: (s) => ({
      passed: s !== "unknown_student",
      statusText: s === "unknown_student" ? "No Key Found" : "Key Found",
      detail:
        s === "unknown_student"
          ? "No public key registered for this key identifier in database."
          : "Matched registered device key: kid=punch-p256:9b4f2c...",
    }),
  },
  {
    id: "verify_sig",
    name: "3. Verify ES256 Signature",
    description: "Perform ECDSA P-256 cryptographic check using the registered public key.",
    evaluates: (s) => ({
      passed: s !== "tampered_sig" && s !== "unknown_student",
      statusText: s === "tampered_sig" ? "Invalid Signature" : "Signature Authentic",
      detail:
        s === "tampered_sig"
          ? "CRITICAL: Signature does not match payload. Data was altered or forged."
          : "ECDSA math verified: signature was produced by the matching private key.",
    }),
  },
  {
    id: "check_slot",
    name: "4. Validate Time Slot",
    description: "Check if slot is current (within active 3s window or 1 backward grace slot).",
    evaluates: (s) => ({
      passed: s !== "expired_slot",
      statusText: s === "expired_slot" ? "Slot Expired" : "Slot Current",
      detail:
        s === "expired_slot"
          ? "Slot is older than acceptable tolerance window (T - 12.0s). Screenshot rejected."
          : "Slot is active (within 3 seconds of wall-clock time).",
    }),
  },
  {
    id: "check_nonce",
    name: "5. Nonce Replay Guard",
    description: "Query database PunchEvent table to ensure this nonce was never consumed.",
    evaluates: (s) => ({
      passed: s !== "reused_nonce",
      statusText: s === "reused_nonce" ? "Replay Detected" : "Nonce Fresh",
      detail:
        s === "reused_nonce"
          ? "CONFLICT: Nonce 'Lk73Pq99' was already used for attendance at 10:00:01 AM."
          : "Nonce is completely unique; no previous record found.",
    }),
  },
  {
    id: "check_enrollment",
    name: "6. Check Enrollment Roster",
    description: "Verify that student is active in the academic roster for this class/session.",
    evaluates: (s) => ({
      passed: s !== "unknown_student",
      statusText: s === "unknown_student" ? "Not Enrolled" : "Enrolled (CSE Y3)",
      detail:
        s === "unknown_student"
          ? "Student roll number is not enrolled in this department roster."
          : "Shiva Subramaniam (23CS101) enrolled in CSE 3rd Year Section A.",
    }),
  },
  {
    id: "mark_record",
    name: "7. Mark Attendance & SSE",
    description: "Insert unique daily attendance record into database and trigger live SSE chime.",
    evaluates: (s) => ({
      passed: s === "valid",
      statusText: s === "valid" ? "Saved & Broadcasted" : "Skipped (Check Failed)",
      detail:
        s === "valid"
          ? "Database attendance row inserted. Faculty terminal plays success chime."
          : "Attendance insertion aborted due to preceding verification failure.",
    }),
  },
  {
    id: "merkle_append",
    name: "8. Append to Merkle Log",
    description: "Hash attendance record into today's RFC 6962 transparency log tree.",
    evaluates: (s) => ({
      passed: s === "valid",
      statusText: s === "valid" ? "Included in Merkle Tree" : "Skipped",
      detail:
        s === "valid"
          ? "Leaf hashed and merged into daily Merkle Root for tamper-proof auditing."
          : "Record omitted from Merkle transparency log.",
    }),
  },
];

export default function VerificationPipelineVisualizer({
  difficulty,
}: VerificationPipelineVisualizerProps) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("valid");
  const [activeStepDetail, setActiveStepDetail] = useState<string>("verify_sig");

  const isOverallSuccess = selectedScenario === "valid";

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
              08
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              What Happens When the Scanner Reads a QR?
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            The 8-stage zero-trust verification pipeline executed by the server in less than 20 milliseconds.
          </p>
        </div>
      </div>

      {/* Scenario Selector Buttons */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-1">
          Select Simulation Scenario:
        </span>
        <button
          onClick={() => setSelectedScenario("valid")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
            selectedScenario === "valid"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          ✓ Genuine Student (Shiva)
        </button>
        <button
          onClick={() => setSelectedScenario("tampered_sig")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
            selectedScenario === "tampered_sig"
              ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-500/10"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          ✕ Tampered QR (Fake Data)
        </button>
        <button
          onClick={() => setSelectedScenario("expired_slot")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
            selectedScenario === "expired_slot"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          ✕ Screenshot (Expired Slot)
        </button>
        <button
          onClick={() => setSelectedScenario("reused_nonce")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
            selectedScenario === "reused_nonce"
              ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/10"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          ✕ Replay Attack (Reused Nonce)
        </button>
      </div>

      {/* Verification Pipeline Stage */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left: 8 Pipeline Steps List */}
        <div className="lg:col-span-7 space-y-2">
          {PIPELINE_STEPS.map((step) => {
            const res = step.evaluates(selectedScenario);
            const isSelected = activeStepDetail === step.id;

            return (
              <div
                key={step.id}
                onClick={() => setActiveStepDetail(step.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "ring-2 ring-emerald-500/40 bg-zinc-900 border-zinc-700 shadow-md"
                    : "bg-zinc-950/70 border-zinc-800/80 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-xl font-bold text-xs ${
                      res.passed
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {res.passed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {step.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 line-clamp-1">
                      {step.description}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    res.passed
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  {res.statusText}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Step Details & Overall Verdict */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Step Explanation Card */}
          {(() => {
            const currentStep =
              PIPELINE_STEPS.find((s) => s.id === activeStepDetail) ||
              PIPELINE_STEPS[2];
            const currentRes = currentStep.evaluates(selectedScenario);

            return (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Step Inspection
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      currentRes.passed
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {currentRes.passed ? "✓ Passed" : "✕ Failed"}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">
                  {currentStep.name}
                </h4>
                <p className="text-xs text-zinc-300">
                  {currentStep.description}
                </p>

                <div
                  className={`rounded-xl p-3 border text-xs font-mono ${
                    currentRes.passed
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-950/20 border-rose-500/30 text-rose-300"
                  }`}
                >
                  {currentRes.detail}
                </div>
              </div>
            );
          })()}

          {/* Overall Pipeline Outcome */}
          <div
            className={`rounded-2xl border p-5 ${
              isOverallSuccess
                ? "border-emerald-500/40 bg-emerald-950/15"
                : "border-rose-500/40 bg-rose-950/15"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {isOverallSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="text-emerald-300">
                    ATTENDANCE ACCEPTED (200 OK)
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-400" />
                  <span className="text-rose-300">
                    ATTENDANCE REJECTED (401 / 400 / 409)
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
              {isOverallSuccess
                ? "All 8 cryptographic, temporal, and database validation checks passed. Shiva is recorded present and live SSE audio chime sounds on the faculty terminal."
                : "The zero-trust pipeline halted execution at the failed check. No database record was created, and the terminal rejected the invalid punch."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
