"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, KeyRound, Sparkles, AlertCircle } from "lucide-react";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (pwdToUse?: string) => {
    const pwd = pwdToUse || password;
    if (!pwd) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/owner/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/owner/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="glass-panel-glow p-8 sm:p-10 rounded-3xl max-w-md w-full space-y-6 border border-amber-500/40 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-100">
            Owner & Staff Portal
          </h1>
          <p className="text-xs text-stone-400">
            Access live KDS kitchen orders, table floor management, reservations, and billing analytics.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-500" /> Owner PIN or Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter PIN (8899) or Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-none text-stone-100 text-sm font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-stone-950 font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" /> Secure Staff Sign In
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="pt-4 border-t border-stone-800 space-y-2">
          <div className="text-[11px] text-stone-500 uppercase font-bold tracking-wider text-center">
            Quick Demo Credentials
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPassword("8899");
                handleLogin("8899");
              }}
              className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-amber-400 text-xs font-semibold flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> PIN: 8899
            </button>
            <button
              type="button"
              onClick={() => {
                setPassword("admin_cafe_2026");
                handleLogin("admin_cafe_2026");
              }}
              className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-semibold flex items-center justify-center gap-1"
            >
              Admin Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
