"use client";

import { useOtpFlow } from "@frontend/hooks/use-otp-flow";
import { OtpInput }   from "@frontend/components/OtpInput";
import { ErrorBanner, Spinner, OtpHint } from "@frontend/components/ui";

export default function OtpTesterPage() {
  const flow = useOtpFlow();

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const updated = [...flow.otp];
    updated[index] = value.slice(-1);
    flow.setOtp(updated);
    if (value && index < 5) flow.otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !flow.otp[index] && index > 0) {
      flow.otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (digits.length === 6) {
      flow.setOtp(digits.split(""));
      flow.otpRefs.current[5]?.focus();
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Card ──────────────────────────────────────────────────────── */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/30 mb-4">
              <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Kaleyra OTP Tester</h1>
            <p className="text-slate-400 text-sm mt-1">India SMS Channel · SMS mode</p>
          </div>

          {/* ── Step: Phone ─────────────────────────────────────────────── */}
          {flow.step === "phone" && (
            <form onSubmit={flow.handleSendOtp} className="space-y-5" noValidate>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-white/10 bg-white/5 text-slate-400 text-sm select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={flow.phone}
                    onChange={(e) => flow.setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98XXXXXXXX"
                    required
                    autoComplete="tel-national"
                    maxLength={10}
                    className="flex-1 rounded-r-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {flow.error && <ErrorBanner message={flow.error} />}

              <button
                type="submit"
                disabled={flow.loading || flow.phone.length !== 10}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {flow.loading ? <Spinner /> : "Send OTP"}
              </button>
            </form>
          )}

          {/* ── Step: OTP ───────────────────────────────────────────────── */}
          {flow.step === "otp" && (
            <form onSubmit={flow.handleVerifyOtp} className="space-y-6" noValidate>
              <div className="text-center">
                <p className="text-slate-300 text-sm">
                  OTP sent to{" "}
                  <span className="text-white font-medium">+91 {flow.phone}</span>
                </p>
                {flow.countdown > 0 && (
                  <p className="text-slate-500 text-xs mt-1">
                    Expires in{" "}
                    <span className="text-indigo-400 font-mono">{flow.countdown}s</span>
                  </p>
                )}
              </div>

              <OtpInput
                value={flow.otp}
                refs={flow.otpRefs}
                onChange={handleOtpChange}
                onKeyDown={handleOtpKeyDown}
                onPaste={handleOtpPaste}
              />

              {flow.error && <ErrorBanner message={flow.error} />}

              {flow.otpHint && <OtpHint otp={flow.otpHint} />}

              <button
                type="submit"
                disabled={flow.loading || flow.otp.join("").length < 6}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {flow.loading ? <Spinner /> : "Verify OTP"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={flow.reset}
                  className="text-slate-500 hover:text-slate-300 transition"
                >
                  ← Change number
                </button>
                {flow.canResend ? (
                  <button
                    type="button"
                    onClick={flow.handleResend}
                    disabled={flow.loading}
                    className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-40 transition"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="text-slate-600">Resend in {flow.countdown}s</span>
                )}
              </div>
            </form>
          )}

          {/* ── Step: Success ────────────────────────────────────────────── */}
          {flow.step === "success" && (
            <div className="text-center space-y-5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Verified!</h2>
                <p className="text-slate-400 text-sm mt-1">
                  +91 {flow.phone} was successfully authenticated.
                </p>
              </div>
              <button
                onClick={flow.reset}
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
          <a
            href="https://developers.kaleyra.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition"
          >
            Kaleyra API
          </a>{" "}
          · India Region
        </p>
      </div>
    </main>
  );
}
