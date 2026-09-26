"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useDemo } from "../../context/demo-context";
import { PageHeading, inputClass, labelClass, primaryButton, secondaryButton } from "../ui/primitives";

export function ProfileView() {
  const { state, updateProfile } = useDemo();
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const name = nameDraft ?? state.profileName;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = updateProfile(name);
    setMessage(result.message);
    if (result.ok) setNameDraft(null);
  }
  return <>
    <PageHeading eyebrow="Account" title="My profile" description="Review your account details." />
    <div className="grid max-w-5xl gap-8 rounded-lg border border-border bg-white p-6 sm:p-8 lg:grid-cols-[minmax(220px,.7fr)_minmax(0,1fr)] lg:gap-12 lg:p-10">
      <div className="border-b border-border pb-7 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">{state.profileName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><h2 className="mt-5 text-lg font-semibold">{state.profileName}</h2><p className="mt-1 text-sm text-ink-muted">Inventory manager</p><p className="mt-6 max-w-xs text-xs leading-5 text-ink-muted">Profile changes are saved in this browser with your inventory workspace.</p></div>
      <form onSubmit={submit} className="max-w-xl space-y-6"><div><h2 className="text-base font-semibold">Account details</h2><p className="mt-1 text-xs text-ink-muted">Keep your display name current for stock records.</p></div><label className={labelClass}>Display name<input className={inputClass} value={name} onChange={(event) => setNameDraft(event.target.value)} required /></label><label className={labelClass}>Email<input className={`${inputClass} bg-secondary text-ink-muted`} value="tanveer@example.com" readOnly /><span className="text-xs font-normal text-ink-muted">Email editing is currently unavailable.</span></label>{message && <p role="status" className="rounded-md bg-brand-soft p-3 text-sm text-brand-strong">{message}</p>}<div className="flex flex-wrap gap-2 pt-2"><button className={primaryButton} type="submit">Save changes</button><Link href="/login" className={secondaryButton}>Sign out</Link></div></form>
    </div>
  </>;
}
