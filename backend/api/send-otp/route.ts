import { NextRequest, NextResponse } from "next/server";
import { sendOtp, isValidIndianMobile } from "@backend/lib/kaleyra";

export async function POST(req: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { phone } = body as Record<string, unknown>;

  // ── Validate input ────────────────────────────────────────────────────────
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return NextResponse.json({ error: "phone is required." }, { status: 400 });
  }

  if (!isValidIndianMobile(phone)) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit Indian mobile number (starts with 6–9)." },
      { status: 422 },
    );
  }

  // ── Send OTP ──────────────────────────────────────────────────────────────
  try {
    const result = await sendOtp(phone);

    if (!result.success) {
      const err = result.kaleyraResponse as Record<string, unknown>;
      const message = (err?.message ?? err?.error ?? "Kaleyra API error.") as string;
      const code    = (err?.code ?? null) as string | null;

      console.error("[send-otp] Kaleyra rejected the request:", JSON.stringify(err));

      return NextResponse.json(
        { error: message, ...(code && { code }) },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success:   true,
      message:   "OTP sent successfully.",
      expiresAt: result.expiresAt,
      otp:       result.otp, // shown on screen for testing; remove in a real product
    });
  } catch (err) {
    console.error("[send-otp] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
