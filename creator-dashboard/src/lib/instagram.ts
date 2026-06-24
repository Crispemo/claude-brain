const BASE = "https://graph.instagram.com/v18.0";

export async function fetchIGInsights(token: string) {
  const res = await fetch(`${BASE}/me/insights?metric=impressions,reach,follower_count&period=day&access_token=${token}`);
  return res.json();
}

export async function fetchIGProfile(token: string) {
  const res = await fetch(`${BASE}/me?fields=id,username,followers_count,media_count&access_token=${token}`);
  return res.json();
}

export async function fetchIGMedia(token: string, limit = 25) {
  const res = await fetch(`${BASE}/me/media?fields=id,caption,timestamp,media_type,permalink,like_count,comments_count&limit=${limit}&access_token=${token}`);
  return res.json();
}

export async function fetchIGMediaInsights(token: string, mediaId: string) {
  const res = await fetch(`${BASE}/${mediaId}/insights?metric=impressions,reach,saved,shares&access_token=${token}`);
  return res.json();
}
