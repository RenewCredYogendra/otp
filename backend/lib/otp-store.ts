/**
 * In-process OTP store backed by a TTL-aware Map.
 *
 * ⚠️  Suitable for single-instance deployments (Railway hobby / starter).
 *     For multi-replica setups, swap this module for a Redis adapter —
 *     the public interface is identical.
 */

interface OtpRecord {
  readonly otp: string;
  readonly expiresAt: number; // Unix ms
}

const store = new Map<string, OtpRecord>();

/** Persist an OTP against a normalised phone number. */
export function setOtp(phone: string, otp: string, ttlSecs: number): void {
  store.set(phone, { otp, expiresAt: Date.now() + ttlSecs * 1_000 });
}

/**
 * Validate and consume an OTP.
 * Returns `{ valid: true }` on success (one-time use — entry is deleted).
 * Returns `{ valid: false, reason }` on any failure.
 */
export function consumeOtp(
  phone: string,
  submitted: string,
): { valid: true } | { valid: false; reason: string } {
  const record = store.get(phone);

  if (!record) {
    return { valid: false, reason: "No OTP found for this number." };
  }

  if (Date.now() > record.expiresAt) {
    store.delete(phone);
    return { valid: false, reason: "OTP has expired." };
  }

  if (record.otp !== submitted.trim()) {
    return { valid: false, reason: "Incorrect OTP." };
  }

  store.delete(phone); // one-time use
  return { valid: true };
}
