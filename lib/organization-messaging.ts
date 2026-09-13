import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizationDetails } from "@/lib/organization-email";

export function organizationWelcomeMessage(organization: OrganizationDetails) {
  return [
    `Welcome to Easy Collection, ${organization.name}.`,
    `Legal Name: ${organization.legal_name || "Not provided"}`,
    `Email: ${organization.contact_email || "Not provided"}`,
    `Phone: ${organization.phone || "Not provided"}`,
    `Address: ${organization.address || "Not provided"}`,
    `Location: ${[organization.city, organization.state, organization.country].filter(Boolean).join(", ") || "Not provided"}`,
    `Pincode: ${organization.pincode || "Not provided"}`,
    `Status: ${organization.status}`,
    "Our team will share your onboarding details shortly.",
  ].join("\n");
}

function appendLoginDetails(message: string, loginDetails?: { email: string; password: string }) {
  return loginDetails ? `${message}\n\nLogin email: ${loginDetails.email}\nTemporary password: ${loginDetails.password}\nPlease change this password after first login.` : message;
}

export async function queueOrganizationWhatsApp({
  supabase,
  organizationId,
  phone,
  organization,
  loginDetails,
}: {
  supabase: SupabaseClient;
  organizationId: string;
  phone: string;
  organization: OrganizationDetails;
  loginDetails?: { email: string; password: string };
}) {
  const message = appendLoginDetails(organizationWelcomeMessage(organization), loginDetails);
  const { error } = await supabase.from("sms_messages").insert({
    organization_id: organizationId,
    channel: "whatsapp",
    phone,
    message,
    status: "READY",
  });
  return error ? { status: "failed" as const, error: error.message } : { status: "ready" as const };
}

export async function sendOrganizationWhatsApp({
  supabase,
  organizationId,
  phone,
  organization,
}: {
  supabase: SupabaseClient;
  organizationId: string;
  phone: string;
  organization: OrganizationDetails;
}) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    return { status: "not_configured" as const };
  }

  const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM ?? process.env.TWILIO_PHONE_NUMBER}`;
  const to = `whatsapp:${phone}`;
  const form = new URLSearchParams({
    To: to,
    From: from,
    Body: organizationWelcomeMessage(organization),
  });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const result = await response.json() as { sid?: string; message?: string };
  if (!response.ok) return { status: "failed" as const, error: result.message ?? "WhatsApp provider rejected the request." };

  const { error } = await supabase.from("sms_messages").insert({
    organization_id: organizationId,
    channel: "whatsapp",
    phone,
    message: form.get("Body"),
    provider_message_id: result.sid,
    status: "SENT",
  });
  if (error) return { status: "failed" as const, error: error.message };
  return { status: "sent" as const };
}