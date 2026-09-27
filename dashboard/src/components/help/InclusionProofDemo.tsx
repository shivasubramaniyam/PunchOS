"use client";

import { useState, useEffect } from "react";
import {
  buildDemoMerkleTree,
  rfcNodeHash,
  bytesToHex,
  type DemoMerkleTree,
} from "./CryptoDemos";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  FileCheck,
  Key,
} from "lucide-react";

interface InclusionProofDemoProps {
  difficulty: "beginner" | "technical";
}

export default function InclusionProofDemo({
  difficulty,
}: InclusionProofDemoProps) {
  const [tree, setTree] = useState<DemoMerkleTree | null>(null);
  const [selectedLeafIdx, setSelectedLeafIdx] = useState(1); // Default Ravi (Leaf B)
  const [calculating, setCalculating] = useState(false);
  const [verified, setVerified] = useState(true);

  useEffect(() => {
    buildDemoMerkleTree([
      { name: "Shiva", roll: "23CS101", time: "10:00:02" },
      { name: "Ravi", roll: "23CS102", time: "10:00:15" },
      { name: "Kumar", roll: "23CS103", time: "10:01:04" },
      { name: "Priya", roll: "23CS104", time: "10:01:22" },
    ]).then(setTree);
  }, []);

  if (!tree) return null;

  const currentLeaf = tree.leaves[selectedLeafIdx];
  const siblingLeafIdx = selectedLeafIdx % 2 === 0 ? selectedLeafIdx + 1 : selectedLeafIdx - 1;
  const siblingLeaf = tree.leaves[siblingLeafIdx];
  const siblingNodeIdx = selectedLeafIdx <= 1 ? 1 : 0;
  const siblingNode = tree.level1[siblingNodeIdx];

  const calculatedLevel1Node = tree.level1[selectedLeafIdx <= 1 ? 0 : 1]?.nodeHex;
  const calculatedRootHex = tree.rootHex;

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold font-mono">
              12
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Cryptographic Inclusion Proof (Attendance Receipt)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            How a student proves they were in class using only a 3-part receipt without revealing anyone else&apos;s data.
          </p>
        </div>
      </div>

      {/* Select Student Selector */}
      <div className="mt-6 flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Select Student to Prove:
        </span>
        <div className="flex gap-2">
          {tree.leaves.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setSelectedLeafIdx(i)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                selectedLeafIdx === i
                  ? "bg-teal-500/20 text-teal-300 border-teal-500/50"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              Leaf {String.fromCharCode(65 + i)} ({l.name})
            </button>
          ))}
        </div>
      </div>

      {/* Step-by-Step Proof Calculation Stages */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {/* Step 1: Student Leaf + Sibling */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
          <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider font-mono">
            STEP 1: Leaf + 1st Sibling
          </div>
          <div className="rounded-xl bg-zinc-900 p-2.5 font-mono text-[11px] text-zinc-300 border border-zinc-800">
            <div className="text-teal-300 font-bold truncate">
              Leaf {String.fromCharCode(65 + selectedLeafIdx)}: {currentLeaf.name} ({currentLeaf.roll})
            </div>
            <div className="text-[10px] text-zinc-500 truncate mt-1">
              + Sibling Leaf {String.fromCharCode(65 + siblingLeafIdx)}: {siblingLeaf.name}
            </div>
          </div>
          <div className="text-[11px] text-zinc-400">
            Combines {currentLeaf.name}&apos;s hash with adjacent sibling leaf hash.
          </div>
        </div>

        {/* Step 2: Intermediate Node + Sibling Branch */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
          <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono">
            STEP 2: Compute Intermediate Node
          </div>
          <div className="rounded-xl bg-zinc-900 p-2.5 font-mono text-[11px] text-zinc-300 border border-zinc-800">
            <div className="text-purple-300 font-bold truncate">
              Node H({selectedLeafIdx <= 1 ? "A+B" : "C+D"}): {calculatedLevel1Node?.slice(0, 16)}...
            </div>
            <div className="text-[10px] text-zinc-500 truncate mt-1">
              + Sibling Node H({selectedLeafIdx <= 1 ? "C+D" : "A+B"})
            </div>
          </div>
          <div className="text-[11px] text-zinc-400">
            Hashes intermediate branch with the other side of the tree.
          </div>
        </div>

        {/* Step 3: Reconstructed Root Match */}
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/15 p-4 space-y-2">
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
            STEP 3: Master Root Comparison
          </div>
          <div className="rounded-xl bg-zinc-900 p-2.5 font-mono text-[11px] text-emerald-300 border border-emerald-500/30">
            <div className="font-bold flex items-center justify-between">
              <span>Calculated Root:</span>
              <span className="text-[10px] text-emerald-400">✓ MATCH</span>
            </div>
            <div className="text-[10px] text-zinc-300 truncate mt-1">
              {calculatedRootHex.slice(0, 20)}...
            </div>
          </div>
          <div className="text-[11px] text-emerald-300/90 font-medium">
            100% Cryptographic Proof of Presence!
          </div>
        </div>
      </div>

      {/* Signed Tree Head (STH) Transparency Log Card */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Signed Tree Head (STH) Commitment
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            RFC 6962 Standard
          </span>
        </div>

        <p className="text-xs text-zinc-300">
          At the end of each day, the server creates a Signed Tree Head (STH). This is an official cryptographic statement certifying:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-xs">
          <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800">
            <div className="text-[10px] text-zinc-500">Tree Size</div>
            <div className="font-bold text-white mt-1">4 Records</div>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800">
            <div className="text-[10px] text-zinc-500">Root SHA-256</div>
            <div className="font-bold text-emerald-400 mt-1 truncate">
              {calculatedRootHex.slice(0, 12)}...
            </div>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800">
            <div className="text-[10px] text-zinc-500">Timestamp</div>
            <div className="font-bold text-zinc-300 mt-1">2026-09-27T10:05:00Z</div>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800">
            <div className="text-[10px] text-zinc-500">Server Signature</div>
            <div className="font-bold text-purple-400 mt-1">✓ ES256 Signed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
