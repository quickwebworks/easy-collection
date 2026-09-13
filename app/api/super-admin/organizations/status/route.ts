import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const statusRequest = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(["ACTIVE", "BLOCKED", "SUSPENDED"]),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Super Admin authorization required." }, { status: 403 });

  const { data: profile } = await supabase.from("profiles").select("platform_role, is_active").eq("id", user.id).single();
  if (profile?.platform_role !== "SUPER_ADMIN" || !profile.is_active) return NextResponse.json({ error: "Super Admin authorization required." }, { status: 403 });

  const parsed = statusRequest.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A valid organization and status are required." }, { status: 400 });

  const { organizationId, status } = parsed.data;
  const { data: organization, error } = await supabase
    .from("organizations")
    .update({ status, is_active: status === "ACTIVE" })
    .eq("id", organizationId)
    .select("id, status")
    .single();

  if (error || !organization) return NextResponse.json({ error: error?.message ?? "Organization not found." }, { status: 400 });
  return NextResponse.json({ organization });
}