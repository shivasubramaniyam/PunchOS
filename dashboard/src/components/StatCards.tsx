"use client";

import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import type { Stats } from "@/lib/types";

interface StatCardsProps {
  stats: Stats | null;
}

const cards = [
  {
    key: "totalStudents" as const,
    label: "Total Students",
    icon: Users,
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
    format: (s: Stats) => (s?.totalStudents ?? 0).toLocaleString(),
  },
  {
    key: "presentCount" as const,
    label: "Present Today",
    icon: UserCheck,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    format: (s: Stats) => (s?.presentCount ?? 0).toLocaleString(),
  },
  {
    key: "absentCount" as const,
    label: "Absent",
    icon: UserX,
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
    format: (s: Stats) => (s?.absentCount ?? 0).toLocaleString(),
  },
  {
    key: "attendanceRate" as const,
    label: "Attendance Rate",
    icon: TrendingUp,
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    format: (s: Stats) => `${s?.attendanceRate ?? 0}%`,
  },
];

export default function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, accent, bg, format }) => (
        <div
          key={key}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm transition-colors hover:border-zinc-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{label}</span>
            <span className={`rounded-lg p-2 ${bg}`}>
              <Icon className={`h-4 w-4 ${accent}`} aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100 tabular-nums">
            {stats ? format(stats) : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
