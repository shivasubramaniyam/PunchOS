"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  History,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface TimeSlotSimulatorProps {
  difficulty: "beginner" | "technical";
}

export default function TimeSlotSimulator({
  difficulty,
}: TimeSlotSimulatorProps) {
  const [currentSlot, setCurrentSlot] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(3.0);
  const [progressPercent, setProgressPercent] = useState(100);
  const [punches, setPunches] = useState<
    { id: number; slot: number; nonce: string; timestamp: string; status: string }[]
  >([]);

  // Calculate live slot based on real wall-clock time
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const slot = Math.floor(now / 1000 / 3);
      const msInSlot = 3000;
      const msRemaining = msInSlot - (now % msInSlot);
      const secRem = msRemaining / 1000;
      const progress = (msRemaining / msInSlot) * 100;

      setCurrentSlot(slot);
      setSecondsRemaining(secRem);
      setProgressPercent(progress);
    };

    update();
    const interval = setInterval(update, 50);
    return () => clearInterval(interval);
  }, []);

  const generateRandomNonce = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let res = "";
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleCreatePunch = () => {
    const freshNonce = generateRandomNonce();
    const newPunch = {
      id: Date.now(),
      slot: currentSlot,
      nonce: freshNonce,
      timestamp: new Date().toLocaleTimeString(),
      status: "Fresh & Valid",
    };
    setPunches((prev) => [newPunch, ...prev.slice(0, 4)]);
  };

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
              06
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              3-Second Time Slots &amp; Nonce Uniqueness
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Visualizing the live 3-second sliding window that kills proxy attendance, screenshots, and replay attacks.
          </p>
        </div>
      </div>

      {/* Visual Timeline Diagram */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Slot Sliding Timeline (3 Seconds per Window)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center font-mono">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="text-[10px] text-zinc-500">Slot #{currentSlot - 2}</div>
            <div className="text-xs text-zinc-400 mt-1 font-semibold">T - 6.0s</div>
            <div className="text-[10px] text-rose-400/80 mt-1">❌ Expired</div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-3">
            <div className="text-[10px] text-amber-400">Slot #{currentSlot - 1}</div>
            <div className="text-xs text-amber-200 mt-1 font-semibold">T - 3.0s</div>
            <div className="text-[10px] text-amber-400/80 mt-1">⚠️ 1-Slot Grace</div>
          </div>
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/20 p-3 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40">
            <div className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              ACTIVE SLOT
            </div>
            <div className="text-sm text-emerald-300 mt-1 font-bold">Slot #{currentSlot}</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1">✓ Current</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 opacity-60">
            <div className="text-[10px] text-zinc-500">Slot #{currentSlot + 1}</div>
            <div className="text-xs text-zinc-400 mt-1 font-semibold">T + 3.0s</div>
            <div className="text-[10px] text-zinc-500 mt-1">⏳ Future</div>
          </div>
        </div>
      </div>

      {/* Live Active Slot Ticker & Progress Bar */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left Column: Live Slot Countdown Stage */}
        <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Live Slot Clock
              </span>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-bold">
              Slot ID: {currentSlot}
            </span>
          </div>

          <div className="rounded-xl bg-zinc-900 p-4 border border-zinc-800 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-zinc-400">Current Slot Lifetime:</span>
              <span className="font-mono text-lg font-bold text-white">
                {secondsRemaining.toFixed(2)}s remaining
              </span>
            </div>

            {/* Smooth animated progress bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-950 border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              When the bar empties, the slot automatically ticks forward and a new QR is generated.
            </p>
          </div>

          <button
            onClick={handleCreatePunch}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-black hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Sparkles className="h-4 w-4" />
            Simulate Generating a New Punch QR
          </button>
        </div>

        {/* Right Column: Generated Nonce & Punch History */}
        <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <History className="h-4 w-4" />
              Generated Punch Tokens &amp; Nonces
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              Fresh Random Seeds
            </span>
          </div>

          {punches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
              Click &quot;Simulate Generating a New Punch QR&quot; above to create sample punches with unique nonces.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {punches.map((p) => {
                const isSlotValid =
                  p.slot === currentSlot || p.slot === currentSlot - 1;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-zinc-900/90 p-3 border border-zinc-800 font-mono text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-300 font-bold">
                          Slot #{p.slot}
                        </span>
                        <span className="text-amber-400 text-[11px]">
                          nonce={p.nonce}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        Created at {p.timestamp}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        isSlotValid
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {isSlotValid ? "✓ Active Slot" : "✕ Slot Expired"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Clock Tolerance Note */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-3 text-xs text-zinc-300 space-y-1">
            <div className="font-bold text-blue-400 text-[11px] uppercase tracking-wider">
              Network &amp; Camera Tolerance: ACCEPTED_SLOTS_BACK = 1
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              If the scanner camera takes 1.5 seconds to focus, the slot might flip just as the photo is taken. To avoid false rejections, the server allows the immediately preceding slot (`currentSlot - 1`).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
