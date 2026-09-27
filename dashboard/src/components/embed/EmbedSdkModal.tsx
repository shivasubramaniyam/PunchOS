"use client";

import { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  X,
  Sparkles,
  Layers,
  Terminal,
  FileCode,
  ExternalLink,
} from "lucide-react";

interface EmbedSdkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrgSlug?: string;
}

export default function EmbedSdkModal({
  isOpen,
  onClose,
  currentOrgSlug = "campus",
}: EmbedSdkModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"react" | "html" | "webcomponent" | "curl">("react");
  const [selectedOrg, setSelectedOrg] = useState(currentOrgSlug);

  if (!isOpen) return null;

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const reactCode = `import { PunchTerminalWidget } from "@punch/terminal";

export function FrontDeskTerminal() {
  return (
    <PunchTerminalWidget
      orgSlug="${selectedOrg}"
      apiBaseUrl="http://localhost:8000"
      onPunchSuccess={(record) => {
        console.log(\`Attendance marked for \${record.name} (\${record.punchType})\`);
        // Trigger turnstile gate, play audio, or notify HRMS
      }}
    />
  );
}`;

  const htmlCode = `<!-- 1. Include PunchOS Web Component -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@punch/embed@latest/dist/punch-terminal.js"></script>

<!-- 2. Drop the custom element anywhere in your HTML -->
<punch-terminal
  org-slug="${selectedOrg}"
  api-base="http://localhost:8000"
  mode="kiosk"
></punch-terminal>

<script>
  document.querySelector('punch-terminal').addEventListener('punch-success', (e) => {
    console.log('Punch Verified:', e.detail);
  });
</script>`;

  const curlCode = `# Backend-to-Backend Direct Punch Verification
curl -X POST http://localhost:8000/api/punch/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "qrText": "punch.v1:eyJhbGciOiJFUzI1NiJ9...eyJ2IjoxLCJraWQiOiJ...sig..."
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-emerald-500/30 bg-zinc-950 p-6 shadow-2xl text-zinc-100">
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-600/20 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-black font-bold shadow-lg shadow-emerald-500/20">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Plug &amp; Play SDK &amp; Widget Embedder
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-500/20">
                  NPM / CDN Ready
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Embed high-speed biometric scanning into any corporate portal or website in 2 minutes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Org Selector & Format Tabs */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-medium">Target Organization:</span>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-white focus:outline-none"
            >
              <option value="campus">Campus / University (campus)</option>
              <option value="tech-corp">Tech Park / Corporate (tech-corp)</option>
              <option value="city-hospital">Hospital / Healthcare (city-hospital)</option>
              <option value="apex-events">Conferences &amp; Events (apex-events)</option>
            </select>
          </div>

          <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1 text-xs font-semibold">
            <button
              onClick={() => setSelectedTab("react")}
              className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                selectedTab === "react" ? "bg-emerald-500 text-black shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              React / Next.js
            </button>
            <button
              onClick={() => setSelectedTab("html")}
              className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                selectedTab === "html" ? "bg-emerald-500 text-black shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              HTML / CDN
            </button>
            <button
              onClick={() => setSelectedTab("curl")}
              className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                selectedTab === "curl" ? "bg-emerald-500 text-black shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              REST cURL
            </button>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="mt-4 relative rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 font-mono text-xs">
          <button
            onClick={() =>
              copyCode(
                selectedTab,
                selectedTab === "react" ? reactCode : selectedTab === "html" ? htmlCode : curlCode
              )
            }
            className="absolute top-3 right-3 flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 hover:text-white hover:border-emerald-500 transition-colors cursor-pointer"
          >
            {copiedKey === selectedTab ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy Snippet
              </>
            )}
          </button>

          <pre className="overflow-x-auto text-emerald-300 pr-20 max-h-56">
            <code>
              {selectedTab === "react" && reactCode}
              {selectedTab === "html" && htmlCode}
              {selectedTab === "curl" && curlCode}
            </code>
          </pre>
        </div>

        {/* Features Checklist */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-400">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
            ⚡ <strong>Zero-Config:</strong> Auto camera detection &amp; 60fps decoding.
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
            🛡️ <strong>Zero-Trust:</strong> ES256 P-256 cryptographic verification.
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
            📴 <strong>Offline-Ready:</strong> Built-in IndexedDB key cache.
          </div>
        </div>
      </div>
    </div>
  );
}
