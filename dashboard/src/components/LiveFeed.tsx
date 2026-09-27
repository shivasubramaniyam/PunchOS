"use client";

import { useEffect, useRef, useState } from "react";
import { Undo2, Radio } from "lucide-react";

import type { AttendanceRecord } from "@/lib/types";

interface LiveFeedProps {
  records: AttendanceRecord[];
  onUndo: (id: number) => void;
}

export default function LiveFeed({ records, onUndo }: LiveFeedProps) {
  const [flashIds, setFlashIds] = useState<Set<number>>(new Set());
  const seenIds = useRef<Set<number>>(new Set());
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      records.forEach((r) => seenIds.current.add(r.id));
      firstRender.current = false;
      return;
    }
    const fresh = records.filter((r) => !seenIds.current.has(r.id));
    if (fresh.length > 0) {
      records.forEach((r) => seenIds.current.add(r.id));
      setFlashIds(new Set(fresh.map((r) => r.id)));
      const timer = setTimeout(() => setFlashIds(new Set()), 1600);
      return () => clearTimeout(timer);
    }
  }, [records]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Radio className="h-4 w-4 text-emerald-400" aria-hidden />
          Live Feed
        </h3>
        <span className="text-xs text-zinc-500">
          {records.length} marked today
        </span>
      </header>

      <div className="max-h-96 overflow-y-auto">
        {records.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">
            No attendance marked yet today.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800/70">
            {records.map((r) => (
              <li
                key={r.id}
                className={`flex items-center justify-between px-5 py-3 transition-colors duration-700 ${
                  flashIds.has(r.id) ? "bg-emerald-500/15" : "bg-transparent"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {r.name}
                      <span className="ml-2 text-xs text-zinc-500 font-mono">{r.roll}</span>
                    </p>
                    {r.role && r.role !== "student" && (
                      <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20 capitalize">
                        {r.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {r.org ? `${r.org} · ` : ""}{r.branch ? `${r.branch} · ` : ""}{r.year ? `Year ${r.year}${r.section} · ` : ""}
                    {new Date(r.markedAt).toLocaleTimeString()}
                    {r.durationMinutes ? ` · Active: ${Math.floor(r.durationMinutes / 60)}h ${r.durationMinutes % 60}m` : ""}
                  </p>
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-2">
                  {r.punchType && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        r.punchType === "out"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {r.punchType === "out" ? "Clock Out" : "Clock In"}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      r.method === "qr"
                        ? "bg-sky-500/10 text-sky-400"
                        : r.method === "offline_sync"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {r.method === "qr" ? "Biometric QR" : r.method === "offline_sync" ? "Offline Sync" : "Manual"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUndo(r.id)}
                    title="Undo"
                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Undo2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
