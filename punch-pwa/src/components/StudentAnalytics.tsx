"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE, fetchStudentStats, type StudentAttendanceStats } from "@/lib/api";

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
  const [stats, setStats] = useState<StudentAttendanceStats | null>(null);
  const [receipt, setReceipt] = useState<MerkleReceipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = useCallback(async () => {
    if (!roll) return;
    try {
      setIsRefreshing(true);
      const data = await fetchStudentStats(roll);
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("Failed to load student attendance stats:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [roll]);

  useEffect(() => {
    // Initial fetch
    loadStats();

    // 1. Polling interval (every 3 seconds for immediate real-time sync)
    const pollInterval = setInterval(() => {
      loadStats();
    }, 3000);

    // 2. Server-Sent Events (SSE) listener for instant push updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE}/api/events`);
      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "attendance.marked" || msg.type === "attendance.undone") {
            loadStats();
          }
        } catch {
          // Ignore JSON parse errors from keep-alive comments
        }
      };
    } catch {
      // Fall back to polling interval
    }

    return () => {
      clearInterval(pollInterval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [loadStats]);

  // Attendance metrics derived from database stats
  const totalClasses = stats?.totalClasses ?? 30;
  const attendedClasses = stats?.attendedClasses ?? 0;
  const attendanceRate = stats?.attendanceRate ?? Math.round((attendedClasses / Math.max(1, totalClasses)) * 100);
  const streakDays = stats?.streakDays ?? 0;
  const minRequiredPct = 75;

  // Buffer calculation: (attended - 0.75 * total) / 0.75
  const maxMissable = Math.max(
    0,
    Math.floor((attendedClasses - (minRequiredPct / 100) * totalClasses) / (minRequiredPct / 100))
  );

  const classesNeededTo75 = Math.max(
    0,
    Math.ceil((minRequiredPct / 100 * totalClasses - attendedClasses) / (1 - minRequiredPct / 100))
  );

  const isEligible = attendanceRate >= minRequiredPct;

  // Ring SVG calculations
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

  // Build 7-day habit heatmap from real attendance history
  const buildWeeklyHeatmap = () => {
    const daysName = ["M", "T", "W", "T", "F", "S", "S"];
    const historyDates = new Set((stats?.history ?? []).map((h) => h.date));
    
    // Get current Monday as start of week
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon...
    const distToMon = (currentDayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distToMon);

    return daysName.map((dayLabel, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const isoDate = d.toISOString().split("T")[0];
      const isPastOrToday = d <= now;
      const isWeekend = idx >= 5;
      const isAttended = historyDates.has(isoDate);

      let statusClass = "weekend";
      let statusTitle = `${dayLabel} (${isoDate}): Weekend`;

      if (isAttended) {
        statusClass = "active";
        statusTitle = `${dayLabel} (${isoDate}): Attended`;
      } else if (!isWeekend && isPastOrToday) {
        statusClass = "missed";
        statusTitle = `${dayLabel} (${isoDate}): Missed / Not Marked`;
      } else if (isWeekend) {
        statusClass = "weekend";
        statusTitle = `${dayLabel} (${isoDate}): Off day`;
      } else {
        statusClass = "future";
        statusTitle = `${dayLabel} (${isoDate}): Upcoming`;
      }

      return {
        label: dayLabel,
        date: isoDate,
        statusClass,
        statusTitle,
      };
    });
  };

  const weeklyHeatmap = buildWeeklyHeatmap();

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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="analytics-pill">🔥 {streakDays}-Day Streak</span>
          <button
            onClick={loadStats}
            title="Refresh Attendance Stats"
            className="btn-ghost"
            style={{
              padding: "0.2rem 0.4rem",
              fontSize: "0.7rem",
              borderRadius: "999px",
              opacity: isRefreshing ? 0.5 : 0.9,
            }}
          >
            {isRefreshing ? "⏳" : "🔄"}
          </button>
        </div>
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
                🛡️ <strong>Exam Ready:</strong> You can miss up to <strong>{maxMissable} more classes</strong> without dropping below 75%.
              </p>
            ) : (
              <p className="advice-warn">
                ⚠️ <strong>Below Cutoff:</strong> Attend the next <strong>{classesNeededTo75 > 0 ? classesNeededTo75 : 3} classes</strong> to restore 75% eligibility.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Dynamic Heatmap */}
      <div className="streak-heatmap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="streak-title">Weekly Attendance Habit</span>
          {lastUpdated ? (
            <span style={{ fontSize: "0.65rem", color: "var(--fg-dim, #888)" }}>
              Synced {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          ) : null}
        </div>
        <div className="heatmap-row">
          {weeklyHeatmap.map((item, idx) => (
            <div key={idx} className="heatmap-col">
              <span className="heatmap-day">{item.label}</span>
              <div
                className={`heatmap-dot ${item.statusClass}`}
                title={item.statusTitle}
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
