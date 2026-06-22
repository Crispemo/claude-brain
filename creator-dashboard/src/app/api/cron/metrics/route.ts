import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // IG metrics sync
  if (process.env.INSTAGRAM_ACCESS_TOKEN) {
    try {
      const { fetchIGMedia } = await import("@/lib/instagram");
      const media = await fetchIGMedia(process.env.INSTAGRAM_ACCESS_TOKEN);
      if (media.data) {
        for (const item of media.data.slice(0, 10)) {
          await supabase.from("reel_metrics").upsert({
            platform: "instagram",
            platform_id: item.id,
            url: item.permalink || "",
            hook_text: (item.caption || "").slice(0, 100),
            views: item.like_count || 0,
            likes: item.like_count || 0,
            comments: item.comments_count || 0,
            published_at: item.timestamp,
          }, { onConflict: "platform_id" }).select();
        }
      }
    } catch (e) { console.error("IG sync error:", e); }
  }

  await supabase.from("metrics_snapshots").upsert({ date: today, platform: "instagram", views: 0, saves: 0, followers_new: 0, followers_total: 0, dms: 0, comments: 0, likes: 0, shares: 0, reach: 0, impressions: 0, engagement_rate: 0 }, { onConflict: "date,platform" });

  return NextResponse.json({ ok: true, date: today });
}
