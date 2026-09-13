import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/get-user-role";

export default async function ManagerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getUserRole();

  if (role !== "MANAGER") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Manager Panel
        </h1>
        <p className="mt-2 text-slate-600">
          Welcome, {user.email}
        </p>
      </div>
    </main>
  );
}