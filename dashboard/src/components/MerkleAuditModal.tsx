"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Database, FileCheck, Copy, Check, ExternalLink, X } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface MerkleAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MerkleRootResponse {
  rootHex: string;
  treeSize: number;
  timestamp: string;
  standard: string;
}

export default function MerkleAuditModal({ isOpen, onClose }: MerkleAuditModalProps) {
  const [data, setData] = useState<MerkleRootResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`${API_BASE}/api/punch/merkle-root`)
        .then((r) => r.json())
        .then((res: MerkleRootResponse) => {
          setData(res);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-purple-500/30 bg-zinc-950 p-6 shadow-2xl text-zinc-100">
        {/* Glowing background accent */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-emerald-600/20 blur-3xl" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-start gap-2">
                RFC 6962 Merkle Transparency Log
                <span className="rounded-xl bg-purple-500/10 px-2 py-0.5 text-[10px] font-mono text-purple-300 border border-purple-500/20 flex w-auto">
                  Web3 Cryptographic Proof
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Zero-trust tamper-proof audit trail for verified biometric punches
              </p>
            </div>
            <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          </div>
          
        </div>

        {/* Content */}
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
            <div className="text-xs font-semibold text-zinc-400 mb-1">
              Current Merkle Root (SHA-256)
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-950 p-3 border border-zinc-800">
              <span className="font-mono text-xs text-emerald-400 break-all select-all">
                {loading ? "Computing tree root..." : data?.rootHex || "No verified punches yet today"}
              </span>
              {data?.rootHex && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(data.rootHex)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Copy Root Hash"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5">
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <Database className="h-3.5 w-3.5 text-purple-400" /> Tree Size
              </div>
              <div className="text-xl font-bold font-mono text-zinc-100">
                {data?.treeSize ?? 0} <span className="text-xs font-normal text-zinc-500">leaves</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5">
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <FileCheck className="h-3.5 w-3.5 text-emerald-400" /> Cryptographic Standard
              </div>
              <div className="text-sm font-semibold text-zinc-100 mt-1">
                RFC 6962 / Web3
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-xs text-zinc-400 space-y-2">
            <p className="font-medium text-zinc-300">
              🛡️ How Merkle Transparency Protects Your Organization:
            </p>
            <p>
              Each student punch is hashed into a binary Merkle tree. Every student receives a signed cryptographic inclusion receipt that mathematically proves their attendance cannot be modified or deleted by any database administrator.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-800/80">
          <span className="text-[11px] text-zinc-500 font-mono">
            {data?.timestamp ? `Generated: ${new Date(data.timestamp).toLocaleTimeString()}` : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
