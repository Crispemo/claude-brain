import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const url = new URL(request.url);
  const range = parseInt(url.searchParams.get("range") || "7");
  const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: snapshots } = await supabase.from("metrics_snapshots").select("*").gte("date", since).order("date");

  const igSnapshots = (snapshots || []).filter((s) => s.platform === "instagram");
  const ytSnapshots = (snapshots || []).filter((s) => s.platform === "youtube");

  const sum = (arr: typeof igSnapshots, key: string) => arr.reduce((acc, s) => acc + (s[key as keyof typeof s] as number || 0), 0);
  const latest = (arr: typeof igSnapshots) => arr[arr.length - 1];

  return NextResponse.json({
    ig: {
      views: sum(igSnapshots, "views"),
      saves: sum(igSnapshots, "saves"),
      followers_new: sum(igSnapshots, "followers_new"),
      dms: sum(igSnapshots, "dms"),
      likes: sum(igSnapshots, "likes"),
      comments: sum(igSnapshots, "comments"),
      engagement_rate: latest(igSnapshots)?.engagement_rate || 0,
    },
    yt: {
      views: sum(ytSnapshots, "views"),
      followers_new: sum(ytSnapshots, "followers_new"),
      followers_total: latest(ytSnapshots)?.followers_total || 0,
    },
    snapshots: snapshots || [],
  });
}
