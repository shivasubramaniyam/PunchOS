"use client";

import { useState } from "react";
import { Lock, LogIn, UserPlus, ShieldAlert, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

interface FacultyAuthModalProps {
  onSuccess: (user: { name: string; email: string; role: string }) => void;
}

export default function FacultyAuthModal({ onSuccess }: FacultyAuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login({ email, password });
        if (res.token) {
          localStorage.setItem("punch.faculty_token", res.token);
          localStorage.setItem("punch.faculty_user", JSON.stringify(res.user));
          onSuccess(res.user);
        }
      } else {
        const res = await api.register({ email, password, name, role: "faculty" });
        if (res.token) {
          localStorage.setItem("punch.faculty_token", res.token);
          localStorage.setItem("punch.faculty_user", JSON.stringify(res.user));
          onSuccess(res.user);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/95 p-8 shadow-2xl shadow-emerald-500/10">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-3.5 border border-emerald-500/30 text-emerald-400 mb-4 shadow-inner">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isLogin ? "Faculty & Admin Portal" : "Register Faculty Account"}
          </h2>
          <p className="mt-1.5 text-xs text-zinc-400">
            Sign in with your official faculty credentials to access live camera terminal, student roster, and Merkle audit logs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin ? (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Sarah Connor"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 transition-all"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Faculty Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="faculty@university.edu"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 transition-all"
            />
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">Authenticating…</span>
            ) : isLogin ? (
              <>
                <LogIn className="h-4 w-4" />
                Sign In to Faculty Terminal
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create Faculty Account
              </>
            )}
          </button>
        </form>

        <div className="mt-5 border-t border-zinc-800/80 pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            {isLogin
              ? "Need a new Faculty Account? Register here"
              : "Already have an account? Sign In"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>RBAC Protected • Zero-Trust Biometric Terminal</span>
        </div>
      </div>
    </div>
  );
}
