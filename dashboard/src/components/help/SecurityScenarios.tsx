"use client";

import { useState } from "react";
import { SECURITY_SCENARIOS, type SecurityScenario } from "./HelpData";
import {
  ShieldAlert,
  ShieldCheck,
  Camera,
  FileEdit,
  RotateCcw,
  KeyRound,
  DatabaseZap,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";

interface SecurityScenariosProps {
  difficulty: "beginner" | "technical";
}

const SCENARIO_ICONS = {
  Camera,
  FileEdit,
  RotateCcw,
  KeyRound,
  DatabaseZap,
  Clock,
};

export default function SecurityScenarios({
  difficulty,
}: SecurityScenariosProps) {
  const [expandedId, setExpandedId] = useState<string>("screenshot");

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold font-mono">
              15
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              &quot;What If?&quot; Security &amp; Attack Scenarios
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-world threat modeling: How the Punch protocol prevents cheating, proxy attendance, replay attacks, and database tampering.
          </p>
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {SECURITY_SCENARIOS.map((scenario) => {
          const isExpanded = expandedId === scenario.id;
          const IconComponent =
            SCENARIO_ICONS[scenario.icon as keyof typeof SCENARIO_ICONS] ||
            AlertTriangle;

          return (
            <div
              key={scenario.id}
              className={`rounded-2xl border transition-all ${
                isExpanded
                  ? "border-zinc-700 bg-zinc-950 shadow-xl"
                  : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-950"
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? "" : scenario.id)}
                className="w-full p-4 sm:p-5 text-left cursor-pointer flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 shrink-0 mt-0.5">
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {scenario.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {scenario.threatDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${scenario.verdictBadgeColor}`}
                  >
                    {scenario.verdict}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-5 sm:px-5 space-y-3 border-t border-zinc-800/80 pt-4">
                  {/* Attacker Intent */}
                  <div className="rounded-xl bg-zinc-900/80 p-3 border border-zinc-800 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">
                      What the Attacker Tries
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      {scenario.whatAttackerTries}
                    </p>
                  </div>

                  {/* System Defense */}
                  <div className="rounded-xl bg-zinc-900/80 p-3 border border-zinc-800 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                      How Punch Defends
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      {scenario.whatSystemDoes}
                    </p>
                  </div>

                  {/* Technical Reason */}
                  <div className="rounded-xl bg-zinc-900/40 p-3 border border-zinc-800/60 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                      Underlying Mechanism
                    </div>
                    <p className="text-zinc-400 font-mono text-[11px] leading-relaxed">
                      {scenario.technicalReason}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
