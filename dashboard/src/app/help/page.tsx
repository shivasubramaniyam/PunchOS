"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Sliders,
  ShieldCheck,
  Key,
  QrCode,
  Clock,
  Fingerprint,
  Layers,
  FileCheck,
  Compass,
  CheckCircle2,
  Lock,
  Unlock,
  HelpCircle,
  Cpu,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Info,
} from "lucide-react";

import JourneyStepper from "@/components/help/JourneyStepper";
import SignatureTamperDemo from "@/components/help/SignatureTamperDemo";
import PayloadExplorer from "@/components/help/PayloadExplorer";
import TimeSlotSimulator from "@/components/help/TimeSlotSimulator";
import VerificationPipelineVisualizer from "@/components/help/VerificationPipelineVisualizer";
import HashPlayground from "@/components/help/HashPlayground";
import MerkleTreeVisualizer from "@/components/help/MerkleTreeVisualizer";
import InclusionProofDemo from "@/components/help/InclusionProofDemo";
import ArchitectureDiagram from "@/components/help/ArchitectureDiagram";
import SecurityScenarios from "@/components/help/SecurityScenarios";
import GlossarySection from "@/components/help/GlossarySection";
import CodeMappingTable from "@/components/help/CodeMappingTable";

const SECTIONS = [
  { id: "start-here", label: "1. Start Here", icon: Compass },
  { id: "journey", label: "2. How Attendance Works", icon: Clock },
  { id: "identity-keys", label: "3. Identity & Keys", icon: Key },
  { id: "signatures", label: "4. Digital Signatures", icon: ShieldCheck },
  { id: "payload", label: "5. What's Inside the QR", icon: QrCode },
  { id: "time-slots", label: "6. Time Slots & Nonce", icon: Clock },
  { id: "verification", label: "7. Verification Pipeline", icon: CheckCircle2 },
  { id: "hashing", label: "8. Hashing & SHA-256", icon: Fingerprint },
  { id: "merkle-tree", label: "9. Merkle Tree", icon: Layers },
  { id: "inclusion-proof", label: "10. Inclusion Proof", icon: FileCheck },
  { id: "transparency-log", label: "11. Transparency Log", icon: ShieldCheck },
  { id: "ssi-architecture", label: "12. SSI Architecture", icon: Lock },
  { id: "security-scenarios", label: "13. Security Scenarios", icon: ShieldAlert },
  { id: "complete-architecture", label: "14. Complete Architecture", icon: Cpu },
  { id: "technical-details", label: "15. Technical Specifications", icon: BookOpen },
  { id: "glossary", label: "16. Glossary (20 Terms)", icon: HelpCircle },
  { id: "summary-30s", label: "17. 30-Second Summary", icon: Sparkles },
];

