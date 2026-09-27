"use client";

import { useState, useEffect } from "react";
import { computeSha256Hex } from "./CryptoDemos";
import {
  Fingerprint,
  Sparkles,
  ArrowRight,
  Info,
  RefreshCw,
  Binary,
  Shield,
  Layers,
} from "lucide-react";

interface HashPlaygroundProps {
  difficulty: "beginner" | "technical";
}

export default function HashPlayground({ difficulty }: HashPlaygroundProps) {
  const [inputText, setInputText] = useState("Shiva");
  const [calculatedHash, setCalculatedHash] = useState("");
  const [compareText, setCompareText] = useState("Shiva!");
  const [compareHash, setCompareHash] = useState("");

  useEffect(() => {
    computeSha256Hex(inputText).then(setCalculatedHash);
  }, [inputText]);

  useEffect(() => {
    computeSha256Hex(compareText).then(setCompareHash);
  }, [compareText]);

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold font-mono">
              09
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Cryptographic Hashing &amp; The Avalanche Effect
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            A hash is a one-way digital fingerprint. Type anything below to watch real browser SHA-256 hash calculation in real time.
          </p>
        </div>
      </div>

      {/* Beginner Explanation & Analogy */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Fingerprint className="h-4 w-4" />
              1. Digital Fingerprint
            </div>
            <p className="mt-2 text-xs text-zinc-300">
              No matter how big or small the input is (1 word or an entire library), SHA-256 always outputs an exact 64-character (256-bit) fingerprint.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              2. One-Way Street
            </div>
            <p className="mt-2 text-xs text-zinc-300">
              Like blending fruit into a smoothie: it is super easy to calculate the hash, but mathematically impossible to reverse the hash back to the original text.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <Binary className="h-4 w-4" />
              3. The Avalanche Effect
            </div>
            <p className="mt-2 text-xs text-zinc-300">
              Changing even a single letter, capitalization, or punctuation mark completely scrambles the entire 64-character output.
            </p>
          </div>
        </div>
      </div>

      {/* Live Interactive SHA-256 Calculator */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Input Box 1 */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Input 1 (Type text here):
            </label>
            <span className="text-[10px] font-mono text-zinc-500">
              WebCrypto SHA-256
            </span>
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 font-mono text-sm text-white focus:border-purple-500 focus:outline-none"
            placeholder="Type any message..."
          />

          <div>
            <div className="text-[11px] font-semibold text-zinc-400 mb-1">
              Resulting 256-Bit Hash (Hex):
            </div>
            <div className="rounded-xl bg-zinc-900 p-3 font-mono text-xs text-purple-300 break-all border border-purple-500/30 select-all">
              {calculatedHash || "Computing..."}
            </div>
          </div>
        </div>

        {/* Input Box 2 (Avalanche Comparison) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Input 2 (Compare Avalanche Effect):
            </label>
            <button
              onClick={() => setCompareText(inputText + "!")}
              className="text-[10px] font-mono text-teal-400 hover:underline cursor-pointer"
            >
              Set to Input 1 + &quot;!&quot;
            </button>
          </div>

          <input
            type="text"
            value={compareText}
            onChange={(e) => setCompareText(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 font-mono text-sm text-white focus:border-teal-500 focus:outline-none"
            placeholder="Type modified message..."
          />

          <div>
            <div className="text-[11px] font-semibold text-zinc-400 mb-1">
              Resulting 256-Bit Hash (Hex):
            </div>
            <div className="rounded-xl bg-zinc-900 p-3 font-mono text-xs text-teal-300 break-all border border-teal-500/30 select-all">
              {compareHash || "Computing..."}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Distinction Banner */}
      <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-950/15 p-4 text-xs text-zinc-300 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-300">
            Important Accuracy Distinction:
          </span>
          <p className="text-zinc-400 leading-relaxed">
            <strong>Base64URL</strong> is an <em>encoding</em> (translates bytes to safe text).
            <br />
            <strong>SHA-256</strong> is a <em>one-way cryptographic hash</em> (fingerprints data).
            <br />
            <strong>ES256</strong> is a <em>digital signature</em> (proves authenticity and non-repudiation).
          </p>
        </div>
      </div>
    </div>
  );
}
