import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Super Admin authorization required." }, { status: 403 });
  const { data: profile } = await supabase.from("profiles").select("platform_role, is_active").eq("id", user.id).single();
  if (profile?.platform_role !== "SUPER_ADMIN" || !profile.is_active) return NextResponse.json({ error: "Super Admin authorization required." }, { status: 403 });
  const [{ data: organizations, error: organizationError }, { data: packages, error: packageError }] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("status", "ACTIVE").order("name"),
    supabase.from("packages").select("id, name, price, validity_days, discount_percentage").eq("is_active", true).order("name"),
  ]);
  if (organizationError || packageError) return NextResponse.json({ error: organizationError?.message ?? packageError?.message }, { status: 500 });
  return NextResponse.json({ organizations: organizations ?? [], packages: packages ?? [] });
}