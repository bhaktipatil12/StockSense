"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useDemo } from "../../context/demo-context";
import { PageHeading, inputClass, labelClass, primaryButton, secondaryButton } from "../ui/primitives";

export function ProfileView() {
  const { state, updateProfile } = useDemo();
  const [name, setName] = useState(state.profileName);
  const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage(updateProfile(name).message); }
  return <><PageHeading eyebrow="Account" title="My profile" description="Review your account details." /><div className="max-w-xl rounded-lg border border-border p-6"><div className="mb-6 flex items-center gap-3 border-b border-border pb-6"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">TS</span><span><span className="block text-base font-semibold">{name}</span><span className="block text-xs text-ink-muted">Inventory manager</span></span></div><form onSubmit={submit} className="space-y-5"><label className={labelClass}>Display name<input className={inputClass} value={name} onChange={(event)=>setName(event.target.value)} required /></label><label className={labelClass}>Email<input className={inputClass} value="tanveer@example.com" readOnly /><span className="text-xs font-normal text-ink-muted">Email editing is currently unavailable.</span></label>{message && <p role="status" className="rounded-md bg-brand-soft p-3 text-sm text-brand-strong">{message}</p>}<div className="flex flex-wrap gap-2"><button className={primaryButton} type="submit">Save changes</button><Link href="/login" className={secondaryButton}>Log out</Link></div></form></div></>;
}
