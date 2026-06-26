"use client";

import React from "react";

interface OtpInputProps {
  value: string[];
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
}

export function OtpInput({ value, refs, onChange, onKeyDown, onPaste }: OtpInputProps) {
  return (
    <div className="flex gap-2 justify-center" onPaste={onPaste}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          autoComplete="one-time-code"
          aria-label={`OTP digit ${i + 1}`}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          className="w-12 h-14 text-center text-xl font-bold text-white bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition caret-transparent"
        />
      ))}
    </div>
  );
}
