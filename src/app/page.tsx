import { createClient } from "@/lib/supabase/server";
import { redirectByRole } from "@/lib/auth/redirect-by-role";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await redirectByRole();

  return null;
}