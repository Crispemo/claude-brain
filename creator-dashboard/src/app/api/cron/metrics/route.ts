import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // --- Instagram ---
  const igToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  let igViews = 0, igLikes = 0, igComments = 0, igSaves = 0, igShares = 0;
  let igReach = 0, igImpressions = 0, igFollowersTotal = 0;

  if (igToken) {
    try {
      const { fetchIGProfile, fetchIGMedia, fetchIGMediaInsights } = await import("@/lib/instagram");

      const profile = await fetchIGProfile(igToken);
      igFollowersTotal = profile.followers_count || 0;

      const media = await fetchIGMedia(igToken, 25);
      if (media.data) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        for (const item of media.data) {
          const publishedAt = new Date(item.timestamp);
          igLikes += item.like_count || 0;
          igComments += item.comments_count || 0;

          // Get detailed insights per post
          try {
            const insights = await fetchIGMediaInsights(igToken, item.id);
            if (insights.data) {
              for (const metric of insights.data) {
                if (metric.name === "impressions") igImpressions += metric.values?.[0]?.value || 0;
                if (metric.name === "reach") igReach += metric.values?.[0]?.value || 0;
                if (metric.name === "saved") igSaves += metric.values?.[0]?.value || 0;
                if (metric.name === "shares") igShares += metric.values?.[0]?.value || 0;
              }
            }
          } catch {
            // Some media types don't support insights
          }

          // Count views as impressions or fallback to likes * 10 estimate
          if (publishedAt > sevenDaysAgo) {
            igViews += igImpressions > 0 ? 0 : (item.like_count || 0);
          }

          // Upsert individual reel metrics
          await supabase.from("reel_metrics").upsert({
            platform: "instagram",
            platform_id: item.id,
            url: item.permalink || "",
            hook_text: (item.caption || "").slice(0, 100),
            views: item.like_count || 0,
            likes: item.like_count || 0,
            comments: item.comments_count || 0,
            published_at: item.timestamp,
          }, { onConflict: "platform_id" });
        }

        if (igImpressions > 0) igViews = igImpressions;
      }
    } catch (e) {
      console.error("IG sync error:", e);
    }
  }

  const igEngagement = igViews > 0
    ? ((igLikes + igComments + igSaves) / igViews) * 100
    : 0;

  await supabase.from("metrics_snapshots").upsert({
    date: today,
    platform: "instagram",
    views: igViews,
    saves: igSaves,
    followers_new: 0,
    followers_total: igFollowersTotal,
    dms: 0,
    comments: igComments,
    likes: igLikes,
    shares: igShares,
    reach: igReach,
    impressions: igImpressions,
    engagement_rate: Math.round(igEngagement * 100) / 100,
  }, { onConflict: "date,platform" });

  // --- YouTube ---
  const ytKey = process.env.YOUTUBE_API_KEY;
  const ytChannel = process.env.YOUTUBE_CHANNEL_ID;
  let ytViews = 0, ytSubs = 0;

  if (ytKey && ytChannel) {
    try {
      const { fetchYTChannelStats } = await import("@/lib/youtube");
      const stats = await fetchYTChannelStats(ytKey, ytChannel);

      if (stats.items?.[0]?.statistics) {
        const s = stats.items[0].statistics;
        ytSubs = parseInt(s.subscriberCount || "0");
        ytViews = parseInt(s.viewCount || "0");
      }
    } catch (e) {
      console.error("YT sync error:", e);
    }
  }

  await supabase.from("metrics_snapshots").upsert({
    date: today,
    platform: "youtube",
    views: ytViews,
    saves: 0,
    followers_new: 0,
    followers_total: ytSubs,
    dms: 0,
    comments: 0,
    likes: 0,
    shares: 0,
    reach: 0,
    impressions: 0,
    engagement_rate: 0,
  }, { onConflict: "date,platform" });

  return NextResponse.json({ ok: true, date: today, ig: { views: igViews, followers: igFollowersTotal }, yt: { subs: ytSubs, views: ytViews } });
}
