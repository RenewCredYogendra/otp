import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title:       "Kaleyra OTP Tester — India",
  description: "Test Kaleyra SMS OTP channel for India using DLT-registered templates.",
  robots:      { index: false, follow: false }, // internal tool — no indexing
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>{children}</body>
    </html>
  );
}
