import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/get-user-role";
import SuperAdminShell from "@/components/layout/super-admin-shell";

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const role = await getUserRole();

  if (role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return <SuperAdminShell>{children}</SuperAdminShell>;
}