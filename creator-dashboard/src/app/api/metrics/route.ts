import { NextRequest, NextResponse } from "next/server";
import { fetchIGProfile, fetchIGMedia, fetchIGMediaInsights } from "@/lib/instagram";
import { fetchYTChannelStats } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const range = parseInt(url.searchParams.get("range") || "7");
  const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

  const igToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const ytKey = process.env.YOUTUBE_API_KEY;
  const ytChannel = process.env.YOUTUBE_CHANNEL_ID;

  let ig = { views: 0, saves: 0, followers_new: 0, followers_total: 0, dms: 0, likes: 0, comments: 0, engagement_rate: 0 };
  let yt = { views: 0, followers_new: 0, followers_total: 0 };

  // --- Instagram live ---
  if (igToken) {
    try {
      const [profile, media] = await Promise.all([
        fetchIGProfile(igToken),
        fetchIGMedia(igToken, 50),
      ]);

      ig.followers_total = profile.followers_count || 0;

      if (media.data) {
        const recentPosts = media.data.filter((item: { timestamp: string }) => new Date(item.timestamp) > since);

        for (const item of recentPosts) {
          ig.likes += item.like_count || 0;
          ig.comments += item.comments_count || 0;

          try {
            const insights = await fetchIGMediaInsights(igToken, item.id);
            if (insights.data) {
              for (const m of insights.data) {
                if (m.name === "impressions") ig.views += m.values?.[0]?.value || 0;
                if (m.name === "saved") ig.saves += m.values?.[0]?.value || 0;
              }
            }
          } catch {
            // Some media types don't support insights
          }
        }

        if (ig.views === 0 && ig.likes > 0) {
          ig.views = ig.likes;
        }

        if (ig.views > 0) {
          ig.engagement_rate = Math.round(((ig.likes + ig.comments + ig.saves) / ig.views) * 10000) / 100;
        }
      }
    } catch (e) {
      console.error("IG fetch error:", e);
    }
  }

  // --- YouTube live ---
  if (ytKey && ytChannel) {
    try {
      const stats = await fetchYTChannelStats(ytKey, ytChannel);
      if (stats.items?.[0]?.statistics) {
        const s = stats.items[0].statistics;
        yt.followers_total = parseInt(s.subscriberCount || "0");
        yt.views = parseInt(s.viewCount || "0");
      }
    } catch (e) {
      console.error("YT fetch error:", e);
    }
  }

  return NextResponse.json({ ig, yt, snapshots: [] });
}
