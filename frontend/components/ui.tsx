"use client";

/** Shared micro-components used across the OTP flow steps. */

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  );
}

export function Spinner() {
  return (
    <span className="inline-flex items-center justify-center gap-2" aria-label="Loading">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Processing…
    </span>
  );
}

export function OtpHint({ otp }: { otp: string }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-center">
      <p className="text-amber-400 text-xs font-mono">
        OTP:{" "}
        <span className="text-amber-300 font-bold tracking-widest select-all">{otp}</span>
      </p>
    </div>
  );
}
