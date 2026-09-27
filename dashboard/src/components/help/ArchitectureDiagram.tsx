"use client";

import { useState } from "react";
import {
  Smartphone,
  Key,
  FileCode,
  QrCode,
  Camera,
  Search,
  ShieldCheck,
  Clock,
  Database,
  Fingerprint,
  Layers,
  FileCheck,
  ArrowDown,
  Info,
  ChevronRight,
} from "lucide-react";

interface ArchitectureDiagramProps {
  difficulty: "beginner" | "technical";
}

interface ArchNode {
  id: string;
  category: "Client (Student)" | "Ingestion (Terminal)" | "Verification (Server)" | "Transparency (Audit)";
  label: string;
  iconName: string;
  color: string;
  role: string;
  guarantee: string;
  codeRef: string;
}

const ARCH_NODES: ArchNode[] = [
  {
    id: "phone",
    category: "Client (Student)",
    label: "1. Student Phone (PWA)",
    iconName: "Smartphone",
    color: "emerald",
    role: "User interface where the student authenticates and requests an attendance punch.",
    guarantee: "Non-custodial: Device holds its own identity and keypair.",
    codeRef: "punch-pwa/src/components/PunchScreen.tsx",
  },
  {
    id: "privkey",
    category: "Client (Student)",
    label: "2. Private Key (Signing Secret)",
    iconName: "Key",
    color: "emerald",
    role: "Cryptographic secret generated via WebCrypto with extractable=false.",
    guarantee: "Key never leaves the phone's secure storage.",
    codeRef: "protocol/src/web.ts (generatePunchKey)",
  },
  {
    id: "payload",
    category: "Client (Student)",
    label: "3. Create Punch Payload",
    iconName: "FileCode",
    color: "emerald",
    role: "Combines 3-second slot number, fresh random nonce, student DID, and kid.",
    guarantee: "Short-lived temporal validity (3s lifetime).",
    codeRef: "protocol/src/core.ts (currentSlot)",
  },
  {
    id: "signature",
    category: "Client (Student)",
    label: "4. ES256 Digital Signature",
    iconName: "ShieldCheck",
    color: "emerald",
    role: "Produces 64-byte ECDSA P-256 signature over JWS signing input.",
    guarantee: "Mathematical non-repudiation and anti-tampering.",
    codeRef: "protocol/src/web.ts (signCurrentPunch)",
  },
  {
    id: "qr",
    category: "Client (Student)",
    label: "5. Render Dynamic QR Code",
    iconName: "QrCode",
    color: "teal",
    role: "Renders standard RFC 7515 Compact JWS string (`punch.v1:head.payload.sig`).",
    guarantee: "Ticks and rotates automatically every 3 seconds.",
    codeRef: "punch-pwa/src/components/PunchScreen.tsx",
  },
  {
    id: "camera",
    category: "Ingestion (Terminal)",
    label: "6. Classroom Scanner Terminal",
    iconName: "Camera",
    color: "teal",
    role: "High-speed optical camera feed (jsQR) scanning at 60 frames per second.",
    guarantee: "Contactless optical ingestion over LAN.",
    codeRef: "dashboard/src/components/PunchScanner.tsx",
  },
  {
    id: "decode",
    category: "Verification (Server)",
    label: "7. Decode JWS & Parse Claims",
    iconName: "FileCode",
    color: "indigo",
    role: "Extracts header, kid, student roll, slot, and nonce.",
    guarantee: "Structural protocol conformity check.",
    codeRef: "protocol/src/core.ts (decodePunchQr)",
  },
  {
    id: "lookup_key",
    category: "Verification (Server)",
    label: "8. Database Public Key Lookup",
    iconName: "Search",
    color: "indigo",
    role: "Queries `PunchKey` by studentId and keyId to retrieve registered EC JWK.",
    guarantee: "Ensures key was previously authorized during enrollment.",
    codeRef: "server/src/routes/punch.ts (prisma.punchKey.findFirst)",
  },
  {
    id: "verify_sig",
    category: "Verification (Server)",
    label: "9. Verify ES256 Signature",
    iconName: "ShieldCheck",
    color: "indigo",
    role: "Converts signature to DER and validates against public JWK.",
    guarantee: "Rejects modified roll numbers, corrupted tokens, or forged signatures.",
    codeRef: "server/src/routes/punch.ts (verifyEs256Signature)",
  },
  {
    id: "check_replay",
    category: "Verification (Server)",
    label: "10. Validate Slot & Replay Nonce",
    iconName: "Clock",
    color: "indigo",
    role: "Ensures slot is within active window and nonce was not previously consumed.",
    guarantee: "Eliminates replay attacks and screenshot sharing.",
    codeRef: "server/src/routes/punch.ts (slot check & PunchEvent query)",
  },
  {
    id: "db_save",
    category: "Verification (Server)",
    label: "11. Save Attendance & Trigger SSE",
    iconName: "Database",
    color: "indigo",
    role: "Upserts daily attendance row and emits live real-time event to faculty UI.",
    guarantee: "Database unique constraint prevents double-marking.",
    codeRef: "server/src/routes/punch.ts & services/events.ts",
  },
  {
    id: "hash_record",
    category: "Transparency (Audit)",
    label: "12. Hash Attendance Leaf",
    iconName: "Fingerprint",
    color: "purple",
    role: "Computes `leafHash(0x00 || att:roll:date:time:method)` via SHA-256.",
    guarantee: "RFC 6962 domain-separated cryptographic leaf serialization.",
    codeRef: "protocol/src/merkle.ts (leafHash)",
  },
  {
    id: "merkle_tree",
    category: "Transparency (Audit)",
    label: "13. Build Merkle Tree",
    iconName: "Layers",
    color: "purple",
    role: "Combines leaves into binary parent nodes using `0x01` internal prefix.",
    guarantee: "Deterministic, logarithmic inclusion proof structure.",
    codeRef: "protocol/src/merkle.ts (merkleTree)",
  },
  {
    id: "merkle_root",
    category: "Transparency (Audit)",
    label: "14. Daily Master Merkle Root",
    iconName: "ShieldCheck",
    color: "purple",
    role: "Published daily at `GET /api/punch/merkle-root` for external auditing.",
    guarantee: "Immutable 32-byte cryptographic summary of the day.",
    codeRef: "server/src/routes/punch.ts (/api/punch/merkle-root)",
  },
  {
    id: "sth",
    category: "Transparency (Audit)",
    label: "15. Signed Tree Head (STH)",
    iconName: "FileCheck",
    color: "purple",
    role: "Digitally signed commitment over `${treeSize}|${rootHex}|${timestamp}`.",
    guarantee: "Cryptographically binds the institution to the log state.",
    codeRef: "protocol/src/merkle.ts (sthSigningInput)",
  },
];

