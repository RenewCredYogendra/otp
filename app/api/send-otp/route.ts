import { NextRequest, NextResponse } from "next/server";
import { sendOtp } from "@/lib/kaleyra";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    // Basic India mobile number validation (10 digits, starts with 6-9)
    const digits = phone.replace(/\D/g, "");
    const local = digits.startsWith("91") ? digits.slice(2) : digits;
    if (!/^[6-9]\d{9}$/.test(local)) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const result = await sendOtp(phone);

    if (!result.success) {
      // Log full Kaleyra response server-side for debugging
      console.error("[send-otp] Kaleyra error response:", JSON.stringify(result.response, null, 2));
      const kaleyraError = result.response as Record<string, unknown>;
      return NextResponse.json(
        {
          error: "Kaleyra API error",
          // Surface Kaleyra's own error message/code to the client
          message: kaleyraError?.message ?? kaleyraError?.error ?? "Unknown error from Kaleyra",
          code: kaleyraError?.code,
          details: kaleyraError,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "OTP sent successfully.",
      expiresAt: result.expiresAt,
      _dev_otp: result.otp,
    });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
