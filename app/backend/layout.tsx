import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/get-user-role";
import { createClient } from "@/lib/supabase/server";
import SuperAdminShell from "@/components/super-admin-shell";

export default async function BackendLayout({ children }: { children: ReactNode }) {
  const role = await getUserRole();
  if (role !== "BACKEND" && role !== "SUPER_ADMIN") redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <SuperAdminShell email={user.email ?? "backend@example.com"}>{children}</SuperAdminShell>;
}
