import { createClient } from "@/lib/supabase/server";
import { sendOrganizationWelcomeEmail } from "@/lib/organization-email";
import { queueOrganizationWhatsApp } from "@/lib/organization-messaging";
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const optionalText = z.string().trim().optional().or(z.literal(""));
const organizationSchema = z.object({
  name: z.string().trim().min(1, "Organization Name is required."),
  legal_name: optionalText,
  contact_email: z.string().trim().email("A login email is required."),
  phone: z.string().trim().min(7, "A phone number is required for WhatsApp login details."),
  address: optionalText,
  city: optionalText,
  state: optionalText,
  country: optionalText,
  pincode: optionalText,
  status: z.enum(["ACTIVE", "BLOCKED", "SUSPENDED", "CANCELLED"]).default("ACTIVE"),
  slug: optionalText,
});

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role, is_active")
    .eq("id", user.id)
    .single();

  return profile?.platform_role === "SUPER_ADMIN" && profile.is_active
    ? { supabase, user }
    : { supabase, user: null };
}

export async function POST(request: Request) {
  const { supabase, user } = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Super Admin authorization required." }, { status: 403 });

  const parsed = organizationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid organization details." }, { status: 400 });
  const body = parsed.data;

  const { data: organization, error } = await supabase
    .from("organizations")
    .insert({
      name: body.name,
      slug: body.slug,
      legal_name: body.legal_name || null,
      contact_email: body.contact_email || null,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      country: body.country || null,
      pincode: body.pincode || null,
      status: body.status || "ACTIVE",
      is_active: body.status === "ACTIVE",
    })
    .select()
    .single();

  if (error || !organization) {
    return NextResponse.json({ error: error?.message ?? "Unable to create organization." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await supabase.from("organizations").delete().eq("id", organization.id);
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to create the organization admin login." }, { status: 503 });
  }
  const temporaryPassword = `EC-${randomBytes(9).toString("base64url")}!`;
  const adminClient = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({ email: organization.contact_email, password: temporaryPassword, email_confirm: true });
  if (authError || !authData.user) {
    await supabase.from("organizations").delete().eq("id", organization.id);
    return NextResponse.json({ error: authError?.message ?? "Unable to create organization admin login." }, { status: 400 });
  }
  const { error: profileError } = await adminClient.from("profiles").insert({ id: authData.user.id, email: organization.contact_email, phone: organization.phone, full_name: organization.legal_name || organization.name, platform_role: "CLIENT", is_active: true });
  const { error: membershipError } = profileError ? { error: profileError } : await adminClient.from("organization_members").insert({ user_id: authData.user.id, organization_id: organization.id, role: "CLIENT", is_active: true });
  if (profileError || membershipError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    await supabase.from("organizations").delete().eq("id", organization.id);
    return NextResponse.json({ error: profileError?.message ?? membershipError?.message ?? "Unable to assign organization admin." }, { status: 400 });
  }
  const loginDetails = { email: organization.contact_email, password: temporaryPassword };

  let emailStatus = "not_requested";
  if (organization.contact_email) {
    emailStatus = (await sendOrganizationWelcomeEmail({
      email: organization.contact_email,
      organization,
      loginDetails,
    })).status;
  }

  let whatsappStatus = "not_requested";
  if (organization.phone) {
    whatsappStatus = (await queueOrganizationWhatsApp({
      supabase,
      organizationId: organization.id,
      phone: organization.phone,
      organization,
      loginDetails,
    })).status;
  }

  return NextResponse.json({ organization, adminUserId: authData.user.id, emailStatus, whatsappStatus }, { status: 201 });
}