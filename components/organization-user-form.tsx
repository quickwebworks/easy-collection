"use client";

import { FormEvent, useState } from "react";

export default function OrganizationUserForm({ organizationId }: { organizationId: string }) {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", role: "MANAGER" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, organization_id: organizationId }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Unable to create user.");
    else { setMessage("User created successfully. They can now sign in."); setForm({ full_name: "", email: "", password: "", phone: "", role: "MANAGER" }); }
    setSaving(false);
  }

  return <form onSubmit={submit} className="mt-8 max-w-xl space-y-4 rounded-2xl border border-border/80 bg-card p-6"><h2 className="text-lg font-bold">Add organization user</h2>{(["full_name", "email", "password", "phone"] as const).map((field) => <label key={field} className="block text-sm font-semibold">{field === "full_name" ? "Full name" : field === "password" ? "Temporary password" : field[0].toUpperCase() + field.slice(1)}<input required={field !== "phone"} type={field === "password" ? "password" : field === "email" ? "email" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:border-primary" /></label>)}<label className="block text-sm font-semibold">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 font-normal"><option>MANAGER</option><option>FIELD_EXECUTIVE</option><option>BACKEND</option></select></label>{error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{message && <p className="rounded-xl bg-primary/10 p-3 text-sm text-primary">{message}</p>}<button disabled={saving} className="h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-60">{saving ? "Creating..." : "Create user"}</button></form>;
}