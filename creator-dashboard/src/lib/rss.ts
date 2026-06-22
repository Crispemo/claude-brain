import Parser from "rss-parser";

const parser = new Parser();

const FEEDS: Record<string, string> = {
  "Anthropic Blog": "https://www.anthropic.com/rss.xml",
  "OpenAI Blog": "https://openai.com/blog/rss.xml",
  "Shopify Blog": "https://www.shopify.com/blog/feed",
  "Hacker News": "https://hnrss.org/frontpage",
  "Product Hunt": "https://www.producthunt.com/feed",
  "TechCrunch": "https://techcrunch.com/feed/",
  "The Verge": "https://www.theverge.com/rss/index.xml",
};

export async function fetchAllFeeds(): Promise<Array<{ title: string; source: string; url: string; published: string }>> {
  const results: Array<{ title: string; source: string; url: string; published: string }> = [];

  for (const [source, feedUrl] of Object.entries(FEEDS)) {
    try {
      const feed = await parser.parseURL(feedUrl);
      for (const item of feed.items.slice(0, 5)) {
        if (item.title && item.link) {
          results.push({ title: item.title, source, url: item.link, published: item.isoDate || new Date().toISOString() });
        }
      }
    } catch { /* skip failed feeds */ }
  }

  return results;
}
