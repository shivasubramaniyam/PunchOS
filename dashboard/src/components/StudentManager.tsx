"use client";

import { useMemo, useState } from "react";
import { Search, Trash2, UserPlus, Check } from "lucide-react";

import { api } from "@/lib/api";
import type { NewStudentInput, Student } from "@/lib/types";

interface StudentManagerProps {
  students: Student[];
  onCreated: (s: Student) => void;
  onDeleted: (roll: string) => void;
  onManuallyMarked: () => void;
}

export default function StudentManager({
  students,
  onCreated,
  onDeleted,
  onManuallyMarked,
}: StudentManagerProps) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [markRoll, setMarkRoll] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.roll.toLowerCase().includes(q) ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q),
    );
  }, [students, query]);

  async function handleCreate(form: FormData) {
    setBusy(true);
    setError(null);
    const input: NewStudentInput = {
      roll: String(form.get("roll") ?? "").trim(),
      firstName: String(form.get("firstName") ?? "").trim(),
      lastName: String(form.get("lastName") ?? "").trim(),
      branch: String(form.get("branch") ?? "").trim(),
      year: Number(form.get("year")),
      section: String(form.get("section") ?? "").trim(),
    };
    try {
      const { student } = await api.createStudent(input);
      onCreated(student);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add student");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(roll: string) {
    setBusy(true);
    setError(null);
    try {
      await api.deleteStudent(roll);
      onDeleted(roll);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete student");
    } finally {
      setBusy(false);
    }
  }

  async function handleManualMark() {
    if (!markRoll) return;
    setBusy(true);
    setError(null);
    try {
      await api.markAttendance(markRoll, "manual");
      onManuallyMarked();
      setMarkRoll("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark attendance");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
        <h3 className="text-sm font-medium text-zinc-300">
          Students <span className="ml-1 text-zinc-500">({students.length})</span>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roll or name…"
              className="h-8 w-44 rounded-lg border border-zinc-700 bg-zinc-800/70 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none"
            />
          </div>
          <select
            value={markRoll}
            onChange={(e) => setMarkRoll(e.target.value)}
            className="h-8 max-w-40 rounded-lg border border-zinc-700 bg-zinc-800/70 px-2 text-xs text-zinc-200 focus:border-emerald-500/60 focus:outline-none"
          >
            <option value="">Mark present…</option>
            {students.map((s) => (
              <option key={s.roll} value={s.roll}>
                {s.roll} — {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleManualMark}
            disabled={!markRoll || busy}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
            Mark
          </button>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-500/15 px-2.5 text-xs font-medium text-sky-400 transition-colors hover:bg-sky-500/25"
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Add
          </button>
        </div>
      </header>

      {error && (
        <p className="border-b border-rose-500/20 bg-rose-500/10 px-5 py-2 text-xs text-rose-400">
          {error}
        </p>
      )}

      {showForm && (
        <form
          className="grid grid-cols-2 gap-3 border-b border-zinc-800 px-5 py-4 md:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate(new FormData(e.currentTarget));
          }}
        >
          <input name="roll" required placeholder="Roll no." className={inputCls} />
          <input name="firstName" required placeholder="First name" className={inputCls} />
          <input name="lastName" required placeholder="Last name" className={inputCls} />
          <input name="branch" required placeholder="Branch (CSE)" className={inputCls} />
          <input name="year" required type="number" min={1} max={4} placeholder="Year" className={inputCls} />
          
            <input name="section" required placeholder="Sec" className={inputCls} />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="h-9 shrink-0 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-muted transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={busy}
              className="h-9 shrink-0 rounded-lg bg-rose-500 px-3 text-xs font-semibold text-muted transition-colors hover:bg-rose-600 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-2 font-medium">Roll</th>
              <th className="px-5 py-2 font-medium">Name</th>
              <th className="px-5 py-2 font-medium">Class</th>
              <th className="px-5 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {filtered.map((s) => (
              <tr key={s.roll} className="text-zinc-300 transition-colors hover:bg-zinc-800/40">
                <td className="px-5 py-2.5 font-mono text-xs">{s.roll}</td>
                <td className="px-5 py-2.5">
                  {s.firstName} {s.lastName}
                </td>
                <td className="px-5 py-2.5 text-xs text-zinc-500">
                  {s.branch} · {s.year}
                  {s.section}
                </td>
                <td className="px-5 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => void handleDelete(s.roll)}
                    disabled={busy}
                    title="Delete student"
                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-zinc-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const inputCls =
  "h-9 rounded-lg border border-zinc-700 bg-zinc-800/70 px-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none";
