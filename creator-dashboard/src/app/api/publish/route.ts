import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const { calendar_entry_id, platforms } = await request.json();

  const { error } = await supabase.from("calendar_entries").update({
    status: "scheduled",
    platform: platforms,
    updated_at: new Date().toISOString(),
  }).eq("id", calendar_entry_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: "Programado para publicación" });
}
