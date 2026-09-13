import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { queueOrganizationWhatsApp } from "@/lib/organization-messaging";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Super Admin authorization required." }, { status: 403 });

  const { data: profile } = await supabase.from("profiles").select("platform_role, is_active").eq("id", user.id).single();
  if (profile?.platform_role !== "SUPER_ADMIN" || !profile.is_active) return NextResponse.json({ error: "Super Admin authorization required." }, { status: 403 });

  const body = await request.json() as { organizationId?: string };
  if (!body.organizationId) return NextResponse.json({ error: "Organization ID is required." }, { status: 400 });

  const { data: organization, error } = await supabase.from("organizations").select("id, name, legal_name, contact_email, phone, address, city, state, country, pincode, status").eq("id", body.organizationId).single();
  if (error || !organization) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  if (!organization.phone) return NextResponse.json({ error: "This organization has no phone number." }, { status: 400 });

  const result = await queueOrganizationWhatsApp({
    supabase,
    organizationId: organization.id,
    phone: organization.phone,
    organization,
  });
  if (result.status === "failed") return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ status: result.status });
}