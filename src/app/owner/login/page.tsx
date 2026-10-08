"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Sparkles,
  AlertCircle,
  QrCode,
  Flame,
  Layers,
  Calendar,
  CreditCard,
  UtensilsCrossed,
  ArrowLeft,
  Mail,
  CheckCircle2,
} from "lucide-react";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"PIN" | "PASSWORD">("PIN");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("owner@theroastedbean.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (overrideCred?: { pin?: string; password?: string; email?: string }) => {
    const credToUse = overrideCred?.pin || overrideCred?.password || (authMode === "PIN" ? pin : password);
    const emailToUse = overrideCred?.email || (authMode === "PASSWORD" ? email : undefined);

    if (!credToUse) {
      setError(authMode === "PIN" ? "Please enter your 4-digit PIN" : "Please enter your password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/owner/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: authMode === "PIN" ? credToUse : undefined,
          password: authMode === "PASSWORD" ? credToUse : undefined,
          email: emailToUse,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/owner/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinKey = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        handleLogin({ pin: newPin });
      }
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-white px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Café Website</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>POS System Online</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-4xl w-full mx-auto my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Login Form */}
        <div className="lg:col-span-7 glass-panel p-8 sm:p-10 rounded-3xl border border-stone-800 shadow-2xl space-y-6">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100">
              Owner & Staff Sign In
            </h1>
            <p className="text-xs text-stone-400">
              Sign in to manage table QR codes, live kitchen orders, reservations, and billing.
            </p>
          </div>

          {/* Auth Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-stone-900 border border-stone-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode("PIN");
                setError("");
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === "PIN"
                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Quick POS PIN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("PASSWORD");
                setError("");
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === "PASSWORD"
                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode 1: Quick PIN Entry */}
          {authMode === "PIN" && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        pin.length > idx
                          ? "bg-amber-400 border-amber-400 scale-110 shadow-lg shadow-amber-400/50"
                          : "border-stone-700 bg-stone-900"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[11px] text-stone-400 font-mono tracking-wider">
                  Default Demo PIN: <strong className="text-amber-400">8899</strong>
                </div>
              </div>

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePinKey(num)}
                    className="h-12 rounded-2xl bg-stone-900 hover:bg-stone-800 active:bg-amber-500 active:text-stone-950 border border-stone-800 text-stone-100 font-bold text-lg transition-colors flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handlePinDelete}
                  className="h-12 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 text-xs font-semibold flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handlePinKey("0")}
                  className="h-12 rounded-2xl bg-stone-900 hover:bg-stone-800 active:bg-amber-500 active:text-stone-950 border border-stone-800 text-stone-100 font-bold text-lg transition-colors flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  disabled={loading || pin.length < 4}
                  onClick={() => handleLogin()}
                  className="h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center"
                >
                  {loading ? "..." : "Enter"}
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: Standard Email & Password Form */}
          {authMode === "PASSWORD" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span>Owner Email / Username</span>
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-none text-stone-100 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-none text-stone-100 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-stone-950 font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo 1-Click Access */}
          <div className="pt-4 border-t border-stone-800/80 space-y-2">
            <div className="text-[11px] text-stone-500 uppercase font-bold tracking-wider text-center">
              Instant 1-Click Demo Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPin("8899");
                  handleLogin({ pin: "8899" });
                }}
                className="px-3 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill PIN (8899)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPassword("admin_cafe_2026");
                  handleLogin({ password: "admin_cafe_2026", email: "owner@theroastedbean.com" });
                }}
                className="px-3 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Fill Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: What You Can Manage Showcase */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-stone-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
              <Sparkles className="w-4 h-4" />
              <span>Owner Operations Hub</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Once signed in, you have full control over real-time café operations:
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-900/60 border border-stone-800/80">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200">Table QR Code Manager</h4>
                  <p className="text-[11px] text-stone-400">Generate, download & print high-res table stands for all tables.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-900/60 border border-stone-800/80">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200">Live Kitchen KDS</h4>
                  <p className="text-[11px] text-stone-400">Accept, cook and serve incoming rounds with instant bill calculation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-900/60 border border-stone-800/80">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200">Floor & Table Occupancy</h4>
                  <p className="text-[11px] text-stone-400">View seated tables, register walk-ins, and merge tables for big groups.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-900/60 border border-stone-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200">Billing & Settle</h4>
                  <p className="text-[11px] text-stone-400">Record cash, card, and UPI payments and close table visits cleanly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-stone-600">
        © {new Date().getFullYear()} The Roasted Bean Café • POS & Operations Station
      </div>
    </div>
  );
}
