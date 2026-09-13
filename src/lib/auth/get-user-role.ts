import { createClient } from "@/lib/supabase/server";

export type AppRole =
  | "SUPER_ADMIN"
  | "CLIENT"
  | "MANAGER"
  | "FIELD_EXECUTIVE"
  | "BACKEND";

export async function getUserRole(): Promise<AppRole | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // First check platform-level Super Admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("platform_role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Unable to load user profile:", profileError);
    return null;
  }

  if (!profile.is_active) {
    return null;
  }

  if (profile.platform_role === "SUPER_ADMIN") {
    return "SUPER_ADMIN";
  }

  // Normal organization role
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error("Unable to load user membership:", membershipError);
    return null;
  }

  if (!membership) {
    return null;
  }

  return membership.role as AppRole;
}