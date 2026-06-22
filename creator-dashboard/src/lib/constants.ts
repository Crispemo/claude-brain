export const HOOK_TYPES = [
  { value: "pregunta", label: "Pregunta", color: "bg-orange-100 text-orange-700" },
  { value: "contraste", label: "Contraste", color: "bg-yellow-100 text-yellow-700" },
  { value: "cta", label: "CTA", color: "bg-green-100 text-green-700" },
  { value: "historia", label: "Historia", color: "bg-terracota-bg-strong text-terracota" },
  { value: "shock", label: "Shock", color: "bg-red-100 text-red-700" },
  { value: "afirmacion", label: "Afirmación", color: "bg-blue-100 text-blue-700" },
] as const;

export const PLATFORMS = [
  { value: "ig", label: "IG", color: "bg-platform-ig/10 text-platform-ig" },
  { value: "yt", label: "YT", color: "bg-platform-yt/10 text-platform-yt" },
  { value: "tt", label: "TT", color: "bg-platform-tt/10 text-platform-tt" },
  { value: "shorts", label: "Shorts", color: "bg-platform-shorts/10 text-platform-shorts" },
] as const;

export const CALENDAR_STATUS_CONFIG = {
  published: { label: "Publicado", color: "bg-status-published", textColor: "text-status-published", icon: "✓" },
  scheduled: { label: "Programado", color: "bg-status-scheduled", textColor: "text-status-scheduled", icon: "◉" },
  video_pending: { label: "Pendiente vídeo", color: "bg-status-pending", textColor: "text-status-pending", icon: "!" },
  draft: { label: "Borrador", color: "bg-status-draft", textColor: "text-status-draft", icon: "○" },
} as const;

export const CONTENT_STYLES = [
  "POV celular",
  "Talking Head",
  "B-Roll voz off",
  "Clip cliente",
  "Reacción",
  "TikTok nativo",
  "Vlog",
  "Clip Podcast",
  "Explicativo iPad",
] as const;

export const TREND_SOURCES = [
  "Anthropic Blog",
  "OpenAI Blog",
  "Shopify Blog",
  "Google AI Blog",
  "X / Listas IA",
  "Hacker News",
  "Product Hunt",
  "TechCrunch",
  "The Verge",
  "Shopify Changelog",
  "Reddit r/ecommerce",
  "YouTube Trending",
] as const;

export const DAYS_OF_WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
