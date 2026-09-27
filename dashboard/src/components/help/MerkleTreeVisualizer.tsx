"use client";

import { useState, useEffect } from "react";
import {
  buildDemoMerkleTree,
  type DemoMerkleTree,
} from "./CryptoDemos";
import {
  Layers,
  Sparkles,
  ShieldCheck,
  Info,
  CheckCircle2,
  GitCommit,
  Share2,
} from "lucide-react";

interface MerkleTreeVisualizerProps {
  difficulty: "beginner" | "technical";
}

const SAMPLE_STUDENTS = [
  { name: "Shiva", roll: "23CS101", time: "10:00:02" },
  { name: "Ravi", roll: "23CS102", time: "10:00:15" },
  { name: "Kumar", roll: "23CS103", time: "10:01:04" },
  { name: "Priya", roll: "23CS104", time: "10:01:22" },
];

export default function MerkleTreeVisualizer({
  difficulty,
}: MerkleTreeVisualizerProps) {
  const [treeData, setTreeData] = useState<DemoMerkleTree | null>(null);
  const [selectedLeafIndex, setSelectedLeafIndex] = useState<number>(0);

  useEffect(() => {
    buildDemoMerkleTree(SAMPLE_STUDENTS).then(setTreeData);
  }, []);

  if (!treeData) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
        Constructing cryptographic Merkle tree...
      </div>
    );
  }

  // Selected path highlighting:
  // If leaf 0 is selected -> Highlight Leaf 0, Node 0 (H(0+1)), and Root
  // If leaf 1 is selected -> Highlight Leaf 1, Node 0 (H(0+1)), and Root
  // If leaf 2 is selected -> Highlight Leaf 2, Node 1 (H(2+3)), and Root
  // If leaf 3 is selected -> Highlight Leaf 3, Node 1 (H(2+3)), and Root
  const isLeftSubtree = selectedLeafIndex <= 1;
  const activeLevel1Index = isLeftSubtree ? 0 : 1;

  const selectedStudent = SAMPLE_STUDENTS[selectedLeafIndex];
  const selectedLeaf = treeData.leaves[selectedLeafIndex];

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
              10
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Interactive Merkle Tree Visualization
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            How individual attendance records are combined into a single 32-byte master cryptographic root hash. Click any student leaf below!
          </p>
        </div>
      </div>

      {/* Beginner Analogy Banner */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-xs text-zinc-300">
        <p>
          🏆 <strong>Tournament Bracket Analogy:</strong> Think of a sports tournament. 4 teams play in Round 1 (Leaves). The 2 winners advance to the Semi-Finals (Level 1 Nodes). The final winner is the Champion (Root Hash). In cryptography, the Root represents the <em>entire tournament history</em> in a single number!
        </p>
      </div>

      {/* Merkle Tree Diagram Container */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="flex flex-col items-center space-y-8 relative z-10">
          {/* LEVEL 2: MERKLE ROOT */}
          <div className="flex flex-col items-center">
            <div className="rounded-2xl border border-emerald-500/50 bg-gradient-to-b from-emerald-500/20 to-teal-500/10 p-4 text-center shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40 max-w-md w-full">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                MASTER MERKLE ROOT (SHA-256)
              </div>
              <div className="mt-1.5 font-mono text-xs text-white font-bold break-all select-all">
                {treeData.rootHex}
              </div>
              <div className="mt-1 text-[10px] text-zinc-400">
                1 single hash summarizes all 4 attendance records
              </div>
            </div>
            {/* Connecting lines down */}
            <div className="h-6 w-0.5 bg-gradient-to-b from-emerald-500 to-zinc-700 mt-1" />
          </div>

          {/* LEVEL 1: INTERNAL NODES H(A+B) and H(C+D) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 w-full max-w-2xl">
            {/* Left Node H(A+B) */}
            <div
              className={`rounded-xl border p-3.5 transition-all text-center ${
                activeLevel1Index === 0
                  ? "border-emerald-500/60 bg-emerald-950/30 ring-1 ring-emerald-500/40"
                  : "border-zinc-800 bg-zinc-900/60 opacity-60"
              }`}
            >
              <div className="text-[10px] font-bold text-emerald-400 font-mono">
                Node H(A + B) [Branch 0]
              </div>
              <div className="mt-1 font-mono text-[11px] text-zinc-200 truncate select-all">
                {treeData.level1[0]?.nodeHex || "..."}
              </div>
            </div>

            {/* Right Node H(C+D) */}
            <div
              className={`rounded-xl border p-3.5 transition-all text-center ${
                activeLevel1Index === 1
                  ? "border-emerald-500/60 bg-emerald-950/30 ring-1 ring-emerald-500/40"
                  : "border-zinc-800 bg-zinc-900/60 opacity-60"
              }`}
            >
              <div className="text-[10px] font-bold text-teal-400 font-mono">
                Node H(C + D) [Branch 1]
              </div>
              <div className="mt-1 font-mono text-[11px] text-zinc-200 truncate select-all">
                {treeData.level1[1]?.nodeHex || "..."}
              </div>
            </div>
          </div>

          {/* LEVEL 0: 4 ATTENDANCE LEAVES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {treeData.leaves.map((leaf, idx) => {
              const isSelected = idx === selectedLeafIndex;
              const student = SAMPLE_STUDENTS[idx];

              return (
                <button
                  key={leaf.id}
                  onClick={() => setSelectedLeafIndex(idx)}
                  className={`rounded-2xl p-4 border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-emerald-500/70 bg-gradient-to-b from-emerald-500/20 to-zinc-900 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/50"
                      : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      Leaf #{idx} (Hash {String.fromCharCode(65 + idx)})
                    </span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>

                  <div className="mt-2">
                    <div className="text-sm font-bold text-white">
                      {student.name}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      {student.roll}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {student.time}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 font-mono text-[9px] text-zinc-500 truncate">
                    {leaf.hashHex}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Leaf Path Breakdown */}
      <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-zinc-950/80 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Share2 className="h-4 w-4" />
            Audit Path for {selectedStudent.name} ({selectedStudent.roll})
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            RFC 6962 Inclusion Proof
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="rounded-lg bg-zinc-900 px-2.5 py-1 text-emerald-300 border border-zinc-800">
            1. Leaf {String.fromCharCode(65 + selectedLeafIndex)} ({selectedStudent.name})
          </span>
          <span className="text-zinc-600">→</span>
          <span className="rounded-lg bg-zinc-900 px-2.5 py-1 text-teal-300 border border-zinc-800">
            2. Combine with Sibling {selectedLeafIndex % 2 === 0 ? String.fromCharCode(65 + selectedLeafIndex + 1) : String.fromCharCode(65 + selectedLeafIndex - 1)}
          </span>
          <span className="text-zinc-600">→</span>
          <span className="rounded-lg bg-zinc-900 px-2.5 py-1 text-purple-300 border border-zinc-800">
            3. Combine with Sibling Node {activeLevel1Index === 0 ? "H(C+D)" : "H(A+B)"}
          </span>
          <span className="text-zinc-600">→</span>
          <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-emerald-400 border border-emerald-500/40 font-bold">
            4. Master Merkle Root ✓
          </span>
        </div>

        <p className="text-xs text-zinc-300">
          To prove {selectedStudent.name} was in class, the verifier only needs {selectedStudent.name}&apos;s record and <strong>2 sibling hashes</strong> — without needing to inspect any other student&apos;s personal records!
        </p>
      </div>
    </div>
  );
}
