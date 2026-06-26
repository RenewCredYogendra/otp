/**
 * Kaleyra India SMS OTP client.
 *
 * Modes
 * ─────
 * "sms"    — Send OTP via /messages endpoint with a DLT-registered template.
 *            OTP is generated here and validated server-side via otp-store.
 * "verify" — Delegate to Kaleyra Verify API (requires KALEYRA_FLOW_ID).
 *            Generation and validation are handled by Kaleyra.
 */

import { config } from "@backend/lib/config";
import { setOtp, consumeOtp } from "@backend/lib/otp-store";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SendOtpResult {
  success: boolean;
  /** Generated OTP (sms mode only). */
  otp?: string;
  /** Expiry timestamp in Unix ms (sms mode only). */
  expiresAt?: number;
  /** Raw Kaleyra API response body. */
  kaleyraResponse: unknown;
}

export type VerifyOtpResult =
  | { valid: true }
  | { valid: false; reason: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a cryptographically-sufficient numeric OTP. */
function generateOtp(length: number): string {
  // Use crypto.getRandomValues for uniform distribution
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  const range = max - min;
  const rand = crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff;
  return String(min + Math.floor(rand * range));
}

/** Normalise any Indian phone number to E.164 without the leading '+'. */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/** Validate an Indian mobile number (10 digits, starting 6–9). */
export function isValidIndianMobile(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local);
}

// ─── Kaleyra API calls ───────────────────────────────────────────────────────

async function callSmsApi(phone: string, otp: string): Promise<{ ok: boolean; body: unknown }> {
  const { apiDomain, sid, apiKey, senderId, templateId, otpBody } = config.kaleyra;

  const message = otpBody.replace("{otp}", otp);
  const url = `${apiDomain}/v1/${sid}/messages`;

  const params = new URLSearchParams({
    to:          phone,
    type:        "OTP",
    sender:      senderId,
    body:        message,
    template_id: templateId,
  });

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      "api-key":      apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  return { ok: res.ok, body: await res.json() };
}

async function callVerifyApi(phone: string): Promise<{ ok: boolean; body: unknown }> {
  const { apiDomain, sid, apiKey, flowId } = config.kaleyra;

  const url = `${apiDomain}/v1/${sid}/verify/otp`;
  const params = new URLSearchParams({ to: phone, flow_id: flowId });

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      "api-key":      apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  return { ok: res.ok, body: await res.json() };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendOtp(rawPhone: string): Promise<SendOtpResult> {
  const phone = normalisePhone(rawPhone);
  const { mode, otpLength, otpTtlSecs } = config.kaleyra;

  if (mode === "verify") {
    const { ok, body } = await callVerifyApi(phone);
    return { success: ok, kaleyraResponse: body };
  }

  // sms mode
  const otp = generateOtp(otpLength);
  const expiresAt = Date.now() + otpTtlSecs * 1_000;

  const { ok, body } = await callSmsApi(phone, otp);

  if (ok) {
    setOtp(phone, otp, otpTtlSecs);
  }

  return { success: ok, otp, expiresAt, kaleyraResponse: body };
}

export function verifyOtp(rawPhone: string, submitted: string): VerifyOtpResult {
  const phone = normalisePhone(rawPhone);
  return consumeOtp(phone, submitted);
}

export const { mode: KALEYRA_MODE } = config.kaleyra;
