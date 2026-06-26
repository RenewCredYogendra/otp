import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, MODE } from "@/lib/kaleyra";

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }
    if (!otp || typeof otp !== "string") {
      return NextResponse.json({ error: "otp is required" }, { status: 400 });
    }

    if (MODE === "verify") {
      // Kaleyra Verify API handles verification server-side
      // For a real integration, you would call the Verify check endpoint here.
      return NextResponse.json(
        { error: "Verify mode: call the Kaleyra Verify check endpoint directly." },
        { status: 501 }
      );
    }

    const result = verifyOtp(phone, otp);

    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    return NextResponse.json({ message: "OTP verified successfully. ✅" });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