export default function ArchitectureDiagram({
  difficulty,
}: ArchitectureDiagramProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("signature");

  const selectedNode =
    ARCH_NODES.find((n) => n.id === selectedNodeId) || ARCH_NODES[0];

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold font-mono">
              16
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              End-to-End System Architecture
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Click on any component in the end-to-end flow diagram to inspect its exact security guarantee and source code file.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: Interactive Diagram Flow */}
        <div className="lg:col-span-7 space-y-2">
          {ARCH_NODES.map((node, idx) => {
            const isSelected = node.id === selectedNodeId;

            return (
              <div key={node.id} className="flex flex-col items-center">
                <button
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`w-full rounded-2xl p-3.5 border text-left transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? "bg-zinc-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/40"
                      : "bg-zinc-950/70 border-zinc-800/80 hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                        node.category.includes("Client")
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : node.category.includes("Ingestion")
                          ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                          : node.category.includes("Verification")
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      }`}
                    >
                      {node.category.split(" ")[0]}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-white" : "text-zinc-300 group-hover:text-white"
                      }`}
                    >
                      {node.label}
                    </span>
                  </div>

                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      isSelected
                        ? "text-indigo-400 translate-x-1"
                        : "text-zinc-600 group-hover:text-zinc-400"
                    }`}
                  />
                </button>

                {idx < ARCH_NODES.length - 1 && (
                  <div className="h-2 w-0.5 bg-zinc-800 my-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Selected Node Deep Dive */}
        <div className="lg:col-span-5 sticky top-24 rounded-2xl border border-indigo-500/30 bg-zinc-950 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-mono text-zinc-300 border border-zinc-700">
              {selectedNode.category}
            </span>
          </div>

          <h4 className="text-base font-bold text-white">
            {selectedNode.label}
          </h4>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Role in System
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {selectedNode.role}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Security Guarantee
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                🛡️ {selectedNode.guarantee}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                Repository Code Location
              </div>
              <code className="block rounded-lg bg-zinc-950 p-2 font-mono text-[11px] text-indigo-300 border border-zinc-800 truncate">
                {selectedNode.codeRef}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
