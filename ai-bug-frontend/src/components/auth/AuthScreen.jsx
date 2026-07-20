import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://65.0.124.92:8080/api/auth";

export default function AuthScreen({ onLoginSuccess, onGuestAccess }) {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    if (isSignup) {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    const endpoint = isSignup ? `${API_BASE}/register` : `${API_BASE}/login`;
    const payload = isSignup
      ? { email: email.trim(), password, name: name.trim() }
      : { email: email.trim(), password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}

      if (!res.ok) {
        setError(data.error || `Failed to ${isSignup ? "create account" : "sign in"}.`);
        return;
      }

      if (isSignup) {
        setSuccess("Account created successfully. You can now sign in.");
        switchMode("signin");
      } else {
        if (data.status === "OTP_SENT") {
          onLoginSuccess?.(email.trim());
        } else {
          setError("Unexpected response configuration from authentication gateway.");
        }
      }
    } catch {
      setError("Authentication gateway unreachable. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ─── EXTRAORDINARY ANIMATION VARIANTS ───
  const screenFadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.2, ease: "easeOut" } }
  };

  const glassCardVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 30, rotateX: -8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      rotateX: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 22, 
        duration: 0.8,
        staggerChildren: 0.08,
        delayChildren: 0.15
      } 
    }
  };

  const elementSlideUp = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 140, damping: 18 } 
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={screenFadeIn}
      className="min-h-screen w-full bg-[#030303] text-[#fafafa] flex flex-col lg:flex-row font-[Geist] overflow-hidden relative perspective-1000"
    >
      {/* 🔮 INTERACTIVE AMBIENT CYBER BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#a3e635]/10 to-transparent blur-[140px] animate-[pulse_8s_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-[#06b6d4]/10 to-transparent blur-[140px] animate-[pulse_10s_infinite]" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg) translateY(-30%) scale(1.5)',
            transformOrigin: 'top center'
          }}
        />
      </div>

      {/* ─────────────── LEFT CYBERNETIC PANEL ─────────────── */}
      <BrandPanel elementSlideUp={elementSlideUp} />

      {/* ─────────────── RIGHT PREMIUM GLASS CARD PANEL ─────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16 z-10 relative">
        <motion.div 
          variants={glassCardVariants}
          className="w-full max-w-lg bg-[#0a0a0c]/40 backdrop-blur-xl border border-white/[0.05] rounded-[32px] p-8 md:p-10 shadow-[0_24px_80px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden group"
        >
          {/* Subtle Dynamic Border Glow Accent */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-b from-white/[0.04] via-transparent to-transparent" />

          {/* Mini Top Branding for Compact Screens */}
          <motion.div variants={elementSlideUp} className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a3e635] to-[#76b01b] flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.3)]">
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight">Bugsens<span className="text-[#a3e635]">.</span></span>
          </motion.div>

          {/* Futuristic Floating Toggle Switch */}
          <motion.div variants={elementSlideUp} className="relative mb-10 inline-flex p-1 rounded-2xl bg-[#141417]/80 border border-white/[0.05] shadow-inner">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`relative z-10 px-6 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 ${!isSignup ? "text-black" : "text-[#8a8a93] hover:text-white"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`relative z-10 px-6 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 ${isSignup ? "text-black" : "text-[#8a8a93] hover:text-white"}`}
            >
              Create Account
            </button>
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-1 bottom-1 rounded-xl bg-[#a3e635] shadow-[0_4px_20px_rgba(163,230,53,0.4)]"
              style={{ left: isSignup ? "50%" : "4px", right: isSignup ? "4px" : "50%" }}
            />
          </motion.div>

          {/* Form Context Headings */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: -15, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 15, filter: "blur(4px)" }}
              transition={{ duration: 0.25 }}
              className="mb-8"
            >
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-none bg-gradient-to-b from-white to-[#a1a1aa] bg-clip-text text-transparent">
                {isSignup ? "Forge your account." : "Access core hub."}
              </h1>
              <p className="text-sm text-[#71717a] mt-3">
                {isSignup ? "Deploy unified telemetry workflows across your codebase." : "Initialize server metrics and debug engines."}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form Stack inputs */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence initial={false}>
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -15 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="overflow-hidden"
                >
                  <Field
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={setName}
                    placeholder="Jane Cooper"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={elementSlideUp}>
              <Field
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8m-9 11h3a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@bugsens.dev"
              />
            </motion.div>

            <motion.div variants={elementSlideUp}>
              <Field
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                label="Security Key / Password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                trailing={
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-[#52525b] hover:text-[#fafafa] transition-colors">
                    {showPwd ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                }
              />
            </motion.div>

            <AnimatePresence initial={false}>
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -15 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="overflow-hidden"
                >
                  <Field
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                    label="Verify Security Key"
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={setConfirm}
                    placeholder="Repeat password"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {!isSignup && (
              <motion.div variants={elementSlideUp} className="flex justify-end pt-0.5">
                <button type="button" className="text-xs font-medium text-[#71717a] hover:text-[#a3e635] transition-colors">Forgot password?</button>
              </motion.div>
            )}

            {/* Error/Success Feedbacks */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/20 text-[#bef264] text-xs font-mono">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cinematic Pulsing Submit Button */}
            <motion.button
              variants={elementSlideUp}
              whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group relative w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-[#fafafa] hover:bg-white text-black text-sm font-bold tracking-tight disabled:bg-[#18181b] disabled:text-[#52525b] transition-all cursor-pointer shadow-[0_10px_35px_-10px_rgba(255,255,255,0.2)]"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <span>{isSignup ? "Initialize Account" : "Launch Console"}</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </motion.button>
          </form>

          {/* Separation Lines */}
          <motion.div variants={elementSlideUp} className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/[0.05]" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#4b4b52] font-bold">Network Relays</span>
            <div className="flex-1 h-px bg-white/[0.05]" />
          </motion.div>

         {/* Social Gateway Options */}
<motion.div variants={elementSlideUp} className="grid grid-cols-2 gap-4">
  <SocialBtn 
    label="Google"
    onClick={() => window.location.href = "http://65.0.124.92:8080/oauth2/authorization/google"}
  >
    <GoogleIcon />
    
  </SocialBtn>

  <SocialBtn  
    label="GitHub"
    onClick={() => window.location.href = "http://65.0.124.92:8080/oauth2/authorization/github"}
  >
    <GithubIcon />
    
  </SocialBtn>
</motion.div>

          {/* Guest Pipeline */}
          {onGuestAccess && (
            <motion.button
              variants={elementSlideUp}
              whileHover={{ x: 4, textShadow: "0 0 8px rgba(255,255,255,0.5)" }}
              type="button"
              onClick={onGuestAccess}
              className="w-full mt-6 text-center text-xs font-semibold text-[#8a8a93] hover:text-white transition-all cursor-pointer block"
            >
              Examine Workspace as Guest ➔
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─────────── Reusable Field Component ─────────── */
function Field({ icon, label, type, value, onChange, placeholder, trailing }) {
  return (
    <div className="space-y-2 w-full text-left">
      <label className="text-[11px] font-bold uppercase tracking-wider text-[#71717a] ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-0 bg-white/[0.01] group-focus-within:bg-[#a3e635]/[0.02] border border-white/[0.06] group-focus-within:border-[#a3e635]/40 rounded-xl transition-all duration-300 pointer-events-none" />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4b4b52] group-focus-within:text-[#a3e635] transition-colors duration-300">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent pl-11 pr-11 py-3.5 text-sm text-white placeholder:text-[#3f3f46] outline-none relative z-10 font-mono"
        />
        {trailing && <span className="absolute right-4 top-1/2 -translate-y-1/2 z-20">{trailing}</span>}
      </div>
    </div>
  );
}
/* ─────────── Glass Social Button ─────────── */
function SocialBtn({ children, label, onClick }) { // 1. Added onClick here
  return (
    <motion.button
      whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)" }}
      whileTap={{ scale: 0.97 }}
      type="button"
      onTap={onClick} // 2. Added onClick={onClick} here so the click event works!
      className="inline-flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-white/[0.01] border border-white/[0.05] text-[#e4e4e7] text-xs font-bold font-mono transition-all cursor-pointer w-full"
    >
      {children}
      <span>{label}</span>
    </motion.button>
  );
}

/* ─────────── left Sidebar Branding Component ─────────── */
function BrandPanel({ elementSlideUp }) {
  const [ticker, setTicker] = useState(1480);
  useEffect(() => {
    const handle = setInterval(() => setTicker(t => t + Math.floor(Math.random() * 3) - 1), 1000);
    return () => clearInterval(handle);
  }, []);

  return (
    <div className="hidden lg:flex w-[42%] xl:w-[38%] flex-col justify-between p-12 border-r border-white/[0.05] relative bg-[#060608]/20 backdrop-blur-md">
      {/* Upper Logotype */}
      <motion.div variants={elementSlideUp} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a3e635] to-[#76b01b] flex items-center justify-center shadow-[0_0_30px_rgba(163,230,53,0.4)]">
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight">Bugsens<span className="text-[#a3e635]">.</span></span>
      </motion.div>

      {/* Hero Header Context */}
      <div className="space-y-12 my-auto">
        <motion.div variants={elementSlideUp} className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a3e635]/10 border border-[#a3e635]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#bef264] font-mono">Neural Engine v2.4</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.05] bg-gradient-to-br from-white via-white to-[#52525b] bg-clip-text text-transparent">
            Automate core <br/>
            <span className="text-[#a3e635] bg-gradient-to-r from-[#a3e635] to-[#bef264] bg-clip-text">triage cycles.</span>
          </h2>
          <p className="text-sm text-[#71717a] max-w-sm leading-relaxed font-medium">
            Ingest machine telemetry clusters instantly. Resolve operational pipeline failures with targeted generative insight arrays.
          </p>
        </motion.div>

        {/* Custom Status Rows */}
        <motion.div variants={elementSlideUp} className="space-y-3.5 border-l-2 border-white/[0.04] pl-5">
          {["Distributed stack tracing", "Real-time session diagnostics", "Direct pipeline dispatch hooks"].map((text) => (
            <div key={text} className="flex items-center gap-3 group">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4b4b52] group-hover:bg-[#a3e635] transition-colors duration-300" />
              <span className="text-xs font-mono text-[#a1a1aa] group-hover:text-white transition-colors duration-300">{text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Operational Stats Footer */}
      <motion.div variants={elementSlideUp} className="flex items-center justify-between pt-6 border-t border-white/[0.04] font-mono text-[10px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#a3e635] shadow-[0_0_8px_#a3e635]" />
          <span className="text-[#a1a1aa] font-bold">{ticker} ingestion/sec</span>
        </div>
        <span className="text-[#52525b] font-bold">NODE: SECURE_RELAY_GATEWAY</span>
      </motion.div>
    </div>
  );
}

// ─── HIGH QUALITY CLEAN LOGO VECTOR COMPONENT INLINES ───
function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.64 14.93.6 12 .6 7.34.6 3.34 3.28 1.41 7.18l3.66 2.84C5.96 7.25 8.74 5.04 12 5.04z" />
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.5-1.12 2.78-2.39 3.64l3.67 2.84c2.15-1.98 3.74-4.92 3.74-8.72z" />
      <path fill="#FBBC05" d="M5.07 14.02c-.28-.85-.45-1.74-.45-2.67s.17-1.82.45-2.67L1.41 5.84C.51 7.62 0 9.74 0 12c0 2.26.51 4.38 1.41 6.16l3.66-2.84z" />
      <path fill="#34A853" d="M12 23.4c3.24 0 5.95-1.07 7.94-2.91l-3.67-2.84c-1.02.69-2.33 1.1-4.27 1.1-3.26 0-6.04-2.21-7-5.21l-3.66 2.84C3.34 20.72 7.34 23.4 12 23.4z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.11.79-.25.79-.55v-2.1c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.8.55C20.21 21.39 23.5 17.08 23.5 12c0-6.35-5.15-11.5-11.5-11.5z" />
    </svg>
  );
}