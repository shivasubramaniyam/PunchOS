"use client";

import { useState } from "react";
import { JOURNEY_STEPS, type JourneyStep } from "./HelpData";
import {
  UserCheck,
  Clock,
  Key,
  QrCode,
  ShieldCheck,
  Database,
  Layers,
  ChevronRight,
  Code2,
  Sparkles,
  Info,
} from "lucide-react";

interface JourneyStepperProps {
  difficulty: "beginner" | "technical";
}

const STEP_ICONS = [
  UserCheck,
  Clock,
  Key,
  QrCode,
  ShieldCheck,
  Database,
  Layers,
];

export default function JourneyStepper({ difficulty }: JourneyStepperProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep: JourneyStep = JOURNEY_STEPS[activeStepIndex];
  const StepIcon = STEP_ICONS[activeStepIndex] || QrCode;

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
              02
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Interactive Attendance Journey
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Follow Shiva&apos;s step-by-step path from creating a temporary QR code on his phone to becoming part of an immutable Merkle audit log.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 border border-zinc-700">
            Step {activeStepIndex + 1} of {JOURNEY_STEPS.length}
          </span>
        </div>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="mt-6 flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
        {JOURNEY_STEPS.map((step, idx) => {
          const Icon = STEP_ICONS[idx];
          const isActive = idx === activeStepIndex;
          const isPassed = idx < activeStepIndex;

          return (
            <button
              key={step.id}
              onClick={() => setActiveStepIndex(idx)}
              className={`group flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                  : isPassed
                  ? "bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white"
                  : "bg-zinc-950/60 text-zinc-500 border border-zinc-800/60 hover:text-zinc-300"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-emerald-500 text-black font-bold"
                    : isPassed
                    ? "bg-zinc-800 text-emerald-400"
                    : "bg-zinc-900 text-zinc-600"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-[10px] text-zinc-500 font-mono">
                  {step.stepNumber}
                </div>
                <div className="font-semibold">{step.title}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Content Stage */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12 items-stretch">
        {/* Left Column: Visual Step Card */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />

          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                {activeStep.badge}
              </span>
              <span className="font-mono text-2xl font-black text-zinc-700">
                {activeStep.stepNumber}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
                <StepIcon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  {activeStep.title}
                </h4>
                <p className="text-xs text-zinc-400">{activeStep.subtitle}</p>
              </div>
            </div>

            {/* Example Card */}
            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {activeStep.simpleExample.heading}
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {activeStep.simpleExample.details.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {activeStep.simpleExample.callout && (
                <div className="mt-3 rounded-lg bg-zinc-950 p-2.5 text-[11px] text-zinc-400 border border-zinc-800/80 flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{activeStep.simpleExample.callout}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-800/80">
            <button
              onClick={() =>
                setActiveStepIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={activeStepIndex === 0}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              ← Previous
            </button>
            <div className="flex gap-1.5">
              {JOURNEY_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStepIndex(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === activeStepIndex
                      ? "w-6 bg-emerald-400"
                      : "w-2 bg-zinc-800 hover:bg-zinc-700"
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() =>
                setActiveStepIndex((prev) =>
                  Math.min(JOURNEY_STEPS.length - 1, prev + 1)
                )
              }
              disabled={activeStepIndex === JOURNEY_STEPS.length - 1}
              className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Explanations & Technical Breakdown */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* What happens */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              What is happening
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">
              {activeStep.whatHappens}
            </p>
          </div>

          {/* Why it is needed */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              Why this is necessary
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {activeStep.whyNeeded}
            </p>
          </div>

          {/* Technical Implementation (Highlighted if technical toggle is on or always expandable) */}
          <div className="rounded-2xl border border-teal-500/20 bg-teal-950/20 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-teal-400" />
                Technical Implementation
              </div>
              <span className="font-mono text-[11px] text-teal-400/90 font-medium">
                {activeStep.technicalImplementation.algorithm}
              </span>
            </div>

            <pre className="mt-2 rounded-xl bg-zinc-950 p-3 font-mono text-[11px] text-teal-200 border border-zinc-800 overflow-x-auto">
              <code>{activeStep.technicalImplementation.codeSnippet}</code>
            </pre>

            <p className="mt-2.5 text-xs text-zinc-400 italic">
              💡 {activeStep.technicalImplementation.note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
