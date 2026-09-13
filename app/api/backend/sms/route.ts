import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function requireBackendAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, authorized: false };
  const { data: profile } = await supabase.from("profiles").select("platform_role, is_active").eq("id", user.id).single();
  return { supabase, authorized: Boolean(profile?.is_active && ["SUPER_ADMIN", "BACKEND"].includes(profile.platform_role)) };
}

export async function GET() {
  const { supabase, authorized } = await requireBackendAccess();
  if (!authorized) return NextResponse.json({ error: "Backend authorization required." }, { status: 403 });

  const { data, error } = await supabase
    .from("sms_messages")
    .select("id, organization_id, channel, phone, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const { supabase, authorized } = await requireBackendAccess();
  if (!authorized) return NextResponse.json({ error: "Backend authorization required." }, { status: 403 });

  const body = await request.json() as { channel?: "sms" | "whatsapp"; phone?: string; message?: string; organizationId?: string };
  if (!body.phone || !body.message || !body.channel) return NextResponse.json({ error: "Phone, message, and channel are required." }, { status: 400 });
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    return NextResponse.json({ error: "Twilio SMS settings are missing. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER." }, { status: 503 });
  }

  const from = body.channel === "whatsapp" ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM ?? process.env.TWILIO_PHONE_NUMBER}` : process.env.TWILIO_PHONE_NUMBER;
  const to = body.channel === "whatsapp" ? `whatsapp:${body.phone}` : body.phone;
  const form = new URLSearchParams({ To: to, From: from, Body: body.message });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const result = await response.json() as { sid?: string; message?: string };
  if (!response.ok) return NextResponse.json({ error: result.message ?? "Message provider rejected the request." }, { status: 502 });

  const { error: logError } = await supabase.from("sms_messages").insert({ organization_id: body.organizationId ?? null, channel: body.channel, phone: body.phone, message: body.message, provider_message_id: result.sid, status: "SENT" });
  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 });
  return NextResponse.json({ status: "SENT", providerMessageId: result.sid });
}