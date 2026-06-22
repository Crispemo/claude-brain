const BASE = "https://www.googleapis.com/youtube/v3";

export async function fetchYTChannelStats(apiKey: string, channelId: string) {
  const res = await fetch(`${BASE}/channels?part=statistics&id=${channelId}&key=${apiKey}`);
  return res.json();
}

export async function fetchYTVideos(apiKey: string, channelId: string, maxResults = 25) {
  const searchRes = await fetch(`${BASE}/search?part=id&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}&key=${apiKey}`);
  const searchData = await searchRes.json();
  const ids = (searchData.items || []).map((i: { id: { videoId: string } }) => i.id.videoId).join(",");
  if (!ids) return { items: [] };
  const statsRes = await fetch(`${BASE}/videos?part=statistics,snippet&id=${ids}&key=${apiKey}`);
  return statsRes.json();
}
