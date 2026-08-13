import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "https://ai-bug-tracker-api-1xtn.onrender.com/api/auth";
const OTP_LEN = 6;
const RESEND_SECONDS = 59;

export default function OtpScreen({ email, onOtpSuccess, onBack }) {
  const [digits, setDigits] = useState(new Array(OTP_LEN).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const setDigitAt = (i, v) => {
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const handleChange = (e, i) => {
    const v = e.target.value;
    if (!/^\d*$/.test(v)) return;
    setDigitAt(i, v.slice(-1));
    if (v && i < OTP_LEN - 1) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < OTP_LEN - 1) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!pasted) return;

    const next = new Array(OTP_LEN).fill("");
    pasted.split("").forEach((c, idx) => (next[idx] = c));
    setDigits(next);

    const targetIdx = Math.min(pasted.length, OTP_LEN - 1);
    inputs.current[targetIdx]?.focus();
  };

  const verify = async (e) => {
    e?.preventDefault();
    setError("");
    setInfo("");
    const code = digits.join("");
    if (code.length < OTP_LEN) {
      setError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code }),
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Invalid verification code. Please try again.");
        setDigits(new Array(OTP_LEN).fill(""));
        inputs.current[0]?.focus();
        return;
      }
      setVerified(true);
      setTimeout(() => onOtpSuccess?.(email), 700);
    } catch {
      setError("Verification service unreachable. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (secondsLeft > 0 || resending) return;
    setResending(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch(
        `${API_BASE}/resend-otp?email=${encodeURIComponent(email)}`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error();
      setSecondsLeft(RESEND_SECONDS);
      setDigits(new Array(OTP_LEN).fill(""));
      setInfo("A new code has been sent to your inbox.");
      inputs.current[0]?.focus();
    } catch {
      setError("Could not send a new code. Please try again shortly.");
    } finally {
      setResending(false);
    }
  };

  const progress = ((RESEND_SECONDS - secondsLeft) / RESEND_SECONDS) * 100;
  const allFilled = digits.every((d) => d !== "");

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-[#fafafa] flex items-center justify-center px-4 py-10 font-[Geist] relative overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, #a3e63540, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 25%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <button
          onClick={onBack}
          data-testid="otp-back-btn"
          className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-white transition-colors mb-8 group"
        >
          <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to sign in
        </button>

        <div className="bg-[#0e0e12] border border-white/[0.06] rounded-3xl p-8 lg:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
          <div className="relative w-fit mb-6">
            <div className="absolute inset-0 rounded-2xl bg-[#a3e635]/20 blur-xl" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a1a1f] to-[#0e0e12] border border-white/[0.08] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {verified ? (
                  <motion.div
                    key="ok"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <svg className="w-6 h-6 text-[#a3e635]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                ) : (
                  <motion.div
                    key="mail"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <svg className="w-6 h-6 text-[#a3e635]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8m-9 11h3a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {verified ? "You're verified." : "Check your inbox."}
          </h1>
          <p className="text-sm text-[#71717a] mt-2 leading-relaxed">
            {verified ? (
              "Redirecting to your workspace…"
            ) : (
              <>
                We sent a 6-digit verification code to{" "}
                <span className="text-[#e4e4e7] font-medium">{email}</span>. Enter it below to continue.
              </>
            )}
          </p>

          <form onSubmit={verify} className="mt-8">
            <div
              className="flex justify-between gap-2"
              onPaste={handlePaste}
              data-testid="otp-input-group"
            >
              {digits.map((d, i) => (
                <motion.input
                  key={i}
                  ref={(el) => (inputs.current[i] = el)}
                  value={d}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  data-testid={`otp-digit-${i}`}
                  whileFocus={{ scale: 1.04 }}
                  className={`w-12 h-14 lg:w-14 lg:h-16 text-center text-xl font-semibold rounded-xl bg-[#111114] border outline-none transition-all
                    ${
                      verified
                        ? "border-[#a3e635]/60 text-[#a3e635] shadow-[0_0_18px_rgba(163,230,53,0.25)]"
                        : d
                        ? "border-white/[0.18] text-white"
                        : "border-white/[0.06] text-white"
                    }
                    focus:border-[#a3e635]/60 focus:shadow-[0_0_0_4px_rgba(163,230,53,0.12)]`}
                />
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-5 flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-[#f871711a] border border-[#f87171]/25 text-[#fca5a5] text-xs"
                  data-testid="otp-error-message"
                >
                  <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#f87171]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </motion.div>
              )}
              {info && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-5 flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-[#a3e6351a] border border-[#a3e635]/30 text-[#bef264] text-xs"
                >
                  <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#a3e635]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{info}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || !allFilled || verified}
              data-testid="otp-verify-btn"
              className="w-full mt-6 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#fafafa] text-[#09090b] text-sm font-semibold disabled:bg-[#27272a] disabled:text-[#52525b] hover:bg-white transition-all shadow-[0_8px_30px_-8px_rgba(255,255,255,0.25)] disabled:shadow-none"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying…
                </>
              ) : verified ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verified
                </>
              ) : (
                "Verify & continue"
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs">
            <span className="text-[#71717a]">Didn't receive a code?</span>
            <button
              type="button"
              onClick={resend}
              disabled={secondsLeft > 0 || resending}
              data-testid="otp-resend-btn"
              className="inline-flex items-center gap-2 text-[#e4e4e7] hover:text-[#a3e635] disabled:text-[#52525b] disabled:cursor-not-allowed transition-colors font-medium"
            >
              {secondsLeft > 0 ? (
                <>
                  <ResendTimer progress={progress} seconds={secondsLeft} />
                  Resend in {secondsLeft}s
                </>
              ) : (
                <>
                  <svg className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v12" />
                  </svg>
                  Resend code
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#52525b] mt-6">
          For your security, this code expires in 10 minutes.
        </p>
      </div>
    </div>
  );
}

function ResendTimer({ progress, seconds }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r={r} fill="none" stroke="#27272a" strokeWidth="1.5" />
      <circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke="#a3e635"
        strokeWidth="1.5"
        strokeDasharray={c}
        strokeDashoffset={c - (progress / 100) * c}
        strokeLinecap="round"
        transform="rotate(-90 9 9)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}