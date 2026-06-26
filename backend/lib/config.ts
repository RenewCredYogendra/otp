/**
 * Validated environment configuration.
 * Fails fast at startup if required variables are missing.
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (isNaN(n) || n <= 0) throw new Error(`Invalid value for ${key}: must be a positive integer`);
  return n;
}

export const config = {
  kaleyra: {
    apiDomain:   required("KALEYRA_API_DOMAIN"),
    apiKey:      required("KALEYRA_API_KEY"),
    sid:         required("KALEYRA_SID"),
    mode:        (process.env.KALEYRA_MODE ?? "sms") as "sms" | "verify",
    senderId:    required("KALEYRA_SENDER_ID"),
    templateId:  required("KALEYRA_TEMPLATE_ID"),
    otpBody:     required("KALEYRA_OTP_BODY"),
    flowId:      process.env.KALEYRA_FLOW_ID ?? "",
    otpLength:   optionalInt("KALEYRA_OTP_LENGTH", 6),
    otpTtlSecs:  optionalInt("KALEYRA_OTP_TTL_SECONDS", 300),
  },
} as const;
