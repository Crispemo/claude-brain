CREATE TYPE hook_type AS ENUM ('pregunta', 'contraste', 'cta', 'historia', 'shock', 'afirmacion');
CREATE TYPE platform_enum AS ENUM ('instagram', 'youtube', 'tiktok');
CREATE TYPE script_status AS ENUM ('draft', 'approved', 'scheduled', 'published');
CREATE TYPE calendar_status AS ENUM ('draft', 'video_pending', 'scheduled', 'published');
CREATE TYPE trend_category AS ENUM ('gancho', 'explicativo', 'ignorar');

CREATE TABLE hooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  type hook_type NOT NULL,
  source text NOT NULL DEFAULT 'propio',
  source_url text,
  views integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  engagement_rate decimal NOT NULL DEFAULT 0,
  transcription text,
  screen_text text,
  tags text[] NOT NULL DEFAULT '{}',
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE syk_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step integer NOT NULL DEFAULT 1,
  profile_data jsonb,
  bio_result text,
  feed_calendar jsonb,
  stories_calendar jsonb,
  scripts_generated integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source text NOT NULL,
  source_url text NOT NULL,
  category trend_category NOT NULL,
  suggested_angle text,
  published_at timestamptz NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES syk_sessions(id) ON DELETE SET NULL,
  hook_id uuid REFERENCES hooks(id) ON DELETE SET NULL,
  trend_id uuid REFERENCES trends(id) ON DELETE SET NULL,
  trial_source_id uuid REFERENCES scripts(id) ON DELETE SET NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_slot time NOT NULL,
  style text NOT NULL,
  platform text[] NOT NULL DEFAULT '{ig}',
  hook_text text NOT NULL,
  problem_text text NOT NULL,
  solution_text text NOT NULL,
  social_proof_text text NOT NULL,
  cta_text text NOT NULL,
  status script_status NOT NULL DEFAULT 'draft',
  is_trial_reel boolean NOT NULL DEFAULT false,
  trial_variation_notes text,
  scheduled_date date,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE metrics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  platform platform_enum NOT NULL,
  views integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  followers_new integer NOT NULL DEFAULT 0,
  followers_total integer NOT NULL DEFAULT 0,
  dms integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  reach integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  engagement_rate decimal NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(date, platform)
);

CREATE TABLE reel_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid REFERENCES scripts(id) ON DELETE SET NULL,
  platform platform_enum NOT NULL,
  platform_id text NOT NULL,
  url text NOT NULL,
  hook_text text NOT NULL,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  engagement_rate decimal NOT NULL DEFAULT 0,
  is_bombazo boolean NOT NULL DEFAULT false,
  bombazo_multiplier decimal,
  is_organic boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL,
  metrics_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE calendar_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid REFERENCES scripts(id) ON DELETE SET NULL,
  reel_metric_id uuid REFERENCES reel_metrics(id) ON DELETE SET NULL,
  date date NOT NULL,
  time_slot time NOT NULL,
  platform text[] NOT NULL DEFAULT '{ig}',
  style text NOT NULL,
  hook_preview text NOT NULL,
  status calendar_status NOT NULL DEFAULT 'draft',
  video_url text,
  published_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle text NOT NULL UNIQUE,
  platform platform_enum NOT NULL DEFAULT 'instagram',
  followers integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE competitor_reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  platform_id text NOT NULL,
  url text NOT NULL,
  hook_text text,
  screen_text text,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  engagement_rate decimal NOT NULL DEFAULT 0,
  transcription text,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(competitor_id, platform_id)
);

CREATE TABLE simulia_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  revenue decimal NOT NULL DEFAULT 0,
  new_users integer NOT NULL DEFAULT 0,
  total_users integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hooks_type ON hooks(type);
CREATE INDEX idx_hooks_source ON hooks(source);
CREATE INDEX idx_scripts_status ON scripts(status);
CREATE INDEX idx_scripts_scheduled_date ON scripts(scheduled_date);
CREATE INDEX idx_calendar_date ON calendar_entries(date);
CREATE INDEX idx_calendar_status ON calendar_entries(status);
CREATE INDEX idx_metrics_date_platform ON metrics_snapshots(date, platform);
CREATE INDEX idx_reel_metrics_published ON reel_metrics(published_at);
CREATE INDEX idx_reel_metrics_bombazo ON reel_metrics(is_bombazo) WHERE is_bombazo = true;
CREATE INDEX idx_trends_category ON trends(category);
CREATE INDEX idx_trends_scanned ON trends(scanned_at);
CREATE INDEX idx_competitor_reels_scraped ON competitor_reels(scraped_at);
