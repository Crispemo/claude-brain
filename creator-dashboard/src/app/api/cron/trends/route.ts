import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllFeeds } from "@/lib/rss";
import { classifyTrend } from "@/lib/claude";

export async function GET() {
  const supabase = createAdminClient();

  const feeds = await fetchAllFeeds();
  const { data: existing } = await supabase.from("trends").select("source_url");
  const existingUrls = new Set((existing || []).map((t) => t.source_url));

  const newItems = feeds.filter((f) => !existingUrls.has(f.url));
  let inserted = 0;

  for (const item of newItems.slice(0, 20)) {
    let category = "ignorar";
    let angle = "";
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const result = await classifyTrend(item.title, item.source);
        category = result.category;
        angle = result.angle;
      } catch { /* fallback to ignorar */ }
    }
    await supabase.from("trends").insert({ title: item.title, source: item.source, source_url: item.url, category, suggested_angle: angle, published_at: item.published });
    inserted++;
  }

  return NextResponse.json({ ok: true, scanned: feeds.length, new: inserted });
}
