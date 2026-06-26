import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, KALEYRA_MODE } from "@backend/lib/kaleyra";

export async function POST(req: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { phone, otp } = body as Record<string, unknown>;

  // ── Validate input ────────────────────────────────────────────────────────
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return NextResponse.json({ error: "phone is required." }, { status: 400 });
  }
  if (!otp || typeof otp !== "string" || !otp.trim()) {
    return NextResponse.json({ error: "otp is required." }, { status: 400 });
  }

  // ── Verify OTP ────────────────────────────────────────────────────────────
  try {
    if (KALEYRA_MODE === "verify") {
      // Kaleyra Verify API owns the verification step.
      // Implement the Kaleyra /validate endpoint call here if needed.
      return NextResponse.json(
        { error: "Server-side OTP validation is not supported in Verify mode." },
        { status: 501 },
      );
    }

    const result = verifyOtp(phone, otp);

    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "OTP verified successfully." });
  } catch (err) {
    console.error("[verify-otp] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
