import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-user-role";
import OrganizationUserForm from "@/components/organization-user-form";

export default async function OrganizationUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (await getUserRole()) !== "CLIENT") redirect("/");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).eq("role", "CLIENT").eq("is_active", true).single();
  if (!membership) redirect("/");
  return <main className="min-h-screen bg-background p-6"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Organization</p><h1 className="mt-2 text-3xl font-extrabold">Team Users</h1><p className="mt-2 text-sm text-muted-foreground">Create users for your organization.</p><OrganizationUserForm organizationId={membership.organization_id} /></div></main>;
}