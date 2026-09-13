"use client";

import { Send, MessageCircle, Smartphone } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Message = { id: string; organization_id?: string | null; channel: string; phone: string; message: string; status: string; created_at: string };

export default function SmsMaster() {
  const [channel, setChannel] = useState<"sms" | "whatsapp">("sms");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<Message[]>([]);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function loadMessages() {
    const response = await fetch("/api/backend/sms");
    if (response.ok) setRows(await response.json());
  }
  useEffect(() => {
    let cancelled = false;
    fetch("/api/backend/sms")
      .then((response) => response.ok ? response.json() as Promise<Message[]> : [])
      .then((data) => {
        if (!cancelled) setRows(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendMessage(event: FormEvent) {
    event.preventDefault(); setSending(true); setStatus("");
    const response = await fetch("/api/backend/sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel, phone, message }) });
    const result = await response.json();
    setStatus(response.ok ? "Message sent successfully." : result.error ?? "Unable to send message.");
    if (response.ok) { setPhone(""); setMessage(""); await loadMessages(); }
    setSending(false);
  }

  function openWhatsApp(row: Message) {
    const digits = row.phone.replace(/\D/g, "").replace(/^0/, "");
    const number = digits.startsWith("91") ? digits : `91${digits}`;
    const editedMessage = window.prompt("WhatsApp message", row.message);
    if (editedMessage === null) return;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(editedMessage)}`, "_blank", "noopener,noreferrer");
  }

  return <div className="mx-auto max-w-6xl"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Backend</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">SMS Master</h1><p className="mt-2 text-sm text-muted-foreground">Send SMS or WhatsApp messages and review delivery history.</p></div><div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><form onSubmit={sendMessage} className="rounded-2xl border border-border/80 bg-card p-5"><div className="flex gap-2"><button type="button" onClick={() => setChannel("sms")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold ${channel === "sms" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><Smartphone size={17} /> SMS</button><button type="button" onClick={() => setChannel("whatsapp")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold ${channel === "whatsapp" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><MessageCircle size={17} /> WhatsApp</button></div><label className="mt-5 block text-sm font-semibold">Mobile number<input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+919876543210" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:border-primary" /></label><label className="mt-4 block text-sm font-semibold">Message<textarea required maxLength={1600} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type your message..." className="mt-2 min-h-32 w-full rounded-xl border border-input bg-background px-3 py-3 font-normal outline-none focus:border-primary" /></label>{status && <p className={`mt-4 rounded-xl p-3 text-sm ${status.includes("success") ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{status}</p>}<button disabled={sending} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"><Send size={17} />{sending ? "Sending..." : `Send ${channel === "sms" ? "SMS" : "WhatsApp"}`}</button></form><div className="rounded-2xl border border-border/80 bg-card"><div className="border-b border-border/80 p-5"><h2 className="font-bold">Message history</h2><p className="mt-1 text-xs text-muted-foreground">Messages sent from the backend panel.</p></div><div className="divide-y divide-border/70">{rows.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No messages sent yet.</p> : rows.map((row) => <div key={row.id} className="flex items-start justify-between gap-4 p-4"><div><p className="text-sm font-bold">{row.channel === "whatsapp" ? "WhatsApp" : "SMS"} · {row.phone}</p>{row.organization_id && <p className="mt-1 text-xs font-semibold text-primary">Organization linked</p>}<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.message}</p></div><div className="flex items-center gap-3"><span className="text-xs font-bold text-primary">{row.status}</span>{row.channel === "whatsapp" && <button type="button" title="Open WhatsApp" onClick={() => openWhatsApp(row)} className="rounded-lg p-2 text-primary hover:bg-primary/10"><MessageCircle size={17} /></button>}</div></div>)}</div></div></div></div>;
}