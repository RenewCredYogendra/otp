"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type Step = "phone" | "otp" | "success";

interface OtpFlowState {
  step: Step;
  phone: string;
  otp: string[];
  loading: boolean;
  error: string;
  otpHint: string;
  countdown: number;
  canResend: boolean;
}

interface OtpFlowActions {
  setPhone: (v: string) => void;
  setOtp: (v: string[]) => void;
  handleSendOtp: (e: React.FormEvent) => Promise<void>;
  handleVerifyOtp: (e: React.FormEvent) => Promise<void>;
  handleResend: () => Promise<void>;
  reset: () => void;
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}

const EMPTY_OTP = ["", "", "", "", "", ""];

async function postJson(url: string, data: Record<string, string>) {
  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  const json = await res.json();
  return { ok: res.ok, data: json as Record<string, unknown> };
}

export function useOtpFlow(): OtpFlowState & OtpFlowActions {
  const [step,      setStep]      = useState<Step>("phone");
  const [phone,     setPhone]     = useState("");
  const [otp,       setOtp]       = useState<string[]>(EMPTY_OTP);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [otpHint,   setOtpHint]   = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown ticker
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1_000));
      setCountdown(remaining);
      if (remaining === 0) setCanResend(true);
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const focusFirst = useCallback(() => {
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, []);

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { ok, data } = await postJson("/api/send-otp", { phone });
      if (!ok) {
        const code = data.code ? ` (${data.code})` : "";
        setError(`${data.error ?? data.message ?? "Failed to send OTP."}${code}`);
        return;
      }
      setExpiresAt((data.expiresAt as number) ?? null);
      setCanResend(false);
      if (data.otp) setOtpHint(data.otp as string);
      setStep("otp");
      focusFirst();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [phone, focusFirst]);

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const { ok, data } = await postJson("/api/verify-otp", { phone, otp: code });
      if (!ok) {
        setError((data.error as string) ?? "Verification failed.");
        return;
      }
      setStep("success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [phone, otp]);

  // ── Resend ────────────────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    setOtp(EMPTY_OTP);
    setOtpHint("");
    setError("");
    setCanResend(false);
    setLoading(true);
    try {
      const { ok, data } = await postJson("/api/send-otp", { phone });
      if (!ok) {
        const code = data.code ? ` (${data.code})` : "";
        setError(`${data.error ?? data.message ?? "Failed to resend OTP."}${code}`);
        return;
      }
      setExpiresAt((data.expiresAt as number) ?? null);
      if (data.otp) setOtpHint(data.otp as string);
      focusFirst();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [phone, focusFirst]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep("phone");
    setPhone("");
    setOtp(EMPTY_OTP);
    setError("");
    setOtpHint("");
    setExpiresAt(null);
    setCountdown(0);
    setCanResend(false);
  }, []);

  return {
    step, phone, otp, loading, error, otpHint, countdown, canResend,
    setPhone, setOtp,
    handleSendOtp, handleVerifyOtp, handleResend, reset,
    otpRefs,
  };
}
