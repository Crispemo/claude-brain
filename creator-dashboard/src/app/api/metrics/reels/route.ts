import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const url = new URL(request.url);
  const bombazoOnly = url.searchParams.get("bombazo") === "true";

  let query = supabase.from("reel_metrics").select("*").order("views", { ascending: false }).limit(20);
  if (bombazoOnly) query = query.eq("is_bombazo", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
