"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inputClass, labelClass, primaryButton } from "../ui/primitives";
import { StockMark } from "../ui/stock-mark";

export function AuthView({ mode }: { mode: "login" | "signup" | "forgot-password" }) {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "forgot-password") { setMessage("Email delivery and OTP verification require the backend. No reset message was sent."); return; }
    if (isSignup && (loginId.length < 6 || loginId.length > 12)) { setMessage("Login ID must contain 6 to 12 characters."); return; }
    if (isSignup && (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/.test(password) || password !== confirm)) { setMessage("Use more than 8 characters with uppercase, lowercase, and a special character. Passwords must match."); return; }
    router.push("/dashboard");
  }
  return <div className="flex min-h-screen bg-white">
    <div className="flex min-w-0 flex-1 flex-col justify-between gap-10 px-6 py-8 sm:px-12 sm:py-10"><Link className="flex items-center gap-2" href="/dashboard"><StockMark className="h-7 w-7" /><span className="font-serif text-2xl tracking-tight">StockSense</span></Link><div className="mx-auto w-full max-w-[25rem]"><h1 className="text-3xl font-bold tracking-tight">{isLogin ? "Log in to StockSense" : isSignup ? "Create your account" : "Reset your password"}</h1><p className="mt-2 text-sm leading-6 text-ink-muted">{isLogin ? "Your inventory workspace is ready." : isSignup ? "Set up your account to manage stock operations." : "Enter your account email to request an OTP reset."}</p><form className="mt-6 space-y-4" onSubmit={submit}>{isSignup && <label className={labelClass}>Login ID<input className={inputClass} value={loginId} onChange={(event)=>setLoginId(event.target.value)} minLength={6} maxLength={12} required autoComplete="username" /><span className="text-xs font-normal text-ink-muted">6 to 12 characters</span></label>}{!isLogin && <label className={labelClass}>Email<input className={inputClass} type="email" value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="name@example.com" required autoComplete="email" /></label>}{isLogin && <label className={labelClass}>Login ID or email<input className={inputClass} value={loginId} onChange={(event)=>setLoginId(event.target.value)} required autoComplete="username" /></label>}{mode !== "forgot-password" && <label className={labelClass}>Password<input className={inputClass} type="password" value={password} onChange={(event)=>setPassword(event.target.value)} required autoComplete={isLogin ? "current-password" : "new-password"} /></label>}{isSignup && <label className={labelClass}>Confirm password<input className={inputClass} type="password" value={confirm} onChange={(event)=>setConfirm(event.target.value)} required autoComplete="new-password" /><span className="text-xs font-normal text-ink-muted">More than 8 characters; uppercase, lowercase, special character.</span></label>}{message && <p role="alert" className="rounded-md bg-bad-wash px-3 py-2 text-sm text-bad-ink">{message}</p>}<button type="submit" className={`${primaryButton} w-full`}>{isLogin ? "Sign in" : isSignup ? "Create account" : "Request reset OTP"}</button></form><div className="mt-5 flex items-center justify-between text-xs">{isLogin ? <><Link href="/forgot-password" className="font-semibold text-brand-strong hover:underline">Forgot password?</Link><Link href="/signup" className="font-semibold text-brand-strong hover:underline">Create an account</Link></> : <Link href="/login" className="font-semibold text-brand-strong hover:underline">Back to login</Link>}</div></div><span className="text-xs text-ink-subtle">StockSense · Inventory workspace</span></div>
    <aside className="hidden w-[45%] shrink-0 flex-col justify-between bg-brand-strong p-12 text-white lg:flex"><div><p className="font-mono text-[11px] uppercase tracking-widest text-white/80">Inventory in motion</p><h2 className="mt-3 max-w-md font-serif text-4xl leading-tight">Know what moved, where it is, and what comes next.</h2></div><div className="rounded-lg border border-white/50 bg-white p-6 text-foreground"><p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Today's workflow</p><div className="mt-5 space-y-3">{[["Receipt","100 kg steel rods"],["Transfer","30 kg to production"],["Delivery","20 kg dispatched"],["Count","48 kg on hand"]].map(([label,value],index)=><div className="flex items-center justify-between border-b border-border-subtle pb-3 text-sm last:border-0" key={label}><span><span className="mr-3 font-mono text-xs text-brand-strong">0{index+1}</span>{label}</span><span className="font-medium">{value}</span></div>)}</div></div><p className="text-xs text-white/80">A document trail for every quantity change.</p></aside>
  </div>;
}
