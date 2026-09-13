import SmsMaster from "@/components/sms-master";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/get-user-role";

export default async function SmsMasterPage() {
  const role = await getUserRole();
  if (role !== "BACKEND" && role !== "SUPER_ADMIN") redirect("/");
  return <SmsMaster />;
}