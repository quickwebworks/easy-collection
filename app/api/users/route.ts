import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().trim().min(1),
  phone: z.string().trim().optional().or(z.literal("")),
  organization_id: z.string().uuid(),
  role: z.enum(["CLIENT", "MANAGER", "FIELD_EXECUTIVE", "BACKEND"]),
});

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("platform_role, is_active").eq("id", user.id).single();
  return profile?.platform_role === "SUPER_ADMIN" && profile.is_active ? supabase : null;
}

export async function GET() {
  const supabase = await requireSuperAdmin();
  if (!supabase) return NextResponse.json({ error: "Super Admin authorization required." }, { status: 403 });
  const [{ data: users, error: usersError }, { data: memberships }, { data: organizations, error: organizationsError }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone, platform_role, is_active, created_at").order("created_at", { ascending: false }),
    supabase.from("organization_members").select("user_id, organization_id"),
    supabase.from("organizations").select("id, name").order("name"),
  ]);
  if (usersError || organizationsError) return NextResponse.json({ error: usersError?.message ?? organizationsError?.message }, { status: 500 });
  const membershipByUser = new Map((memberships ?? []).map((membership) => [membership.user_id, membership.organization_id]));
  return NextResponse.json({ users: (users ?? []).map((user) => ({ ...user, organization_id: membershipByUser.get(user.id) ?? null })), organizations: organizations ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = createUserSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid user details." }, { status: 400 });
  const details = parsed.data;

  const { data: profile } = await supabase.from("profiles").select("platform_role").eq("id", user.id).single();
  const isSuperAdmin = profile?.platform_role === "SUPER_ADMIN";
  if (!isSuperAdmin) {
    const { data: membership } = await supabase.from("organization_members").select("organization_id, role").eq("user_id", user.id).eq("organization_id", details.organization_id).eq("role", "CLIENT").eq("is_active", true).single();
    if (!membership) return NextResponse.json({ error: "Only an organization administrator can create users for that organization." }, { status: 403 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for creating login users." }, { status: 503 });
  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: created, error: authError } = await admin.auth.admin.createUser({ email: details.email, password: details.password, email_confirm: true });
  if (authError || !created.user) return NextResponse.json({ error: authError?.message ?? "Unable to create login user." }, { status: 400 });

  const { error: profileError } = await admin.from("profiles").insert({ id: created.user.id, full_name: details.full_name, email: details.email, phone: details.phone || null, platform_role: details.role, is_active: true });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
  const { error: membershipError } = await admin.from("organization_members").insert({ user_id: created.user.id, organization_id: details.organization_id, role: details.role, is_active: true });
  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 400 });
  return NextResponse.json({ user: { id: created.user.id, email: details.email, organization_id: details.organization_id, role: details.role } }, { status: 201 });
}