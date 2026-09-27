"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { QrCode, Wifi, WifiOff, ShieldCheck, BookOpen } from "lucide-react";
import Charts from "@/components/Charts";
import LiveFeed from "@/components/LiveFeed";
import PunchScanner from "@/components/PunchScanner";
import StatCards from "@/components/StatCards";
import StudentManager from "@/components/StudentManager";
import OrgModeSwitcher, { ORG_MODES, type OrgMode } from "@/components/OrgModeSwitcher";
import MerkleAuditModal from "@/components/MerkleAuditModal";
import { api, API_BASE } from "@/lib/api";
import { useLiveEvents } from "@/lib/useLiveEvents";
import type { AttendanceRecord, LiveEvent, Stats, Student } from "@/lib/types";

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [connected, setConnected] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orgMode, setOrgMode] = useState<OrgMode>("campus");
  const [isMerkleModalOpen, setIsMerkleModalOpen] = useState(false);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const refreshStats = useCallback(() => {
    api
      .getStats()
      .then(setStats)
      .catch(() => undefined);
  }, []);

  const refreshStudents = useCallback(() => {
    api
      .getStudents()
      .then((r) => setStudents(r.students))
      .catch(() => undefined);
  }, []);

  const refreshAttendance = useCallback(() => {
    api
      .getAttendance()
      .then((a) => setRecords(a.records))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    Promise.all([api.getStudents(), api.getAttendance(), api.getStats()])
      .then(([s, a, st]) => {
        setStudents(s.students);
        setRecords(a.records);
        setStats(st);
      })
      .catch((e: unknown) =>
        setLoadError(
          e instanceof Error
            ? `${e.message} — is the backend server running on :8000?`
            : "Failed to load dashboard data",
        ),
      );
  }, []);

  const handleLiveEvent = useCallback(
    (event: LiveEvent) => {
      switch (event.type) {
        case "attendance.marked":
          setRecords((prev) =>
            prev.some((r) => r.id === event.payload.id)
              ? prev
              : [event.payload, ...prev],
          );
          refreshStats();
          break;
        case "attendance.undone":
          setRecords((prev) => prev.filter((r) => r.id !== event.payload.id));
          refreshStats();
          break;
        case "student.created":
          setStudents((prev) =>
            prev.some((s) => s.roll === event.payload.roll)
              ? prev
              : [...prev, event.payload].sort((a, b) =>
                  a.roll.localeCompare(b.roll),
                ),
          );
          refreshStats();
          break;
        case "student.deleted":
          setStudents((prev) =>
            prev.filter((s) => s.roll !== event.payload.roll),
          );
          refreshStats();
          break;
      }
    },
    [refreshStats],
  );

  useLiveEvents(handleLiveEvent);

  // Track SSE connectivity via a lightweight ping of the stats endpoint.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/stats`, { signal: controller.signal })
      .then(() => setConnected(true))
      .catch(() => setConnected(false));
    return () => controller.abort();
  }, [stats]);

  function handleUndo(id: number) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    api.undoAttendance(id).catch(refreshStats);
  }

  function handleManualMark() {
    refreshAttendance();
    refreshStats();
  }

  const activeOrg = ORG_MODES[orgMode] || ORG_MODES.campus;

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-zinc-950">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
          <WifiOff className="mx-auto h-8 w-8 text-rose-400" aria-hidden />
          <h1 className="mt-4 text-lg font-semibold text-zinc-100">
            Cannot reach the backend
          </h1>
          <p className="mt-2 text-sm text-zinc-400">{loadError}</p>
          <p className="mt-4 text-xs text-zinc-500">
            Start it with:{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono">
              npm run dev:server
            </code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Header & Multi-Tenant Switcher */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-3 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5">
            <QrCode className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Biometric Punch & Attendance Terminal
              </h1>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                Plug & Play SDK
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5" suppressHydrationWarning>
              {todayFormatted} • Active Mode: <span className="text-emerald-400 font-semibold">{activeOrg.name}</span> ({activeOrg.punchLabel})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Multi-Tenant Org Switcher */}
          <OrgModeSwitcher currentMode={orgMode} onModeChange={setOrgMode} />

          {/* Merkle Root Transparency Audit Trigger */}
          <button
            onClick={() => setIsMerkleModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300 hover:bg-teal-500/20 hover:border-teal-500/50 transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            Audit Merkle Tree
          </button>

          {/* Interactive Help & Learning Center */}
          <Link
            href="/help"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all shadow-sm"
          >
            <BookOpen className="h-4 w-4 text-emerald-400" />
            🎓 Help &amp; Learn Center
          </Link>

          {/* Link to Student PWA */}
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/90 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-emerald-500 hover:text-emerald-400 transition-all shadow-sm"
          >
            📱 Open Student PWA ↗
          </a>

          {/* Connection Status Badge */}
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
              connected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
            }`}
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5 animate-pulse text-emerald-400" aria-hidden />
            ) : (
              <WifiOff className="h-3.5 w-3.5" aria-hidden />
            )}
            {connected ? "Live Terminal" : "Offline"}
          </span>
        </div>
      </header>

      {/* Top Metrics Cards */}
      <StatCards stats={stats} />

      {/* Main Terminal Stage: High-Speed Camera Scanner + Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Charts stats={stats} />
        <PunchScanner onScanSuccess={handleManualMark} />
      </div>

      {/* Live SSE Realtime Feed */}
      <LiveFeed records={records} onUndo={handleUndo} />

      {/* Roster & Attendee Manager */}
      <StudentManager
        students={students}
        onCreated={refreshStudents}
        onDeleted={refreshStudents}
        onManuallyMarked={handleManualMark}
      />

      {/* RFC 6962 Cryptographic Merkle Root Modal */}
      <MerkleAuditModal
        isOpen={isMerkleModalOpen}
        onClose={() => setIsMerkleModalOpen(false)}
      />
    </main>
  );
}