export default function HelpPage() {
  const [difficulty, setDifficulty] = useState<"beginner" | "technical">("beginner");
  const [activeSection, setActiveSection] = useState<string>("start-here");

  // Track scroll position to update active section in sidebar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-black">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-400" />
              Back to Live Terminal
            </Link>

            <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <BookOpen className="h-4 w-4" />
              </span>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Punch Protocol Interactive Learning Center
              </h1>
            </div>
          </div>

          {/* Difficulty Level Toggle & Quick Links */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 p-1 text-xs">
              <button
                onClick={() => setDifficulty("beginner")}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all cursor-pointer ${
                  difficulty === "beginner"
                    ? "bg-emerald-500 text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                🌱 Beginner
              </button>
              <button
                onClick={() => setDifficulty("technical")}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all cursor-pointer ${
                  difficulty === "technical"
                    ? "bg-teal-500 text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ⚡ Technical / Dev
              </button>
            </div>

            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
            >
              📱 Student PWA <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Left Sticky Navigation Sitemap */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-2.5 mb-2 flex items-center justify-between">
              <span>Table of Contents</span>
              <span className="font-mono text-emerald-400">17 Sections</span>
            </div>

            <nav className="space-y-0.5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;

                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-left transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isActive ? "text-emerald-400" : "text-zinc-500"
                      }`}
                    />
                    <span className="truncate">{sec.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Main Educational Content Sections */}
        <main className="space-y-12 pb-24">
          {/* ============================================================ */}
          {/* SECTION 1: START HERE                                       */}
          {/* ============================================================ */}
          <section id="start-here" className="scroll-mt-24 space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-900/40 to-zinc-950 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Section 01 • Introduction
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Zero Cryptography Required
                </span>
              </div>

              <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                How does Punch Attendance actually work?
              </h2>

              <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">
                Most attendance apps rely on static QR codes or honesty. Students take screenshots, send them on WhatsApp, and mark attendance for friends who are still asleep at home. <strong>Punch eliminates buddy-punching completely</strong> using the same cryptographic technology that protects Apple Pay and hardware security chips.
              </p>

              {/* Story Scenario: Shiva walks into class */}
              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  The Real-World Story: Shiva Walks into Class at 10:00 AM
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl bg-zinc-900 p-4 border border-zinc-800 space-y-1.5">
                    <div className="font-bold text-white">1. Shiva opens his phone</div>
                    <p className="text-zinc-400 leading-relaxed">
                      Shiva (Roll <strong>23CS101</strong>) opens the Punch app. His phone generates a temporary QR code that is only valid for <strong>3 seconds</strong>.
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-900 p-4 border border-zinc-800 space-y-1.5">
                    <div className="font-bold text-white">2. Teacher scans the QR</div>
                    <p className="text-zinc-400 leading-relaxed">
                      The faculty camera reads the code in 15 milliseconds. The terminal instantly performs 4 checks:
                    </p>
                  </div>
                </div>

                {/* 4 Checks Checklist */}
                <div className="rounded-xl bg-zinc-900/60 p-4 border border-emerald-500/20 grid gap-2 sm:grid-cols-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>✓ Is this Shiva&apos;s registered device key?</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>✓ Is the digital signature genuine?</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>✓ Is it within the 3-second slot window?</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>✓ Has this punch already been used?</span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 pt-1">
                  🎉 <strong>Outcome:</strong> Attendance is marked, a green chime sounds on the projector, and the record is permanently logged into a daily Merkle audit tree.
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 2: INTERACTIVE ATTENDANCE JOURNEY                    */}
          {/* ============================================================ */}
          <section id="journey" className="scroll-mt-24 space-y-4">
            <JourneyStepper difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 3: IDENTITY & KEYS                                   */}
          {/* ============================================================ */}
          <section id="identity-keys" className="scroll-mt-24 space-y-4">
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold font-mono">
                  03
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Identity, Public Keys &amp; Private Keys
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    How asymmetric cryptography replaces vulnerable passwords with unforgeable device signatures.
                  </p>
                </div>
              </div>

              {/* Analogy Card */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-rose-500/30 bg-rose-950/10 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <Lock className="h-5 w-5" />
                    PRIVATE KEY 🔐 (Your Secret Signing Stamp)
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Think of your private key as a <strong>custom wax stamp</strong> that only your hand can hold. Whenever you create an attendance QR, your phone presses this stamp onto the message.
                  </p>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Must <strong>NEVER</strong> be shared or sent over the internet.</li>
                    <li>• Created right inside your phone browser during initial enrollment.</li>
                    <li>• Cannot be exported by web scripts (`extractable: false`).</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-teal-500/30 bg-teal-950/10 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                    <Unlock className="h-5 w-5" />
                    PUBLIC KEY 🔓 (The Bulletin Board Sample)
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Think of the public key as a <strong>sample impression of your seal</strong> pinned to the college notice board. Anyone can look at it to verify your seal, but nobody can carve a duplicate stamp from it.
                  </p>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Shared freely with the college server during enrollment.</li>
                    <li>• Stored in the server database (JSON Web Key format).</li>
                    <li>• Completely safe if seen by others; reveals zero secrets.</li>
                  </ul>
                </div>
              </div>

              {/* Hardware Protection Clarification */}
              <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-4 sm:p-5 text-xs text-zinc-300 space-y-2">
                <div className="font-bold text-blue-400 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Accurate Hardware Protection Clarification
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  The protocol creates keys using the WebCrypto API with <code className="rounded bg-zinc-900 px-1 text-blue-300 font-mono">extractable: false</code>. This guarantees that web scripts cannot export the private key bytes. Actual hardware-backed isolation in a Secure Enclave or TEE depends on device hardware, operating system, and browser capabilities (e.g. FIDO2 Passkeys on iOS/Android).
                </p>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 4: DIGITAL SIGNATURE & TAMPER DEMO                   */}
          {/* ============================================================ */}
          <section id="signatures" className="scroll-mt-24 space-y-4">
            <SignatureTamperDemo difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 5: PAYLOAD EXPLORER                                  */}
          {/* ============================================================ */}
          <section id="payload" className="scroll-mt-24 space-y-4">
            <PayloadExplorer difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 6: TIME SLOTS & NONCE                                */}
          {/* ============================================================ */}
          <section id="time-slots" className="scroll-mt-24 space-y-4">
            <TimeSlotSimulator difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 7: VERIFICATION PIPELINE                             */}
          {/* ============================================================ */}
          <section id="verification" className="scroll-mt-24 space-y-4">
            <VerificationPipelineVisualizer difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 8: HASHING & SHA-256                                 */}
          {/* ============================================================ */}
          <section id="hashing" className="scroll-mt-24 space-y-4">
            <HashPlayground difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 9: MERKLE TREE                                       */}
          {/* ============================================================ */}
          <section id="merkle-tree" className="scroll-mt-24 space-y-4">
            <MerkleTreeVisualizer difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 10: INCLUSION PROOF                                  */}
          {/* ============================================================ */}
          <section id="inclusion-proof" className="scroll-mt-24 space-y-4">
            <InclusionProofDemo difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 11: TRANSPARENCY LOG & SIGNED TREE HEAD              */}
          {/* ============================================================ */}
          <section id="transparency-log" className="scroll-mt-24 space-y-4">
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold font-mono">
                  11
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Transparency Log &amp; Signed Tree Head (STH)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Why the attendance ledger is append-only and how historical records cannot be secretly deleted.
                  </p>
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">
                In a regular database, an administrator could delete yesterday&apos;s absent record or mark a friend present weeks later. A <strong>Transparency Log</strong> prevents this by organizing the records into a chronological sequence where every new entry builds upon previous entries.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                    1. Daily Batch
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    All punches recorded between 09:00 AM and 05:00 PM are gathered into today&apos;s attendance set.
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">
                    2. Merkle Root Calculation
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    The server computes the master 32-byte SHA-256 Merkle root summarizing all records for the day.
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    3. Signed Tree Head (STH)
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    The server signs <code className="text-emerald-300 font-mono text-[10px]">&quot;size|root|timestamp&quot;</code> with its institutional key.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 12: SSI ARCHITECTURE                                 */}
          {/* ============================================================ */}
          <section id="ssi-architecture" className="scroll-mt-24 space-y-4">
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold font-mono">
                  12
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Self-Sovereign Identity (SSI) Architecture
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    How Punch applies SSI principles to student identity and authentication.
                  </p>
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">
                In traditional systems, you prove who you are by giving your password to a central server. In <strong>Self-Sovereign Identity (SSI)</strong>, you hold your own keys and prove who you are through cryptographic signatures without ever sharing secret credentials.
              </p>

              {/* SSI Core Distinction Pillars */}
              <div className="grid gap-3 sm:grid-cols-5 text-xs">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-1">
                  <span className="font-bold text-white block">1. Identity</span>
                  <span className="text-[11px] font-mono text-emerald-400">punch:TRUSTGRID:23CS101</span>
                  <p className="text-[11px] text-zinc-400 mt-1">Decentralized W3C DID identifier.</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-1">
                  <span className="font-bold text-white block">2. Key</span>
                  <span className="text-[11px] font-mono text-teal-400">EC P-256 Pair</span>
                  <p className="text-[11px] text-zinc-400 mt-1">Held locally on student device.</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-1">
                  <span className="font-bold text-white block">3. Credential</span>
                  <span className="text-[11px] font-mono text-purple-400">Roster Enrollment</span>
                  <p className="text-[11px] text-zinc-400 mt-1">Institutional authorization.</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-1">
                  <span className="font-bold text-white block">4. Proof</span>
                  <span className="text-[11px] font-mono text-amber-400">3s Signed JWS</span>
                  <p className="text-[11px] text-zinc-400 mt-1">Short-lived presentation token.</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-1">
                  <span className="font-bold text-white block">5. Verification</span>
                  <span className="text-[11px] font-mono text-rose-400">Zero-Trust Math</span>
                  <p className="text-[11px] text-zinc-400 mt-1">Public key validation at scanner.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 13: SECURITY SCENARIOS                               */}
          {/* ============================================================ */}
          <section id="security-scenarios" className="scroll-mt-24 space-y-4">
            <SecurityScenarios difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 14: COMPLETE ARCHITECTURE                            */}
          {/* ============================================================ */}
          <section id="complete-architecture" className="scroll-mt-24 space-y-4">
            <ArchitectureDiagram difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 15: TECHNICAL SPECS & CODE MAPPING                   */}
          {/* ============================================================ */}
          <section id="technical-details" className="scroll-mt-24 space-y-4">
            <CodeMappingTable difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 16: GLOSSARY                                         */}
          {/* ============================================================ */}
          <section id="glossary" className="scroll-mt-24 space-y-4">
            <GlossarySection difficulty={difficulty} />
          </section>

          {/* ============================================================ */}
          {/* SECTION 17: 30-SECOND SUMMARY                                */}
          {/* ============================================================ */}
          <section id="summary-30s" className="scroll-mt-24 space-y-4">
            <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
                  Summary • Quick Recap
                </span>
              </div>

              <h3 className="mt-3 text-xl sm:text-2xl font-black text-white tracking-tight">
                Punch Protocol Explained in 30 Seconds
              </h3>

              <blockquote className="mt-4 rounded-2xl border-l-4 border-emerald-500 bg-zinc-950/80 p-4 sm:p-5 text-sm sm:text-base text-zinc-200 leading-relaxed italic">
                &ldquo;A student&apos;s device creates a short-lived QR containing attendance information. The device digitally signs that information with its private key. The verifier uses the registered public key to check that the QR is genuine and checks the validity window and replay state. Accepted attendance records are hashed and organized into a Merkle tree. The Merkle root provides a compact cryptographic representation of the logged records, while a signed tree head can attest to the state of the log at a particular time.&rdquo;
              </blockquote>

              {/* Complete Flow Diagram Visual */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold">
                <span className="rounded-xl bg-zinc-900 px-3 py-2 text-emerald-400 border border-zinc-800">IDENTITY</span>
                <span className="text-zinc-600">→</span>
                <span className="rounded-xl bg-zinc-900 px-3 py-2 text-teal-400 border border-zinc-800">KEY</span>
                <span className="text-zinc-600">→</span>
                <span className="rounded-xl bg-zinc-900 px-3 py-2 text-indigo-400 border border-zinc-800">SIGNED QR</span>
                <span className="text-zinc-600">→</span>
                <span className="rounded-xl bg-zinc-900 px-3 py-2 text-purple-400 border border-zinc-800">VERIFICATION</span>
                <span className="text-zinc-600">→</span>
                <span className="rounded-xl bg-zinc-900 px-3 py-2 text-emerald-400 border border-zinc-800">ATTENDANCE</span>
                <span className="text-zinc-600">→</span>
                <span className="rounded-xl bg-zinc-900 px-3 py-2 text-amber-400 border border-zinc-800">HASH</span>
                <span className="text-zinc-600">→</span>
                <span className="rounded-xl bg-zinc-900 px-3 py-2 text-teal-400 border border-zinc-800">MERKLE TREE</span>
                <span className="text-zinc-600">→</span>
                <span className="rounded-xl bg-emerald-500/20 px-3 py-2 text-emerald-300 border border-emerald-500/40">SIGNED LOG</span>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-zinc-800">
                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to Live Dashboard Terminal
                </Link>

                <button
                  onClick={() => scrollToSection("start-here")}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  ↑ Back to Top
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
