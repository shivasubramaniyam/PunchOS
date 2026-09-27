"use client";

import { TECHNICAL_SPECS, CODE_MAPPINGS } from "./HelpData";
import { Code2, Cpu, Terminal, Layers, FileCode, CheckCircle2 } from "lucide-react";

interface CodeMappingTableProps {
  difficulty: "beginner" | "technical";
}

export default function CodeMappingTable({ difficulty }: CodeMappingTableProps) {
  return (
    <div className="space-y-6">
      {/* 1. Technical Cryptographic Specifications */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold font-mono">
                17
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Technical Cryptographic Specifications
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Exact parameter definitions, algorithms, curves, and domain separators used in the codebase.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TECHNICAL_SPECS.map((spec) => (
            <div
              key={spec.feature}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                  {spec.feature}
                </div>
                <div className="text-xs font-bold text-white font-mono mt-1">
                  {spec.specification}
                </div>
                <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed">
                  {spec.whatItIs}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400">
                <span className="text-zinc-500">Usage:</span> {spec.whereUsed}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Under the Hood: Function-to-Code Mappings */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold font-mono">
                21
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Under the Hood: Function-to-Code Mapping
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Direct mapping of conceptual protocol steps to actual TypeScript functions in the repository.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                <th className="pb-3 font-semibold">Function &amp; Signature</th>
                <th className="pb-3 font-semibold">Source File</th>
                <th className="pb-3 font-semibold">Core Purpose</th>
                <th className="pb-3 font-semibold">Plain English Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
              {CODE_MAPPINGS.map((mapping) => (
                <tr key={mapping.functionName} className="hover:bg-zinc-950/60 transition-colors">
                  <td className="py-3 pr-3 text-emerald-400 font-bold whitespace-nowrap">
                    {mapping.functionName}
                  </td>
                  <td className="py-3 pr-3 text-zinc-400 whitespace-nowrap">
                    <span className="rounded bg-zinc-950 px-1.5 py-0.5 border border-zinc-800 text-[10px]">
                      {mapping.sourceFile}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-teal-300 font-sans font-medium whitespace-nowrap">
                    {mapping.purpose}
                  </td>
                  <td className="py-3 text-zinc-300 font-sans leading-relaxed">
                    {mapping.plainEnglishDescription}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
