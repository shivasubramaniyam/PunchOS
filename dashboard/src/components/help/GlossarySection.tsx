"use client";

import { useState } from "react";
import { GLOSSARY_TERMS, type GlossaryTerm } from "./HelpData";
import {
  Search,
  BookOpen,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
} from "lucide-react";

interface GlossarySectionProps {
  difficulty: "beginner" | "technical";
}

export default function GlossarySection({ difficulty }: GlossarySectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedTerm, setExpandedTerm] = useState<string>("SSI (Self-Sovereign Identity)");

  const categories = ["All", "Identity", "Cryptography", "Protocol", "Transparency"];

  const filteredTerms = GLOSSARY_TERMS.filter((t) => {
    const matchesCategory =
      selectedCategory === "All" || t.category === selectedCategory;
    const matchesSearch =
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.simpleExplanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.realWorldAnalogy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold font-mono">
              25
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Searchable Cryptography &amp; Protocol Glossary
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            20 fundamental terms explained in plain English, with real-world analogies and exact project usage notes.
          </p>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terms (e.g., Merkle, Nonce, Private Key, DID)..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Glossary Items List */}
      <div className="mt-6 space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {filteredTerms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
            No terms found matching &quot;{searchQuery}&quot;.
          </div>
        ) : (
          filteredTerms.map((term) => {
            const isExpanded = expandedTerm === term.term;

            return (
              <div
                key={term.term}
                className={`rounded-2xl border transition-all ${
                  isExpanded
                    ? "border-zinc-700 bg-zinc-950 shadow-md"
                    : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <button
                  onClick={() =>
                    setExpandedTerm(isExpanded ? "" : term.term)
                  }
                  className="w-full p-4 text-left cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        term.category === "Identity"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : term.category === "Cryptography"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : term.category === "Protocol"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                      }`}
                    >
                      {term.category}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {term.term}
                    </span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/80 pt-3 text-xs">
                    {/* Plain English */}
                    <div className="rounded-xl bg-zinc-900/80 p-3 border border-zinc-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-1">
                        Plain English Explanation
                      </div>
                      <p className="text-zinc-200 leading-relaxed">
                        {term.simpleExplanation}
                      </p>
                    </div>

                    {/* Analogy */}
                    <div className="rounded-xl bg-zinc-900/80 p-3 border border-zinc-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                        Real-World Analogy
                      </div>
                      <p className="text-zinc-300 leading-relaxed">
                        💡 {term.realWorldAnalogy}
                      </p>
                    </div>

                    {/* How project uses it */}
                    <div className="rounded-xl bg-zinc-900/80 p-3 border border-zinc-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                        How This Project Uses It
                      </div>
                      <p className="text-zinc-300 leading-relaxed">
                        ⚙️ {term.howProjectUsesIt}
                      </p>
                    </div>

                    {/* Technical details */}
                    <div className="rounded-xl bg-zinc-900/40 p-3 border border-zinc-800/60 font-mono text-[11px] text-zinc-400">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1 font-sans">
                        Specification Detail
                      </div>
                      {term.technicalDetails}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
