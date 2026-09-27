"use client";

import { useState } from "react";
import { PAYLOAD_FIELDS, type PayloadFieldInfo } from "./HelpData";
import {
  FileCode,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";

interface PayloadExplorerProps {
  difficulty: "beginner" | "technical";
}

export default function PayloadExplorer({ difficulty }: PayloadExplorerProps) {
  const [selectedKey, setSelectedKey] = useState<string>("sid");
  const selectedField: PayloadFieldInfo =
    PAYLOAD_FIELDS.find((f) => f.key === selectedKey) || PAYLOAD_FIELDS[0];

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold font-mono">
              05
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              What Is Inside the QR Code? (Payload Inspector)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Click on any field in the JSON payload to inspect its exact purpose, role in anti-proxy security, and technical specification.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Interactive Clickable JSON Payload */}
        <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-teal-400" />
              punch.v1+JWS Payload Object
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              Click a key below ↓
            </span>
          </div>

          <div className="font-mono text-xs sm:text-sm leading-relaxed space-y-1 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/80">
            <div className="text-zinc-500">&#123;</div>

            {PAYLOAD_FIELDS.map((field) => {
              const isSelected = field.key === selectedKey;
              return (
                <div
                  key={field.key}
                  onClick={() => setSelectedKey(field.key)}
                  className={`pl-4 py-1.5 px-2 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold"
                      : "hover:bg-zinc-800/60 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className={isSelected ? "text-teal-300" : "text-amber-400"}>
                      &quot;{field.key}&quot;
                    </span>
                    <span className="text-zinc-500">:</span>
                    <span className="ml-2 text-zinc-200">
                      {field.type.includes("Number") ? (
                        <span className="text-purple-300">{field.sample}</span>
                      ) : (
                        <span className="text-emerald-300">&quot;{field.sample}&quot;</span>
                      )}
                    </span>
                  </div>
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${
                      isSelected
                        ? "text-teal-400 translate-x-0.5"
                        : "text-zinc-600 group-hover:text-zinc-400"
                    }`}
                  />
                </div>
              );
            })}

            <div className="text-zinc-500">&#125;</div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Encoding: Base64URL</span>
            <span>Signature: ES256 P-256</span>
          </div>
        </div>

        {/* Right Column: Selected Field Deep Dive */}
        <div className="lg:col-span-6 rounded-2xl border border-teal-500/30 bg-zinc-950/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-teal-500/20 px-2.5 py-1 text-xs font-mono font-bold text-teal-300 border border-teal-500/30">
                &quot;{selectedField.key}&quot;
              </span>
              <h4 className="text-base font-bold text-white">
                {selectedField.name}
              </h4>
            </div>
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700">
              {selectedField.type}
            </span>
          </div>

          {/* Simple Explanation */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Simple Explanation
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">
              {selectedField.simpleExplanation}
            </p>
          </div>

          {/* Why it matters */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Why It Is Crucial
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {selectedField.whyItMatters}
            </p>
          </div>

          {/* Technical Details */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Technical Implementation
            </div>
            <p className="text-xs font-mono text-purple-200 leading-relaxed">
              {selectedField.technicalDetails}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
