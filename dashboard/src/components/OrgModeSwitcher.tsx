"use client";

import { useState } from "react";
import { GraduationCap, Dumbbell, Building2, Ticket, Check } from "lucide-react";

export type OrgMode = "campus" | "cultfit" | "enterprise" | "web3";

interface OrgConfig {
  id: OrgMode;
  name: string;
  badge: string;
  icon: typeof GraduationCap;
  accentColor: string;
  userLabel: string;
  groupLabel: string;
  punchLabel: string;
}

export const ORG_MODES: Record<OrgMode, OrgConfig> = {
  campus: {
    id: "campus",
    name: "University Campus",
    badge: "Campus OS",
    icon: GraduationCap,
    accentColor: "from-blue-600 to-indigo-600",
    userLabel: "Student Roll",
    groupLabel: "Branch & Year",
    punchLabel: "Class Attendance",
  },
  cultfit: {
    id: "cultfit",
    name: "Cult.fit Fitness Center",
    badge: "Cult Pro",
    icon: Dumbbell,
    accentColor: "from-amber-500 to-orange-600",
    userLabel: "Member ID",
    groupLabel: "Workout Slot",
    punchLabel: "Gym Check-In",
  },
  enterprise: {
    id: "enterprise",
    name: "Tech Enterprise",
    badge: "Workplace ID",
    icon: Building2,
    accentColor: "from-emerald-600 to-teal-600",
    userLabel: "Employee Badge",
    groupLabel: "Dept & Floor",
    punchLabel: "Desk Check-In",
  },
  web3: {
    id: "web3",
    name: "Web3 DAO Hackathon",
    badge: "POAP Protocol",
    icon: Ticket,
    accentColor: "from-purple-600 to-pink-600",
    userLabel: "Hacker / Wallet",
    groupLabel: "Track / Team",
    punchLabel: "POAP Check-In",
  },
};

interface OrgModeSwitcherProps {
  currentMode: OrgMode;
  onModeChange: (mode: OrgMode) => void;
}

export default function OrgModeSwitcher({
  currentMode,
  onModeChange,
}: OrgModeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const active = ORG_MODES[currentMode];
  const Icon = active.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 shadow-sm hover:border-zinc-700 hover:bg-zinc-800 transition-all backdrop-blur-md"
      >
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-r ${active.accentColor} text-white shadow-sm`}
        >
          <Icon className="h-3 w-3" />
        </div>
        <span className="hidden sm:inline">{active.name}</span>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700/50">
          {active.badge}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
            <div className="px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400">
              Plug & Play Organization Mode
            </div>
            <div className="space-y-1">
              {Object.values(ORG_MODES).map((mode) => {
                const ModeIcon = mode.icon;
                const isSelected = mode.id === currentMode;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      onModeChange(mode.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-zinc-800 text-white font-medium"
                        : "text-zinc-300 hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-r ${mode.accentColor} text-white shadow-sm`}
                      >
                        <ModeIcon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold">{mode.name}</div>
                        <div className="text-[10px] text-zinc-400">
                          {mode.punchLabel}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
