import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const themes = ["light", "dark", "system"] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ theme: "system" });

  const { data } = await supabase
    .from("user_preferences")
    .select("theme")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ theme: data?.theme ?? "system" });
}

export async function PATCH(request: Request) {
  const body = await request.json() as { theme?: string };
  if (!body.theme || !themes.includes(body.theme as (typeof themes)[number])) {
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    theme: body.theme,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ theme: body.theme });
}