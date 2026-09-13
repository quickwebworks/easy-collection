import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const packageSchema = z.object({
  name: z.string().trim().min(1, "Package name is required."),
  description: z.string().trim().optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  validity_days: z.coerce.number().int().positive("Validity must be greater than zero."),
  discount_percentage: z.coerce.number().min(0).max(100),
  billing_period: z.enum(["MONTHLY", "YEARLY"]),
  is_active: z.boolean().default(true),
});

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("platform_role, is_active").eq("id", user.id).single();
  return profile?.platform_role === "SUPER_ADMIN" && profile.is_active ? supabase : null;
}

export async function POST(request: Request) {
  const supabase = await requireSuperAdmin();
  if (!supabase) return NextResponse.json({ error: "Super Admin authorization required." }, { status: 403 });
  const parsed = packageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid package details." }, { status: 400 });
  const { data, error } = await supabase.from("packages").insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ package: data }, { status: 201 });
}