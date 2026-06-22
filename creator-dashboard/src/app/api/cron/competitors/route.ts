import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data: competitors } = await supabase.from("competitors").select("*").eq("is_active", true);

  if (!competitors || competitors.length === 0) {
    return NextResponse.json({ ok: true, message: "No active competitors" });
  }

  // Placeholder: actual IG scraping requires Business API access per competitor
  // For now, log the attempt
  return NextResponse.json({
    ok: true,
    competitors: competitors.length,
    message: "Competitor scraping requires Instagram Business API access. Configure in Settings.",
  });
}
