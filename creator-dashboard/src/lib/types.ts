export type HookType = "pregunta" | "contraste" | "cta" | "historia" | "shock" | "afirmacion";
export type Platform = "instagram" | "youtube" | "tiktok";
export type ScriptStatus = "draft" | "approved" | "scheduled" | "published";
export type CalendarStatus = "draft" | "video_pending" | "scheduled" | "published";
export type TrendCategory = "gancho" | "explicativo" | "ignorar";

export interface Hook {
  id: string;
  text: string;
  type: HookType;
  source: string;
  source_url: string | null;
  views: number;
  saves: number;
  engagement_rate: number;
  transcription: string | null;
  screen_text: string | null;
  tags: string[];
  used_count: number;
  created_at: string;
}

export interface Script {
  id: string;
  session_id: string | null;
  hook_id: string | null;
  trend_id: string | null;
  trial_source_id: string | null;
  day_of_week: number;
  time_slot: string;
  style: string;
  platform: string[];
  hook_text: string;
  problem_text: string;
  solution_text: string;
  social_proof_text: string;
  cta_text: string;
  status: ScriptStatus;
  is_trial_reel: boolean;
  trial_variation_notes: string | null;
  scheduled_date: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetricsSnapshot {
  id: string;
  date: string;
  platform: Platform;
  views: number;
  saves: number;
  followers_new: number;
  followers_total: number;
  dms: number;
  comments: number;
  likes: number;
  shares: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
  created_at: string;
}

export interface ReelMetric {
  id: string;
  script_id: string | null;
  platform: Platform;
  platform_id: string;
  url: string;
  hook_text: string;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  engagement_rate: number;
  is_bombazo: boolean;
  bombazo_multiplier: number | null;
  is_organic: boolean;
  published_at: string;
  metrics_updated_at: string;
  created_at: string;
}

export interface Competitor {
  id: string;
  handle: string;
  platform: Platform;
  followers: number;
  is_active: boolean;
  created_at: string;
}

export interface CompetitorReel {
  id: string;
  competitor_id: string;
  platform_id: string;
  url: string;
  hook_text: string | null;
  screen_text: string | null;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  engagement_rate: number;
  transcription: string | null;
  scraped_at: string;
  competitor?: Competitor;
}

export interface Trend {
  id: string;
  title: string;
  source: string;
  source_url: string;
  category: TrendCategory;
  suggested_angle: string | null;
  published_at: string;
  scanned_at: string;
}

export interface CalendarEntry {
  id: string;
  script_id: string | null;
  reel_metric_id: string | null;
  date: string;
  time_slot: string;
  platform: string[];
  style: string;
  hook_preview: string;
  status: CalendarStatus;
  video_url: string | null;
  published_url: string | null;
  created_at: string;
  updated_at: string;
  script?: Script;
  reel_metric?: ReelMetric;
}

export interface SimuliaMetric {
  id: string;
  month: string;
  revenue: number;
  new_users: number;
  total_users: number;
  created_at: string;
}

export interface SykSession {
  id: string;
  step: number;
  profile_data: Record<string, unknown> | null;
  bio_result: string | null;
  feed_calendar: Record<string, unknown> | null;
  stories_calendar: Record<string, unknown> | null;
  scripts_generated: number;
  completed_at: string | null;
  created_at: string;
}
