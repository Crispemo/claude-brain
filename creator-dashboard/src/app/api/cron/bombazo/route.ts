import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: reels } = await supabase.from("reel_metrics").select("id, views").gte("published_at", since).order("views");
  if (!reels || reels.length < 3) return NextResponse.json({ ok: true, message: "Not enough data" });

  const median = reels[Math.floor(reels.length / 2)].views;
  const threshold = median * 2;

  const { data: newBombazos } = await supabase.from("reel_metrics").select("id, views").gte("views", threshold).eq("is_bombazo", false);

  for (const reel of newBombazos || []) {
    await supabase.from("reel_metrics").update({ is_bombazo: true, bombazo_multiplier: reel.views / median, metrics_updated_at: new Date().toISOString() }).eq("id", reel.id);
  }

  return NextResponse.json({ ok: true, median, threshold, new_bombazos: newBombazos?.length || 0 });
}
