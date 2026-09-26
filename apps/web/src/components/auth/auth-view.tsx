"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StockMark } from "../ui/stock-mark";
import { inputClass, labelClass, primaryButton } from "../ui/primitives";

type Mode = "login" | "signup" | "forgot-password";
type ResetStep = "request" | "verify";

export function AuthView({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [resetStep, setResetStep] = useState<ResetStep>("request");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (isSignup && !/^[A-Za-z0-9_]{6,12}$/.test(login)) { setMessage("Login ID must be 6 to 12 letters, numbers, or underscores."); return; }
    if (mode !== "login" && resetStep === "verify" || isSignup) {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/.test(password)) { setMessage("Use at least 9 characters with uppercase, lowercase, and a symbol."); return; }
      if (password !== confirm) { setMessage("Passwords do not match."); return; }
    }
    setBusy(true);
    try {
      const reset = mode === "forgot-password";
      const endpoint = reset ? `/api/backend/auth/password-reset/${resetStep}` : "/api/session";
      const body = reset ? resetStep === "request" ? { email } : { email, otp, new_password: password } : isLogin ? { action: "login", login, password } : { action: "signup", login, email, name, password, role: "manager" };
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = payload && typeof payload === "object" && "detail" in payload ? payload.detail : null;
        throw new Error(typeof detail === "string" ? detail : "Request failed. Please try again.");
      }
      if (reset) {
        if (resetStep === "request") {
          setResetStep("verify");
          const code = payload && typeof payload === "object" && "otp" in payload && typeof payload.otp === "string" ? payload.otp : null;
          setMessage(code ? `Development reset code: ${code}` : "Check your email for the reset code.");
        } else { router.replace("/login?reset=done"); }
      } else { router.replace("/dashboard"); router.refresh(); }
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Request failed."); }
    finally { setBusy(false); }
  }
  return <div className="flex min-h-dvh bg-white text-foreground">
    <div className="flex min-w-0 flex-1 flex-col justify-between gap-10 px-6 py-8 sm:px-12 sm:py-10">
      <Link className="flex w-fit items-center gap-2" href="/"><StockMark className="h-[22px] w-[22px]" /><span className="font-display text-[19px] font-medium tracking-tight">StockSense</span></Link>
      <div className="mx-auto w-full max-w-[25rem]">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{isLogin ? "Log in to StockSense" : isSignup ? "Create your account" : "Reset your password"}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{isLogin ? "Enter your account credentials." : isSignup ? "Create an account for your inventory workspace." : resetStep === "request" ? "Enter your account email to request a reset code." : "Enter your reset code and a new password."}</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {isSignup && <label className={labelClass}>Display name<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></label>}
          {mode !== "forgot-password" && <label className={labelClass}>Login ID<input className={inputClass} value={login} onChange={(event) => setLogin(event.target.value)} minLength={isSignup ? 6 : undefined} maxLength={isSignup ? 12 : undefined} required autoComplete="username" /></label>}
          {!isLogin && <label className={labelClass}>Email<input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>}
          {mode === "forgot-password" && resetStep === "verify" && <label className={labelClass}>Reset code<input className={inputClass} inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value)} required /></label>}
          {(mode !== "forgot-password" || resetStep === "verify") && <div className={labelClass}><label htmlFor="account-password">{isLogin ? "Password" : "New password"}</label><div className="relative"><input id="account-password" className={`${inputClass} pr-16`} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete={isLogin ? "current-password" : "new-password"} /><button type="button" className="absolute inset-y-0 right-2 px-2 text-xs font-medium text-brand-strong hover:text-foreground" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div></div>}
          {(isSignup || mode === "forgot-password" && resetStep === "verify") && <label className={labelClass}>Confirm password<input className={inputClass} type={showPassword ? "text" : "password"} value={confirm} onChange={(event) => setConfirm(event.target.value)} required autoComplete="new-password" /><span className="text-xs font-normal text-ink-muted">At least 9 characters, uppercase, lowercase, and a symbol.</span></label>}
          {message && <p role="status" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-strong">{message}</p>}
          <button type="submit" className={`${primaryButton} w-full`} disabled={busy}>{busy ? "Please wait…" : isLogin ? "Sign in" : isSignup ? "Create account" : resetStep === "request" ? "Request reset code" : "Set new password"}</button>
        </form>
        <div className="mt-5 flex items-center justify-between text-xs">{isLogin ? <><Link href="/forgot-password" className="font-semibold text-brand-strong hover:underline">Forgot password?</Link><Link href="/signup" className="font-semibold text-brand-strong hover:underline">Create an account</Link></> : <Link href="/login" className="font-semibold text-brand-strong hover:underline">Back to login</Link>}</div>
      </div>
      <span className="text-xs text-ink-subtle">StockSense · Inventory workspace</span>
    </div>
    <aside className="hidden w-[45%] shrink-0 flex-col justify-between bg-brand-strong p-12 text-white lg:flex"><div><p className="font-mono text-[11px] uppercase tracking-widest text-white/80">Inventory in motion</p><h2 className="mt-3 max-w-md font-display text-4xl leading-tight">Know what moved, where it is, and what comes next.</h2></div><div className="rounded-lg border border-white/50 bg-white p-6 text-foreground"><p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Stock workflow</p><div className="mt-5 space-y-3">{["Receive goods", "Move stock", "Deliver orders", "Count inventory"].map((label, index) => <div className="flex items-center gap-3 border-b border-border-subtle pb-3 text-sm last:border-0" key={label}><span className="font-mono text-xs text-brand-strong">0{index + 1}</span>{label}</div>)}</div></div><p className="text-xs text-white/80">A document trail for every quantity change.</p></aside>
  </div>;
}
