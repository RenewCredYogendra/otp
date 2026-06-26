"use client";

import { useState, useRef, useEffect } from "react";

type Step = "phone" | "otp" | "success";

export default function Home() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) setCanResend(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // ── Send OTP ──────────────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Show the specific Kaleyra error message if available
        const msg = data.message ?? data.error ?? "Failed to send OTP.";
        const code = data.code ? ` (${data.code})` : "";
        setError(`${msg}${code}`);
        return;
      }
      setExpiresAt(data.expiresAt ?? null);
      setCanResend(false);
      if (data._dev_otp) setDevOtp(data._dev_otp);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP input handling ────────────────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  }

  // ── Verify OTP ────────────────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      setStep("success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Resend ────────────────────────────────────────────────────────────────
  async function handleResend() {
    setOtp(["", "", "", "", "", ""]);
    setDevOtp("");
    setError("");
    setCanResend(false);
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message ?? data.error ?? "Failed to resend OTP.";
        const code = data.code ? ` (${data.code})` : "";
        setError(`${msg}${code}`);
        return;
      }
      setExpiresAt(data.expiresAt ?? null);
      if (data._dev_otp) setDevOtp(data._dev_otp);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("phone");
    setPhone("");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setDevOtp("");
    setExpiresAt(null);
    setCountdown(0);
    setCanResend(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/30 mb-4">
              <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Kaleyra OTP Tester</h1>
            <p className="text-slate-400 text-sm mt-1">India SMS Channel · {process.env.NEXT_PUBLIC_MODE ?? "SMS"} mode</p>
          </div>

          {/* ── Step: Phone ─────────────────────────────────────────── */}
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-white/10 bg-white/5 text-slate-400 text-sm">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98XXXXXXXX"
                    required
                    maxLength={10}
                    className="flex-1 rounded-r-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {error && <ErrorBanner message={error} />}

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {loading ? <Spinner /> : "Send OTP"}
              </button>
            </form>
          )}

          {/* ── Step: OTP ───────────────────────────────────────────── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center">
                <p className="text-slate-300 text-sm">
                  OTP sent to <span className="text-white font-medium">+91 {phone}</span>
                </p>
                {countdown > 0 && (
                  <p className="text-slate-500 text-xs mt-1">
                    Expires in <span className="text-indigo-400 font-mono">{countdown}s</span>
                  </p>
                )}
              </div>

              {/* 6-box OTP input */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold text-white bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition caret-transparent"
                  />
                ))}
              </div>

              {error && <ErrorBanner message={error} />}

              {/* Dev OTP hint */}
              {devOtp && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-center">
                  <p className="text-amber-400 text-xs font-mono">
                    🛠 Dev OTP: <span className="text-amber-300 font-bold tracking-widest">{devOtp}</span>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {loading ? <Spinner /> : "Verify OTP"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={reset} className="text-slate-500 hover:text-slate-300 transition">
                  ← Change number
                </button>
                {canResend ? (
                  <button type="button" onClick={handleResend} disabled={loading}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                    Resend OTP
                  </button>
                ) : (
                  <span className="text-slate-600">Resend in {countdown}s</span>
                )}
              </div>
            </form>
          )}

          {/* ── Step: Success ───────────────────────────────────────── */}
          {step === "success" && (
            <div className="text-center space-y-5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Verified!</h2>
                <p className="text-slate-400 text-sm mt-1">
                  +91 {phone} was successfully authenticated.
                </p>
              </div>
              <button
                onClick={reset}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition"
              >
                Test Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Powered by{" "}
          <a href="https://developers.kaleyra.io" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition">
            Kaleyra API
          </a>{" "}
          · India Region
        </p>
      </div>
    </main>
  );
}

// ── Small shared components ───────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Processing…
    </span>
  );
}
