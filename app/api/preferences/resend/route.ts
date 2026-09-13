import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ configured: false, authorized: false }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("platform_role, is_active").eq("id", user.id).single();
  if (profile?.platform_role !== "SUPER_ADMIN" || !profile.is_active) return NextResponse.json({ configured: false, authorized: false }, { status: 403 });

  return NextResponse.json({
    authorized: true,
    configured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM),
    from: process.env.RESEND_FROM ?? null,
    provider: "Resend",
  });
}