/**
 * Kaleyra India SMS OTP utility
 * Supports two modes:
 *   - "sms"    → Send OTP SMS API  (DLT-registered template)
 *   - "verify" → Kaleyra Verify API (flow_id required)
 */

const API_DOMAIN = process.env.KALEYRA_API_DOMAIN!;
const API_KEY = process.env.KALEYRA_API_KEY!;
const SID = process.env.KALEYRA_SID!;
const MODE = (process.env.KALEYRA_MODE ?? "sms") as "sms" | "verify";
const SENDER_ID = process.env.KALEYRA_SENDER_ID!;
const TEMPLATE_ID = process.env.KALEYRA_TEMPLATE_ID!;
const OTP_BODY_TEMPLATE = process.env.KALEYRA_OTP_BODY!;
const OTP_LENGTH = parseInt(process.env.KALEYRA_OTP_LENGTH ?? "6", 10);
const OTP_TTL = parseInt(process.env.KALEYRA_OTP_TTL_SECONDS ?? "300", 10);
const FLOW_ID = process.env.KALEYRA_FLOW_ID ?? "";

// ─── In-memory OTP store (replace with Redis / DB in production) ───────────
interface OtpRecord {
  otp: string;
  expiresAt: number; // unix ms
}
const otpStore = new Map<string, OtpRecord>();

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateOtp(length: number): string {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  return String(Math.floor(min + Math.random() * (max - min)));
}

function normalisePhone(phone: string): string {
  // Strip everything except digits, then ensure 91 country code
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

// ─── SMS mode ───────────────────────────────────────────────────────────────

async function sendSmsOtp(phone: string, otp: string): Promise<{ success: boolean; response: unknown }> {
  const message = OTP_BODY_TEMPLATE.replace("{otp}", otp);

  const url = `${API_DOMAIN}/v1/${SID}/messages`;
  const body = new URLSearchParams({
    to: phone,
    type: "OTP",
    sender: SENDER_ID,      // Kaleyra uses "sender", not "sender_id"
    body: message,
    template_id: TEMPLATE_ID,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  return { success: res.ok, response: data };
}

// ─── Verify mode ────────────────────────────────────────────────────────────

async function sendVerifyOtp(phone: string): Promise<{ success: boolean; response: unknown }> {
  const url = `${API_DOMAIN}/v1/${SID}/verify/otp`;
  const body = new URLSearchParams({
    to: phone,
    flow_id: FLOW_ID,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  return { success: res.ok, response: data };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function sendOtp(
  phone: string
): Promise<{ success: boolean; otp?: string; expiresAt?: number; response: unknown }> {
  const normPhone = normalisePhone(phone);

  if (MODE === "verify") {
    const result = await sendVerifyOtp(normPhone);
    return result;
  }

  // SMS mode — we generate and store the OTP locally
  const otp = generateOtp(OTP_LENGTH);
  const expiresAt = Date.now() + OTP_TTL * 1000;

  const result = await sendSmsOtp(normPhone, otp);

  if (result.success) {
    otpStore.set(normPhone, { otp, expiresAt });
  }

  return { ...result, otp, expiresAt };
}

export function verifyOtp(phone: string, submittedOtp: string): { valid: boolean; reason?: string } {
  const normPhone = normalisePhone(phone);
  const record = otpStore.get(normPhone);

  if (!record) return { valid: false, reason: "No OTP found for this number." };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normPhone);
    return { valid: false, reason: "OTP has expired." };
  }
  if (record.otp !== submittedOtp.trim()) {
    return { valid: false, reason: "Incorrect OTP." };
  }

  otpStore.delete(normPhone); // one-time use
  return { valid: true };
}

export { MODE, OTP_TTL, OTP_LENGTH };
