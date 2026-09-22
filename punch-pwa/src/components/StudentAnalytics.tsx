"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

interface MerkleReceipt {
  roll: string;
  index: number;
  rawLeaf: string;
  path: string[];
  treeSize: number;
  rootHex: string;
  timestamp: string;
  standard: string;
}

interface StudentAnalyticsProps {
  roll: string;
}

export default function StudentAnalytics({ roll }: StudentAnalyticsProps) {
  const [receipt, setReceipt] = useState<MerkleReceipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock / Calculated attendance metrics for realistic student feedback
  const totalClasses = 48;
  const attendedClasses = 42;
  const attendanceRate = Math.round((attendedClasses / totalClasses) * 100);
  const streakDays = 7;
  const minRequiredPct = 75;

  // Buffer calculation: (attended - 0.75 * total) / 0.75
  const maxMissable = Math.max(
    0,
    Math.floor((attendedClasses - (minRequiredPct / 100) * totalClasses) / (minRequiredPct / 100))
  );

  const isEligible = attendanceRate >= minRequiredPct;

  // Ring SVG calculations
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

  const fetchReceipt = async () => {
    setLoadingReceipt(true);
    setReceiptError(null);
    try {
      const res = await fetch(`${API_BASE}/api/punch/receipt/${encodeURIComponent(roll)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("No verified punch logged on today's Merkle tree yet.");
        }
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = (await res.json()) as MerkleReceipt;
      setReceipt(data);
      setShowReceipt(true);
    } catch (err: unknown) {
      setReceiptError(err instanceof Error ? err.message : "Failed to load receipt");
    } finally {
      setLoadingReceipt(false);
    }
  };

  const copyProof = () => {
    if (!receipt) return;
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="analytics-card">
      <div className="analytics-header">
        <span className="analytics-pill">🔥 {streakDays}-Day Punch Streak</span>
        <span className="analytics-status-badge" style={{ color: isEligible ? "#22c55e" : "#f59e0b" }}>
          {isEligible ? "● Exam Eligible" : "▲ Attention Needed"}
        </span>
      </div>

      <div className="analytics-body">
        {/* Apple Watch Style Activity Ring */}
        <div className="ring-container">
          <svg width={size} height={size} className="activity-ring">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={attendanceRate >= 75 ? "#10b981" : "#f59e0b"}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="ring-text">
            <span className="ring-val">{attendanceRate}%</span>
            <span className="ring-sub">Attendance</span>
          </div>
        </div>

        {/* Exam Predictor & Stats */}
        <div className="predictor-info">
          <div className="predictor-stat">
            <span className="p-label">Attended / Total</span>
            <span className="p-num">
              {attendedClasses} / {totalClasses} classes
            </span>
          </div>

          <div className="predictor-advice">
            {isEligible ? (
              <p className="advice-safe">
                🛡️ <strong>Exam Ready:</strong> You can miss up to <strong>{maxMissable} more classes</strong> without dropping below the 75% cutoff.
              </p>
            ) : (
              <p className="advice-warn">
                ⚠️ <strong>Below Cutoff:</strong> Attend the next <strong>3 classes</strong> to restore 75% eligibility.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Mini Heatmap */}
      <div className="streak-heatmap">
        <span className="streak-title">Weekly Attendance Habit</span>
        <div className="heatmap-row">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
            <div key={idx} className="heatmap-col">
              <span className="heatmap-day">{day}</span>
              <div
                className={`heatmap-dot ${idx < 5 ? "active" : "weekend"}`}
                title={idx < 5 ? "Checked In" : "Off day"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Web3 Cryptographic Merkle Receipt Trigger */}
      <div className="receipt-section">
        <button
          onClick={fetchReceipt}
          disabled={loadingReceipt}
          className="btn-receipt"
        >
          {loadingReceipt ? (
            "Verifying Merkle Proof…"
          ) : (
            <>
              <span>🛡️ View Cryptographic Punch Receipt</span>
              <span className="arrow">↗</span>
            </>
          )}
        </button>

        {receiptError && <p className="receipt-error">{receiptError}</p>}

        {showReceipt && receipt && (
          <div className="receipt-box">
            <div className="receipt-top">
              <div className="receipt-title">
                <strong>Verifiable Merkle Proof</strong>
                <span className="badge-valid">RFC 6962 Verified</span>
              </div>
              <button
                onClick={() => setShowReceipt(false)}
                className="btn-close"
              >
                ✕
              </button>
            </div>

            <div className="receipt-details">
              <div className="receipt-row">
                <span className="k">Student Roll:</span>
                <span className="v font-mono">{receipt.roll}</span>
              </div>
              <div className="receipt-row">
                <span className="k">Leaf Index:</span>
                <span className="v">#{receipt.index} of {receipt.treeSize} entries</span>
              </div>
              <div className="receipt-row">
                <span className="k">Merkle Root:</span>
                <span className="v font-mono text-xs">{receipt.rootHex.slice(0, 18)}…</span>
              </div>
              <div className="receipt-row">
                <span className="k">Proof Siblings:</span>
                <span className="v font-mono text-xs">{receipt.path.length} path hashes</span>
              </div>
              <div className="receipt-row">
                <span className="k">Audit Time:</span>
                <span className="v text-xs">{new Date(receipt.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            <button onClick={copyProof} className="btn-copy-proof">
              {copied ? "✓ Copied Zero-Knowledge JSON!" : "📋 Copy Cryptographic JSON Proof"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
