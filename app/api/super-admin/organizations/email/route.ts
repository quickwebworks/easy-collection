import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationForEmail, sendOrganizationWelcomeEmail } from "@/lib/organization-email";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role, is_active")
    .eq("id", user.id)
    .single();

  return profile?.platform_role === "SUPER_ADMIN" && profile.is_active ? supabase : null;
}

export async function POST(request: Request) {
  const supabase = await requireSuperAdmin();
  if (!supabase) return NextResponse.json({ error: "Super Admin authorization required." }, { status: 403 });

  const body = await request.json() as { organizationId?: string };
  if (!body.organizationId) return NextResponse.json({ error: "Organization ID is required." }, { status: 400 });

  const { data: organization, error } = await getOrganizationForEmail(body.organizationId);
  if (error || !organization) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  if (!organization.contact_email) return NextResponse.json({ error: "This organization has no contact email." }, { status: 400 });

  const result = await sendOrganizationWelcomeEmail({
    email: organization.contact_email,
    organization,
  });

  if (result.status === "not_configured") return NextResponse.json({ error: "Email service is not configured." }, { status: 503 });
  if (result.status === "failed") return NextResponse.json({ error: "Unable to send the email." }, { status: 502 });
  return NextResponse.json({ status: result.status });
}