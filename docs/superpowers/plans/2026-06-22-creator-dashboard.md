# Creator Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a creator content dashboard (Next.js + Supabase) that replaces the existing HTML dashboard, with 8 sections for content management (hooks, metrics, calendar, competitors, community manager, trends, content engine) plus Simulia metrics, deployed to Vercel.

**Architecture:** Next.js 14 App Router monolith with Supabase PostgreSQL backend. Sidebar shell with 10 route pages. API routes for CRUD, Claude AI analysis, and 4 Vercel cron jobs (metrics sync, competitor scraping, trends scanning, bombazo detection). Simple password auth via middleware.

**Tech Stack:** Next.js 14+, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + Storage), Recharts, Claude API (Anthropic SDK), OpenAI Whisper API, Instagram Graph API, YouTube Data API v3, Vercel (deploy + cron).

**Spec:** `docs/superpowers/specs/2026-06-22-creator-dashboard-design.md`

---

## File Map

```
creator-dashboard/
├── src/
│   ├── app/
│   │   ├── globals.css                  # Tailwind + custom theme tokens
│   │   ├── layout.tsx                   # Root layout: sidebar + main area + mobile bottom nav
│   │   ├── page.tsx                     # Overview: KPIs, widgets, quick actions
│   │   ├── login/page.tsx               # Login page (password only)
│   │   ├── hooks/
│   │   │   └── page.tsx                 # Baúl de Ganchos: grid + filters + search
│   │   ├── metrics/
│   │   │   └── page.tsx                 # Métricas: KPIs, charts, bombazos
│   │   ├── competitors/
│   │   │   └── page.tsx                 # Rastreador: ranking table + detail panel
│   │   ├── community/
│   │   │   └── page.tsx                 # Community Manager: composer + queue
│   │   ├── calendar/
│   │   │   └── page.tsx                 # Calendario: monthly grid + side panel
│   │   ├── trends/
│   │   │   └── page.tsx                 # Tendencias: list + filters + sources
│   │   ├── engine/
│   │   │   └── page.tsx                 # Content Engine: 5-step wizard
│   │   ├── simulia/
│   │   │   └── page.tsx                 # Simulia: revenue + users + history
│   │   ├── settings/
│   │   │   └── page.tsx                 # Settings: API keys, profile, competitor accounts
│   │   └── api/
│   │       ├── auth/route.ts            # POST login, DELETE logout
│   │       ├── hooks/route.ts           # GET list, POST create
│   │       ├── hooks/[id]/route.ts      # PATCH update, DELETE remove
│   │       ├── scripts/route.ts         # GET list, POST create
│   │       ├── scripts/[id]/route.ts    # PATCH update, DELETE remove
│   │       ├── calendar/route.ts        # GET entries, POST create
│   │       ├── calendar/[id]/route.ts   # PATCH update status/date
│   │       ├── competitors/route.ts     # GET list, POST add account
│   │       ├── competitors/reels/route.ts # GET scraped reels
│   │       ├── trends/route.ts          # GET list
│   │       ├── analyze/route.ts         # POST: Claude analysis of a hook
│   │       ├── engine/route.ts          # POST: generate content (bio, calendar, scripts)
│   │       ├── publish/route.ts         # POST: publish to IG/YT
│   │       ├── publish/describe/route.ts # POST: generate descriptions via Claude
│   │       ├── simulia/route.ts         # GET/POST simulia metrics
│   │       └── cron/
│   │           ├── metrics/route.ts     # Daily 2am: sync IG+YT metrics
│   │           ├── competitors/route.ts # Sunday 6am: scrape competitor reels
│   │           ├── trends/route.ts      # Daily 7am: scan RSS sources
│   │           └── bombazo/route.ts     # Daily 3am: detect bombazo reels
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components (auto-generated)
│   │   ├── sidebar.tsx                  # Desktop sidebar + mobile bottom nav
│   │   ├── kpi-card.tsx                 # KPI card with sparkline + % change
│   │   ├── sparkline.tsx                # Mini sparkline chart (Recharts)
│   │   ├── hook-card.tsx                # Hook card for Baúl grid
│   │   ├── hook-filters.tsx             # Source pills + type pills + sort + search
│   │   ├── calendar-grid.tsx            # Monthly calendar grid component
│   │   ├── calendar-day-cell.tsx        # Single day cell with status colorimetry
│   │   ├── calendar-side-panel.tsx      # Slide-out panel for script detail + metrics
│   │   ├── script-viewer.tsx            # Displays a script (hook/problem/solution/proof/cta)
│   │   ├── script-editor.tsx            # Editable script form
│   │   ├── trend-item.tsx               # Single trend row with category badge
│   │   ├── competitor-table.tsx         # Sortable ranking table
│   │   ├── competitor-detail.tsx        # Expanded reel detail panel
│   │   ├── publish-composer.tsx         # Video upload + platform select + schedule
│   │   ├── description-preview.tsx      # Auto-generated descriptions per platform
│   │   ├── publish-queue.tsx            # Queue list with status badges
│   │   ├── engine-wizard.tsx            # 5-step wizard shell
│   │   ├── engine-step-profile.tsx      # Step 1: profile questions form
│   │   ├── engine-step-bio.tsx          # Step 2: bio audit + rewrite
│   │   ├── engine-step-feed.tsx         # Step 3: feed calendar generation
│   │   ├── engine-step-stories.tsx      # Step 4: stories calendar
│   │   ├── engine-step-scripts.tsx      # Step 5: 42 scripts generation
│   │   ├── bombazo-card.tsx             # Bombazo reel card with multiplier
│   │   ├── metrics-chart-reach.tsx      # Recharts bar chart for reach
│   │   ├── metrics-chart-engagement.tsx # Recharts donut chart for engagement
│   │   ├── status-badge.tsx             # Colored status indicator (published/scheduled/pending/draft)
│   │   └── platform-badge.tsx           # Platform color badge (IG/YT/TT)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Server-side Supabase client
│   │   │   └── admin.ts                # Service role client for cron jobs
│   │   ├── instagram.ts                # IG Graph API: fetch metrics, reels, publish
│   │   ├── youtube.ts                  # YT Data API: fetch metrics, upload
│   │   ├── claude.ts                   # Anthropic SDK: analyze, generate scripts, classify
│   │   ├── whisper.ts                  # OpenAI Whisper: transcribe audio
│   │   ├── rss.ts                      # RSS feed parser for trends sources
│   │   ├── auth.ts                     # Password check + cookie helpers
│   │   ├── constants.ts                # Hook types, platforms, trend sources, colors
│   │   └── types.ts                    # TypeScript types matching DB schema
│   └── middleware.ts                    # Auth check: redirect to /login if no session
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # All tables from spec
├── public/
│   └── favicon.png
├── vercel.json                          # Cron schedule config
├── tailwind.config.ts                   # Custom colors (terracota, etc.)
├── .env.local.example                   # Template for env vars
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Phase 1: Foundation

### Task 1: Scaffold Next.js project with Tailwind + shadcn/ui

**Files:**
- Create: `creator-dashboard/` (entire scaffold)
- Create: `creator-dashboard/tailwind.config.ts`
- Create: `creator-dashboard/.env.local.example`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/cris/Documents/AGENCIA/PROYECTOS/claude-brain
npx create-next-app@latest creator-dashboard --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffold created at `creator-dashboard/`.

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/cris/Documents/AGENCIA/PROYECTOS/claude-brain/creator-dashboard
npm install @supabase/supabase-js @supabase/ssr recharts @anthropic-ai/sdk openai rss-parser date-fns
npm install -D supabase
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
cd /Users/cris/Documents/AGENCIA/PROYECTOS/claude-brain/creator-dashboard
npx shadcn@latest init
```

Choose: New York style, Slate base color, CSS variables: yes.

Then add needed components:

```bash
npx shadcn@latest add button card input badge tabs dialog sheet dropdown-menu select textarea separator tooltip scroll-area
```

- [ ] **Step 4: Configure custom theme colors in tailwind.config.ts**

```ts
// creator-dashboard/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f5f5f0",
        surface: "#ffffff",
        border: "#e5e5e0",
        "border-light": "#f0f0eb",
        foreground: "#1a1a1a",
        muted: "#999999",
        terracota: {
          DEFAULT: "#c4704b",
          light: "#e8a882",
          bg: "rgba(196, 112, 75, 0.08)",
          "bg-strong": "rgba(196, 112, 75, 0.15)",
        },
        simulia: "#7da0a7",
        platform: {
          ig: "#c4704b",
          yt: "#ef4444",
          tt: "#1a1a1a",
          shorts: "#a855f7",
        },
        status: {
          published: "#22c55e",
          scheduled: "#eab308",
          pending: "#ef4444",
          draft: "#999999",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

- [ ] **Step 5: Set global styles in globals.css**

```css
/* creator-dashboard/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f5f5f0;
  color: #1a1a1a;
}
```

- [ ] **Step 6: Create .env.local.example**

```bash
# creator-dashboard/.env.local.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DASHBOARD_PASSWORD=

INSTAGRAM_ACCESS_TOKEN=
YOUTUBE_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

CRON_SECRET=
```

- [ ] **Step 7: Run dev server to verify scaffold works**

```bash
cd /Users/cris/Documents/AGENCIA/PROYECTOS/claude-brain/creator-dashboard
npm run dev
```

Open http://localhost:3000 — should show Next.js default page with custom background #f5f5f0.

- [ ] **Step 8: Commit**

```bash
git add creator-dashboard/
git commit -m "feat: scaffold creator-dashboard with Next.js + Tailwind + shadcn/ui"
```

---

### Task 2: Supabase schema + TypeScript types

**Files:**
- Create: `creator-dashboard/supabase/migrations/001_initial_schema.sql`
- Create: `creator-dashboard/src/lib/types.ts`
- Create: `creator-dashboard/src/lib/constants.ts`
- Create: `creator-dashboard/src/lib/supabase/client.ts`
- Create: `creator-dashboard/src/lib/supabase/server.ts`
- Create: `creator-dashboard/src/lib/supabase/admin.ts`

- [ ] **Step 1: Write the full migration SQL**

```sql
-- creator-dashboard/supabase/migrations/001_initial_schema.sql

-- Enums
CREATE TYPE hook_type AS ENUM ('pregunta', 'contraste', 'cta', 'historia', 'shock', 'afirmacion');
CREATE TYPE platform_enum AS ENUM ('instagram', 'youtube', 'tiktok');
CREATE TYPE script_status AS ENUM ('draft', 'approved', 'scheduled', 'published');
CREATE TYPE calendar_status AS ENUM ('draft', 'video_pending', 'scheduled', 'published');
CREATE TYPE trend_category AS ENUM ('gancho', 'explicativo', 'ignorar');

-- Hooks (Baúl de Ganchos)
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

-- SYK Sessions (Content Engine)
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

-- Trends
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

-- Scripts (Guiones)
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

-- Metrics Snapshots (daily IG + YT)
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

-- Reel Metrics (per-video)
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

-- Calendar Entries
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

-- Competitors
CREATE TABLE competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle text NOT NULL UNIQUE,
  platform platform_enum NOT NULL DEFAULT 'instagram',
  followers integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Competitor Reels
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

-- Simulia Metrics
CREATE TABLE simulia_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  revenue decimal NOT NULL DEFAULT 0,
  new_users integer NOT NULL DEFAULT 0,
  total_users integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
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
```

- [ ] **Step 2: Write TypeScript types**

```ts
// creator-dashboard/src/lib/types.ts

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
```

- [ ] **Step 3: Write constants**

```ts
// creator-dashboard/src/lib/constants.ts

export const HOOK_TYPES = [
  { value: "pregunta", label: "Pregunta", color: "bg-orange-100 text-orange-700" },
  { value: "contraste", label: "Contraste", color: "bg-yellow-100 text-yellow-700" },
  { value: "cta", label: "CTA", color: "bg-green-100 text-green-700" },
  { value: "historia", label: "Historia", color: "bg-terracota-bg-strong text-terracota" },
  { value: "shock", label: "Shock", color: "bg-red-100 text-red-700" },
  { value: "afirmacion", label: "Afirmación", color: "bg-blue-100 text-blue-700" },
] as const;

export const PLATFORMS = [
  { value: "ig", label: "Instagram", color: "bg-platform-ig/10 text-platform-ig" },
  { value: "yt", label: "YouTube", color: "bg-platform-yt/10 text-platform-yt" },
  { value: "tt", label: "TikTok", color: "bg-platform-tt/10 text-platform-tt" },
  { value: "shorts", label: "YT Shorts", color: "bg-platform-shorts/10 text-platform-shorts" },
] as const;

export const CALENDAR_STATUS_CONFIG = {
  published: { label: "Publicado", color: "bg-status-published", icon: "✓" },
  scheduled: { label: "Programado", color: "bg-status-scheduled", icon: "◉" },
  video_pending: { label: "Pendiente vídeo", color: "bg-status-pending", icon: "!" },
  draft: { label: "Borrador", color: "bg-status-draft", icon: "○" },
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
```

- [ ] **Step 4: Write Supabase client helpers**

```ts
// creator-dashboard/src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```ts
// creator-dashboard/src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

```ts
// creator-dashboard/src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Step 5: Run migration against Supabase**

```bash
cd /Users/cris/Documents/AGENCIA/PROYECTOS/claude-brain/creator-dashboard
npx supabase db push
```

Or run the SQL directly in the Supabase dashboard SQL editor.

- [ ] **Step 6: Commit**

```bash
git add creator-dashboard/supabase/ creator-dashboard/src/lib/
git commit -m "feat: add Supabase schema, TypeScript types, and constants"
```

---

### Task 3: Auth middleware + login page

**Files:**
- Create: `creator-dashboard/src/lib/auth.ts`
- Create: `creator-dashboard/src/middleware.ts`
- Create: `creator-dashboard/src/app/login/page.tsx`
- Create: `creator-dashboard/src/app/api/auth/route.ts`

- [ ] **Step 1: Write auth helpers**

```ts
// creator-dashboard/src/lib/auth.ts
import { cookies } from "next/headers";

const SESSION_COOKIE = "dashboard_session";
const SESSION_VALUE = "authenticated";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export function checkPassword(password: string): boolean {
  return password === process.env.DASHBOARD_PASSWORD;
}

export { SESSION_COOKIE, SESSION_VALUE };
```

- [ ] **Step 2: Write middleware**

```ts
// creator-dashboard/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("dashboard_session");
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isApiAuth = request.nextUrl.pathname === "/api/auth";
  const isCron = request.nextUrl.pathname.startsWith("/api/cron");

  if (isLoginPage || isApiAuth) return NextResponse.next();

  if (isCron) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (session?.value !== "authenticated") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.png).*)"],
};
```

- [ ] **Step 3: Write auth API route**

```ts
// creator-dashboard/src/app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkPassword, SESSION_COOKIE, SESSION_VALUE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
```

- [ ] **Step 4: Write login page**

```tsx
// creator-dashboard/src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      setError("Contraseña incorrecta");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-foreground text-center">Creator Dashboard</h1>
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full bg-terracota hover:bg-terracota/90" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Test login flow in browser**

Set `DASHBOARD_PASSWORD=test123` in `.env.local`. Run dev server. Navigate to http://localhost:3000 — should redirect to /login. Enter password, should redirect to /.

- [ ] **Step 6: Commit**

```bash
git add creator-dashboard/src/lib/auth.ts creator-dashboard/src/middleware.ts creator-dashboard/src/app/login/ creator-dashboard/src/app/api/auth/
git commit -m "feat: add password auth with middleware and login page"
```

---

### Task 4: Sidebar layout shell + all route pages (empty)

**Files:**
- Create: `creator-dashboard/src/components/sidebar.tsx`
- Create: `creator-dashboard/src/app/layout.tsx`
- Create: all route `page.tsx` files (empty placeholders)

- [ ] **Step 1: Write sidebar component**

```tsx
// creator-dashboard/src/components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: "📊" },
  { href: "/hooks", label: "Baúl de Ganchos", icon: "🪝" },
  { href: "/metrics", label: "Métricas", icon: "📈" },
  { href: "/competitors", label: "Competencia", icon: "🎯" },
  { href: "/community", label: "Community Manager", icon: "📱" },
  { href: "/calendar", label: "Calendario", icon: "📅" },
  { href: "/trends", label: "Tendencias", icon: "🔥" },
];

const BOTTOM_ITEMS = [
  { href: "/engine", label: "Content Engine", icon: "⚡", highlight: true },
  { href: "/simulia", label: "Simulia", icon: "💊" },
  { href: "/settings", label: "Ajustes", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[220px] flex-col border-r border-border bg-surface h-screen sticky top-0">
        <div className="px-5 pt-5 pb-1">
          <div className="text-[15px] font-bold text-foreground">Cris</div>
          <div className="text-[10px] text-muted tracking-wide">AGENCIA + SIMULIA</div>
        </div>

        <nav className="flex-1 px-3 pt-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors",
                isActive(item.href)
                  ? "bg-terracota-bg border-l-[3px] border-terracota text-terracota font-semibold"
                  : "text-muted hover:text-foreground hover:bg-background"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border px-3 py-3 space-y-0.5">
          {BOTTOM_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors",
                isActive(item.href)
                  ? "bg-terracota-bg border-l-[3px] border-terracota text-terracota font-semibold"
                  : item.highlight
                    ? "text-terracota font-semibold hover:bg-terracota-bg"
                    : "text-muted hover:text-foreground hover:bg-background"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around py-2 z-50">
        {[NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[5], { href: "/engine", label: "Engine", icon: "⚡" }].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 text-[10px]",
              isActive(item.href) ? "text-terracota" : "text-muted"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Write root layout**

```tsx
// creator-dashboard/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Creator Dashboard — Cris",
  description: "Dashboard de creador de contenido",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 md:p-7 pb-24 md:pb-7 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create all empty route pages**

Create each page with a title placeholder so routing works:

```tsx
// Pattern for each page — replace TITLE and ICON per section:
// creator-dashboard/src/app/page.tsx (Overview)
// creator-dashboard/src/app/hooks/page.tsx
// creator-dashboard/src/app/metrics/page.tsx
// creator-dashboard/src/app/competitors/page.tsx
// creator-dashboard/src/app/community/page.tsx
// creator-dashboard/src/app/calendar/page.tsx
// creator-dashboard/src/app/trends/page.tsx
// creator-dashboard/src/app/engine/page.tsx
// creator-dashboard/src/app/simulia/page.tsx
// creator-dashboard/src/app/settings/page.tsx

export default function PageName() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Page Title</h1>
      <p className="text-sm text-muted mt-1">Coming soon</p>
    </div>
  );
}
```

Create all 10 pages with appropriate titles (Overview, Baúl de Ganchos, Métricas, Competencia, Community Manager, Calendario, Tendencias, Content Engine, Simulia, Ajustes).

- [ ] **Step 4: Test sidebar navigation in browser**

Run dev server. All sidebar links should navigate between pages. Active state should highlight with terracota. Mobile bottom nav should appear at <768px.

- [ ] **Step 5: Commit**

```bash
git add creator-dashboard/src/
git commit -m "feat: add sidebar layout shell with all route pages"
```

---

## Phase 2: Core Data Pages

### Task 5: Shared UI components (KPI card, sparkline, badges)

**Files:**
- Create: `creator-dashboard/src/components/kpi-card.tsx`
- Create: `creator-dashboard/src/components/sparkline.tsx`
- Create: `creator-dashboard/src/components/status-badge.tsx`
- Create: `creator-dashboard/src/components/platform-badge.tsx`

- [ ] **Step 1: Write sparkline component**

```tsx
// creator-dashboard/src/components/sparkline.tsx
"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color = "#c4704b" }: SparklineProps) {
  const chartData = data.map((value, i) => ({ i, value }));

  return (
    <ResponsiveContainer width="100%" height={28}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${color})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Write KPI card component**

```tsx
// creator-dashboard/src/components/kpi-card.tsx
import { Sparkline } from "./sparkline";

interface KpiCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  sparkData?: number[];
  sparkColor?: string;
  accent?: string;
  sublabel?: string;
}

export function KpiCard({
  label, value, change, changeType = "neutral",
  sparkData, sparkColor, accent, sublabel,
}: KpiCardProps) {
  const changeColor = changeType === "up" ? "text-status-published"
    : changeType === "down" ? "text-status-pending"
    : "text-status-scheduled";

  return (
    <div
      className="bg-surface border border-border rounded-xl p-4"
      style={accent ? { borderLeftWidth: 3, borderLeftColor: accent } : undefined}
    >
      <div className="text-[10px] text-muted tracking-wide uppercase" style={accent ? { color: accent, fontWeight: 600 } : undefined}>
        {label}
      </div>
      <div className="text-2xl font-extrabold text-foreground mt-1.5">{value}</div>
      {change && <div className={`text-[11px] mt-1 ${changeColor}`}>{change}</div>}
      {sublabel && <div className="text-[11px] text-muted mt-1">{sublabel}</div>}
      {sparkData && sparkData.length > 0 && (
        <div className="mt-2">
          <Sparkline data={sparkData} color={sparkColor} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write status and platform badges**

```tsx
// creator-dashboard/src/components/status-badge.tsx
import { CALENDAR_STATUS_CONFIG } from "@/lib/constants";
import type { CalendarStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: CalendarStatus }) {
  const config = CALENDAR_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.color} text-white`}>
      {config.icon} {config.label}
    </span>
  );
}
```

```tsx
// creator-dashboard/src/components/platform-badge.tsx
import { PLATFORMS } from "@/lib/constants";

export function PlatformBadge({ platform }: { platform: string }) {
  const config = PLATFORMS.find((p) => p.value === platform);
  if (!config) return <span className="text-[10px] text-muted">{platform}</span>;

  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.color}`}>
      {config.label}
    </span>
  );
}
```

- [ ] **Step 4: Verify components render**

Import KpiCard into the Overview page and render one with sample data. Check in browser.

- [ ] **Step 5: Commit**

```bash
git add creator-dashboard/src/components/
git commit -m "feat: add shared UI components (KPI card, sparkline, badges)"
```

---

### Task 6: Baúl de Ganchos — API + page

**Files:**
- Create: `creator-dashboard/src/app/api/hooks/route.ts`
- Create: `creator-dashboard/src/app/api/hooks/[id]/route.ts`
- Create: `creator-dashboard/src/components/hook-card.tsx`
- Create: `creator-dashboard/src/components/hook-filters.tsx`
- Modify: `creator-dashboard/src/app/hooks/page.tsx`

- [ ] **Step 1: Write hooks API routes**

```ts
// creator-dashboard/src/app/api/hooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const source = url.searchParams.get("source");
  const sort = url.searchParams.get("sort") || "views";
  const search = url.searchParams.get("q");

  let query = supabase.from("hooks").select("*");

  if (type) query = query.eq("type", type);
  if (source) query = query.eq("source", source);
  if (search) query = query.ilike("text", `%${search}%`);

  const sortColumn = sort === "recent" ? "created_at" : sort === "saves" ? "saves" : "views";
  query = query.order(sortColumn, { ascending: false });

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();
  const { data, error } = await supabase.from("hooks").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

```ts
// creator-dashboard/src/app/api/hooks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();
  const { data, error } = await supabase.from("hooks").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("hooks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Write hook card component**

```tsx
// creator-dashboard/src/components/hook-card.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HOOK_TYPES } from "@/lib/constants";
import type { Hook } from "@/lib/types";

interface HookCardProps {
  hook: Hook;
  onUse: (hook: Hook) => void;
  onAnalyze: (hook: Hook) => void;
}

export function HookCard({ hook, onUse, onAnalyze }: HookCardProps) {
  const typeConfig = HOOK_TYPES.find((t) => t.value === hook.type);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="bg-border-light p-4 min-h-[80px] flex items-center justify-center">
        <p className="text-sm font-bold text-foreground text-center leading-snug">"{hook.text}"</p>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {typeConfig && (
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
          )}
          <span className="text-[10px] text-muted">{hook.source}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="font-semibold text-foreground">{(hook.views / 1000).toFixed(1)}K</span>
          <span className="text-muted">views</span>
          <span className="text-muted mx-1">·</span>
          <span className="font-semibold text-foreground">{(hook.saves / 1000).toFixed(1)}K</span>
          <span className="text-muted">saves</span>
        </div>
        <div className="flex gap-1.5 mt-3">
          <Button size="sm" className="flex-1 h-8 text-[11px] bg-terracota hover:bg-terracota/90" onClick={() => onUse(hook)}>
            Usar →
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => onAnalyze(hook)}>
            Analizar
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write hook filters component**

```tsx
// creator-dashboard/src/components/hook-filters.tsx
"use client";

import { Input } from "@/components/ui/input";
import { HOOK_TYPES } from "@/lib/constants";

interface HookFiltersProps {
  sources: string[];
  activeSource: string | null;
  activeType: string | null;
  activeSort: string;
  searchQuery: string;
  onSourceChange: (source: string | null) => void;
  onTypeChange: (type: string | null) => void;
  onSortChange: (sort: string) => void;
  onSearchChange: (query: string) => void;
}

export function HookFilters({
  sources, activeSource, activeType, activeSort, searchQuery,
  onSourceChange, onTypeChange, onSortChange, onSearchChange,
}: HookFiltersProps) {
  return (
    <div className="space-y-2.5">
      {/* Sources */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => onSourceChange(null)}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
            !activeSource ? "bg-foreground text-white" : "bg-surface border border-border text-muted"
          }`}
        >
          Todos
        </button>
        {sources.map((s) => (
          <button
            key={s}
            onClick={() => onSourceChange(s === activeSource ? null : s)}
            className={`px-3 py-1 rounded-full text-[11px] transition-colors ${
              s === activeSource ? "bg-foreground text-white" : "bg-surface border border-border text-muted"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Types */}
      <div className="flex gap-1.5 flex-wrap items-center">
        <span className="text-[10px] text-muted tracking-wide mr-1">TIPO:</span>
        <button
          onClick={() => onTypeChange(null)}
          className={`px-2.5 py-1 rounded-full text-[11px] ${
            !activeType ? "bg-terracota-bg-strong text-terracota font-medium" : "bg-surface border border-border text-muted"
          }`}
        >
          Todas
        </button>
        {HOOK_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => onTypeChange(t.value === activeType ? null : t.value)}
            className={`px-2.5 py-1 rounded-full text-[11px] ${
              t.value === activeType ? `${t.color} font-medium` : "bg-surface border border-border text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sort + Search */}
      <div className="flex gap-1.5 items-center flex-wrap">
        <span className="text-[10px] text-muted tracking-wide mr-1">ORDENAR:</span>
        {[
          { value: "views", label: "Más vistas" },
          { value: "recent", label: "Recientes" },
          { value: "saves", label: "Top guardados" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => onSortChange(s.value)}
            className={`px-2.5 py-1 rounded-full text-[11px] ${
              activeSort === s.value ? "bg-foreground text-white" : "bg-surface border border-border text-muted"
            }`}
          >
            {s.label}
          </button>
        ))}
        <div className="ml-auto">
          <Input
            placeholder="Buscar en hooks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-[200px] text-xs"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement the full hooks page**

```tsx
// creator-dashboard/src/app/hooks/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { HookCard } from "@/components/hook-card";
import { HookFilters } from "@/components/hook-filters";
import type { Hook } from "@/lib/types";

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState("views");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchHooks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeSource) params.set("source", activeSource);
    if (activeType) params.set("type", activeType);
    params.set("sort", activeSort);
    if (searchQuery) params.set("q", searchQuery);

    const res = await fetch(`/api/hooks?${params}`);
    const data = await res.json();
    setHooks(data);

    const uniqueSources = [...new Set(data.map((h: Hook) => h.source))] as string[];
    if (sources.length === 0) setSources(uniqueSources);
    setLoading(false);
  }, [activeSource, activeType, activeSort, searchQuery, sources.length]);

  useEffect(() => { fetchHooks(); }, [fetchHooks]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Baúl de Ganchos</h1>
          <p className="text-xs text-muted mt-0.5">{hooks.length} hooks</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-terracota hover:bg-terracota/90 text-sm">+ Agregar Hook</Button>
          <Button variant="outline" className="text-sm">Importar</Button>
        </div>
      </div>

      <HookFilters
        sources={sources}
        activeSource={activeSource}
        activeType={activeType}
        activeSort={activeSort}
        searchQuery={searchQuery}
        onSourceChange={setActiveSource}
        onTypeChange={setActiveType}
        onSortChange={setActiveSort}
        onSearchChange={setSearchQuery}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
        {hooks.map((hook) => (
          <HookCard
            key={hook.id}
            hook={hook}
            onUse={(h) => window.location.href = `/engine?hook=${h.id}`}
            onAnalyze={(h) => console.log("analyze", h.id)}
          />
        ))}
      </div>

      {!loading && hooks.length === 0 && (
        <div className="text-center py-20 text-muted text-sm">
          No hay hooks todavía. Agrega uno manualmente o importa desde Competencia.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Insert seed data via Supabase SQL to test**

```sql
INSERT INTO hooks (text, type, source, views, saves, engagement_rate) VALUES
('"[X] acaba de matar a [Y]"', 'shock', '@stoweigh', 45000, 4700, 10.4),
('"Dejá de hacer [X]"', 'cta', '@pinkasting', 32000, 3200, 10.0),
('"Nadie te dice esto sobre [X]"', 'contraste', '@avakov', 28000, 1800, 6.4),
('"Construir una empresa de 8 cifras no es fácil"', 'afirmacion', '@pinkasting', 2000, 5000, 25.0),
('"Cómo gasté el sueldo del mes pasado"', 'historia', '@stoweigh', 19000, 4700, 24.7),
('"Comentá Claude y te enviaré un desglose"', 'cta', 'propio', 15000, 3100, 21.1);
```

- [ ] **Step 6: Test in browser — verify grid renders with filters**

- [ ] **Step 7: Commit**

```bash
git add creator-dashboard/src/app/hooks/ creator-dashboard/src/app/api/hooks/ creator-dashboard/src/components/hook-card.tsx creator-dashboard/src/components/hook-filters.tsx
git commit -m "feat: implement Baúl de Ganchos with filters, search, and grid"
```

---

### Task 7: Calendar page with colorimetry status + side panel

**Files:**
- Create: `creator-dashboard/src/app/api/calendar/route.ts`
- Create: `creator-dashboard/src/app/api/calendar/[id]/route.ts`
- Create: `creator-dashboard/src/components/calendar-grid.tsx`
- Create: `creator-dashboard/src/components/calendar-day-cell.tsx`
- Create: `creator-dashboard/src/components/calendar-side-panel.tsx`
- Create: `creator-dashboard/src/components/script-viewer.tsx`
- Modify: `creator-dashboard/src/app/calendar/page.tsx`

- [ ] **Step 1: Write calendar API routes**

```ts
// creator-dashboard/src/app/api/calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const url = new URL(request.url);
  const month = url.searchParams.get("month"); // "2026-06"

  let query = supabase
    .from("calendar_entries")
    .select("*, script:scripts(*), reel_metric:reel_metrics(*)")
    .order("date", { ascending: true })
    .order("time_slot", { ascending: true });

  if (month) {
    const start = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const end = new Date(y, m, 0).toISOString().split("T")[0]; // last day
    query = query.gte("date", start).lte("date", end);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();
  const { data, error } = await supabase.from("calendar_entries").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

```ts
// creator-dashboard/src/app/api/calendar/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();
  body.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from("calendar_entries").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Write calendar day cell with colorimetry**

```tsx
// creator-dashboard/src/components/calendar-day-cell.tsx
import { PlatformBadge } from "./platform-badge";
import { CALENDAR_STATUS_CONFIG } from "@/lib/constants";
import type { CalendarEntry } from "@/lib/types";

interface CalendarDayCellProps {
  day: number;
  isToday: boolean;
  entries: CalendarEntry[];
  onEntryClick: (entry: CalendarEntry) => void;
}

export function CalendarDayCell({ day, isToday, entries, onEntryClick }: CalendarDayCellProps) {
  return (
    <div
      className={`border-r border-b border-border-light p-2 min-h-[110px] ${
        isToday ? "bg-terracota-bg" : ""
      }`}
    >
      <div className={`text-[11px] font-semibold mb-1.5 ${isToday ? "text-terracota" : "text-foreground"}`}>
        {day}
      </div>
      <div className="space-y-1">
        {entries.map((entry) => {
          const statusConfig = CALENDAR_STATUS_CONFIG[entry.status];
          const borderColor = entry.status === "published" ? "border-status-published"
            : entry.status === "scheduled" ? "border-status-scheduled"
            : entry.status === "video_pending" ? "border-status-pending"
            : "border-status-draft";

          return (
            <button
              key={entry.id}
              onClick={() => onEntryClick(entry)}
              className={`w-full text-left border-l-2 ${borderColor} rounded-r bg-surface/80 px-1.5 py-1 hover:bg-border-light transition-colors`}
            >
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-semibold text-muted">{entry.time_slot.slice(0, 5)}</span>
                {entry.platform.map((p) => (
                  <PlatformBadge key={p} platform={p} />
                ))}
                {entry.status === "published" && (
                  <span className="text-[9px] text-status-published ml-auto">✓</span>
                )}
                {entry.reel_metric?.is_bombazo && (
                  <span className="text-[9px] ml-auto">🔥</span>
                )}
              </div>
              <div className="text-[10px] text-foreground leading-snug mt-0.5 line-clamp-2">
                {entry.style} — "{entry.hook_preview}"
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write calendar grid component**

```tsx
// creator-dashboard/src/components/calendar-grid.tsx
"use client";

import { useMemo } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDayCell } from "./calendar-day-cell";
import { DAYS_OF_WEEK } from "@/lib/constants";
import type { CalendarEntry } from "@/lib/types";

interface CalendarGridProps {
  month: Date;
  entries: CalendarEntry[];
  onEntryClick: (entry: CalendarEntry) => void;
}

export function CalendarGrid({ month, entries, onEntryClick }: CalendarGridProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    entries.forEach((entry) => {
      const key = entry.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    });
    return map;
  }, [entries]);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="p-2.5 text-center text-[11px] text-muted tracking-wide">
            {day.toUpperCase()}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayEntries = entriesByDate.get(dateStr) || [];
          const inMonth = isSameMonth(day, month);

          if (!inMonth) {
            return <div key={dateStr} className="border-r border-b border-border-light p-2 min-h-[110px] opacity-30" />;
          }

          return (
            <CalendarDayCell
              key={dateStr}
              day={day.getDate()}
              isToday={isToday(day)}
              entries={dayEntries}
              onEntryClick={onEntryClick}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write script viewer and side panel**

```tsx
// creator-dashboard/src/components/script-viewer.tsx
import type { Script } from "@/lib/types";

export function ScriptViewer({ script }: { script: Script }) {
  const sections = [
    { label: "HOOK", text: script.hook_text },
    { label: "PROBLEMA", text: script.problem_text },
    { label: "SOLUCIÓN", text: script.solution_text },
    { label: "PRUEBA SOCIAL", text: script.social_proof_text },
    { label: "CTA", text: script.cta_text },
  ];

  return (
    <div className="space-y-3">
      {sections.map((s) => (
        <div key={s.label}>
          <div className="text-[9px] text-terracota tracking-wide font-bold mb-1">{s.label}</div>
          <div className="text-[13px] text-foreground leading-relaxed">{s.text}</div>
        </div>
      ))}
    </div>
  );
}
```

```tsx
// creator-dashboard/src/components/calendar-side-panel.tsx
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScriptViewer } from "./script-viewer";
import { StatusBadge } from "./status-badge";
import { PlatformBadge } from "./platform-badge";
import type { CalendarEntry } from "@/lib/types";

interface CalendarSidePanelProps {
  entry: CalendarEntry | null;
  open: boolean;
  onClose: () => void;
}

export function CalendarSidePanel({ entry, open, onClose }: CalendarSidePanelProps) {
  if (!entry) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[420px] overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle className="text-base">
            {entry.date} · {entry.time_slot.slice(0, 5)}
          </SheetTitle>
          <div className="flex items-center gap-2 mt-1">
            {entry.platform.map((p) => <PlatformBadge key={p} platform={p} />)}
            <StatusBadge status={entry.status} />
          </div>
        </SheetHeader>

        <div className="mt-6">
          {entry.script ? (
            <ScriptViewer script={entry.script} />
          ) : (
            <p className="text-sm text-muted">Sin guion asignado</p>
          )}
        </div>

        {/* Metrics if published */}
        {entry.reel_metric && (
          <div className="mt-6 p-4 bg-surface border border-border rounded-lg">
            <div className="text-[10px] text-muted tracking-wide mb-2">MÉTRICAS REALES</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted">Views:</span> <span className="font-bold">{entry.reel_metric.views.toLocaleString()}</span></div>
              <div><span className="text-muted">Likes:</span> <span className="font-bold">{entry.reel_metric.likes.toLocaleString()}</span></div>
              <div><span className="text-muted">Guardados:</span> <span className="font-bold">{entry.reel_metric.saves.toLocaleString()}</span></div>
              <div><span className="text-muted">Comentarios:</span> <span className="font-bold">{entry.reel_metric.comments.toLocaleString()}</span></div>
            </div>
            {entry.reel_metric.is_bombazo && (
              <div className="mt-3 text-sm text-terracota font-semibold">
                🔥 Bombazo x{entry.reel_metric.bombazo_multiplier?.toFixed(1)}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <Button className="flex-1 bg-terracota hover:bg-terracota/90 text-sm">Publicar</Button>
          <Button variant="outline" className="text-sm">Editar</Button>
          {entry.reel_metric?.is_bombazo && (
            <Button variant="outline" className="text-sm text-terracota border-terracota">Crear Trial →</Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 5: Implement full calendar page**

```tsx
// creator-dashboard/src/app/calendar/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/calendar-grid";
import { CalendarSidePanel } from "@/components/calendar-side-panel";
import type { CalendarEntry } from "@/lib/types";

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchEntries = useCallback(async () => {
    const monthStr = format(month, "yyyy-MM");
    const res = await fetch(`/api/calendar?month=${monthStr}`);
    const data = await res.json();
    setEntries(data);
  }, [month]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground capitalize">
            {format(month, "MMMM yyyy", { locale: es })}
          </h1>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setMonth(subMonths(month, 1))}>←</Button>
            <Button variant="outline" size="sm" onClick={() => setMonth(addMonths(month, 1))}>→</Button>
          </div>
        </div>
        <Button className="bg-terracota hover:bg-terracota/90 text-sm">+ Desde Content Engine</Button>
      </div>

      <CalendarGrid
        month={month}
        entries={entries}
        onEntryClick={(entry) => {
          setSelectedEntry(entry);
          setPanelOpen(true);
        }}
      />

      <CalendarSidePanel
        entry={selectedEntry}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 6: Insert seed calendar data, test in browser**

- [ ] **Step 7: Commit**

```bash
git add creator-dashboard/src/app/calendar/ creator-dashboard/src/app/api/calendar/ creator-dashboard/src/components/calendar-grid.tsx creator-dashboard/src/components/calendar-day-cell.tsx creator-dashboard/src/components/calendar-side-panel.tsx creator-dashboard/src/components/script-viewer.tsx
git commit -m "feat: implement Calendar with colorimetry status and side panel"
```

---

### Task 8: Metrics page — KPIs, charts, bombazos

**Files:**
- Create: `creator-dashboard/src/components/metrics-chart-reach.tsx`
- Create: `creator-dashboard/src/components/metrics-chart-engagement.tsx`
- Create: `creator-dashboard/src/components/bombazo-card.tsx`
- Modify: `creator-dashboard/src/app/metrics/page.tsx`

- [ ] **Step 1: Write reach bar chart**

```tsx
// creator-dashboard/src/components/metrics-chart-reach.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { MetricsSnapshot } from "@/lib/types";

export function MetricsChartReach({ data }: { data: MetricsSnapshot[] }) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    reach: d.reach,
    impressions: d.impressions,
  }));

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-foreground">Alcance & Visibilidad</span>
        <div className="flex gap-3 text-[10px] text-muted">
          <span><span className="inline-block w-2 h-2 rounded-full bg-terracota mr-1" />Alcance</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-terracota/40 mr-1" />Impresiones</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#999" }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Bar dataKey="reach" fill="#c4704b" radius={[3, 3, 0, 0]} />
          <Bar dataKey="impressions" fill="rgba(196,112,75,0.3)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Write engagement donut chart**

```tsx
// creator-dashboard/src/components/metrics-chart-engagement.tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface EngagementData {
  likes: number;
  saves: number;
  comments: number;
  rate: number;
}

const COLORS = ["#c4704b", "#22c55e", "#3b82f6"];

export function MetricsChartEngagement({ data }: { data: EngagementData }) {
  const chartData = [
    { name: "Likes", value: data.likes },
    { name: "Guardados", value: data.saves },
    { name: "Comentarios", value: data.comments },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-foreground">Engagement</span>
        <span className="text-xs font-bold text-foreground">{data.rate.toFixed(1)}%</span>
      </div>
      <div className="flex gap-5 items-center">
        <ResponsiveContainer width={90} height={90}>
          <PieChart>
            <Pie data={chartData} innerRadius={25} outerRadius={42} dataKey="value" stroke="none">
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2">
          {chartData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded" style={{ background: COLORS[i] }} />
              <span className="text-muted">{item.name}</span>
              <span className="font-bold text-foreground ml-auto">{(item.value / 1000).toFixed(1)}K</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write bombazo card**

```tsx
// creator-dashboard/src/components/bombazo-card.tsx
import { Button } from "@/components/ui/button";
import type { ReelMetric } from "@/lib/types";

export function BombazoCard({ reel, onCreateTrial }: { reel: ReelMetric; onCreateTrial: (reel: ReelMetric) => void }) {
  return (
    <div className="bg-border-light border border-border rounded-xl p-3.5">
      <div className="flex justify-between items-start mb-2">
        <span className="bg-terracota text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
          x{reel.bombazo_multiplier?.toFixed(1)}
        </span>
        <span className="text-[10px] text-muted">
          {reel.is_organic ? "100% orgánico" : "Ads"}
        </span>
      </div>
      <div className="text-[22px] font-extrabold text-foreground">{(reel.views / 1000).toFixed(1)}K</div>
      <div className="text-[11px] text-muted mt-0.5">views</div>
      <div className="text-[11px] text-muted mt-1.5 line-clamp-2 leading-snug">"{reel.hook_text}"</div>
      <div className="flex gap-2 mt-2 text-[10px] text-muted">
        <span>❤️ {reel.likes.toLocaleString()}</span>
        <span>💬 {reel.comments.toLocaleString()}</span>
        <span>📌 {reel.saves.toLocaleString()}</span>
        <span>📤 {reel.shares.toLocaleString()}</span>
      </div>
      <div className="flex gap-2 mt-3">
        <a href={reel.url} target="_blank" rel="noopener noreferrer"
           className="flex-1 text-center bg-terracota-bg text-terracota py-1.5 rounded-md text-[11px] font-medium">
          Ver en IG ↗
        </a>
        <Button size="sm" variant="outline" className="text-[11px] h-auto py-1.5 text-terracota border-terracota"
                onClick={() => onCreateTrial(reel)}>
          Crear Trial →
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement full metrics page**

Build the page composing: KpiCard row (5 cards), toggle 7/30/90d, charts row (reach + engagement), bombazos section. Fetch from `/api/cron/metrics` data stored in `metrics_snapshots` and `reel_metrics`. Use `useEffect` + `useState` pattern. The page fetches two API endpoints:
- `GET /api/metrics?range=7` → returns aggregated KPIs + daily snapshots
- `GET /api/metrics/reels?bombazo=true` → returns bombazo reels

Create these API routes at `creator-dashboard/src/app/api/metrics/route.ts` and `creator-dashboard/src/app/api/metrics/reels/route.ts`.

- [ ] **Step 5: Test with seed data in browser**

- [ ] **Step 6: Commit**

```bash
git add creator-dashboard/src/app/metrics/ creator-dashboard/src/app/api/metrics/ creator-dashboard/src/components/metrics-chart-reach.tsx creator-dashboard/src/components/metrics-chart-engagement.tsx creator-dashboard/src/components/bombazo-card.tsx
git commit -m "feat: implement Metrics page with KPIs, charts, and bombazos"
```

---

### Task 9: Competitors page — ranking table + detail panel

**Files:**
- Create: `creator-dashboard/src/app/api/competitors/route.ts`
- Create: `creator-dashboard/src/app/api/competitors/reels/route.ts`
- Create: `creator-dashboard/src/components/competitor-table.tsx`
- Create: `creator-dashboard/src/components/competitor-detail.tsx`
- Modify: `creator-dashboard/src/app/competitors/page.tsx`

- [ ] **Step 1: Write competitor API routes**

GET `/api/competitors` returns competitor accounts. POST creates new. GET `/api/competitors/reels` returns scraped reels with competitor join, sorted by views desc, limit 20.

- [ ] **Step 2: Write sortable ranking table component**

Table with columns: #, Creador (handle + followers), Hook, Views, Eng%, Shares, Actions ("Al Baúl" + "Ver"). Use `useState` for sort column/direction. Clicking headers toggles sort.

- [ ] **Step 3: Write detail panel**

Expandable panel showing transcription + screen_text. Buttons: "Guardar Gancho al Baúl →" (POST to /api/hooks), "Analizar con Claude" (POST to /api/analyze).

- [ ] **Step 4: Implement competitors page composing table + detail + add account form**

- [ ] **Step 5: Test with seed data**

- [ ] **Step 6: Commit**

```bash
git add creator-dashboard/src/app/competitors/ creator-dashboard/src/app/api/competitors/ creator-dashboard/src/components/competitor-table.tsx creator-dashboard/src/components/competitor-detail.tsx
git commit -m "feat: implement Competitors page with ranking table and detail panel"
```

---

### Task 10: Trends page

**Files:**
- Create: `creator-dashboard/src/app/api/trends/route.ts`
- Create: `creator-dashboard/src/components/trend-item.tsx`
- Modify: `creator-dashboard/src/app/trends/page.tsx`

- [ ] **Step 1: Write trends API**

GET `/api/trends` with optional `category` filter. Returns trends ordered by `scanned_at` desc.

- [ ] **Step 2: Write trend item component**

Row with category badge (Gancho green, Explicativo yellow, Ignorar gray with opacity), title, source, time ago, suggested angle, buttons "Crear Guion →" and "Guardar".

- [ ] **Step 3: Implement trends page with filter pills (Todos, Gancho, Explicativo, Ignorar) + list + sources display at bottom**

- [ ] **Step 4: Test with seed data**

- [ ] **Step 5: Commit**

```bash
git add creator-dashboard/src/app/trends/ creator-dashboard/src/app/api/trends/ creator-dashboard/src/components/trend-item.tsx
git commit -m "feat: implement Trends page with category filters"
```

---

### Task 11: Community Manager — composer + queue

**Files:**
- Create: `creator-dashboard/src/app/api/publish/route.ts`
- Create: `creator-dashboard/src/app/api/publish/describe/route.ts`
- Create: `creator-dashboard/src/components/publish-composer.tsx`
- Create: `creator-dashboard/src/components/description-preview.tsx`
- Create: `creator-dashboard/src/components/publish-queue.tsx`
- Modify: `creator-dashboard/src/app/community/page.tsx`

- [ ] **Step 1: Write publish describe API (Claude generates descriptions)**

POST `/api/publish/describe` receives `{ script_id, platforms }`, fetches the script, calls Claude to generate platform-specific descriptions. Returns `{ ig: string, tt: string, yt: string }`.

Claude prompt: "Generate social media descriptions for this content script. Adapt tone and length per platform. Include relevant hashtags. Script: [hook_text] [problem_text] [solution_text] [cta_text]. Platforms: [list]. Response format: JSON with keys ig, tt, yt."

- [ ] **Step 2: Write composer component**

Video upload area (Supabase Storage), script selector dropdown, platform toggles, date/time picker, auto-generated descriptions panel with "Regenerar ↻".

- [ ] **Step 3: Write queue component**

List of calendar_entries with status scheduled/video_pending, showing date, platforms badges, hook preview, status.

- [ ] **Step 4: Implement community page composing composer + queue**

- [ ] **Step 5: Test composer flow end-to-end**

- [ ] **Step 6: Commit**

```bash
git add creator-dashboard/src/app/community/ creator-dashboard/src/app/api/publish/ creator-dashboard/src/components/publish-composer.tsx creator-dashboard/src/components/description-preview.tsx creator-dashboard/src/components/publish-queue.tsx
git commit -m "feat: implement Community Manager with composer and publish queue"
```

---

## Phase 3: Intelligence Layer

### Task 12: Claude + Whisper client libraries

**Files:**
- Create: `creator-dashboard/src/lib/claude.ts`
- Create: `creator-dashboard/src/lib/whisper.ts`
- Create: `creator-dashboard/src/app/api/analyze/route.ts`

- [ ] **Step 1: Write Claude client**

```ts
// creator-dashboard/src/lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeHook(hookText: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Analiza este hook de contenido de redes sociales. Explica por qué funciona: la estructura, la emoción que genera, el patrón psicológico que explota. Sé directo y concreto. En español.\n\nHook: "${hookText}"`,
    }],
  });
  return message.content[0].type === "text" ? message.content[0].text : "";
}

export async function classifyTrend(title: string, source: string): Promise<{ category: string; angle: string }> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Clasifica esta tendencia para un creador de contenido sobre IA + ecommerce (Shopify). Responde SOLO en JSON.\n\nTítulo: "${title}"\nFuente: ${source}\n\nJSON format: {"category": "gancho"|"explicativo"|"ignorar", "angle": "sugerencia de ángulo de contenido en español, 1-2 frases"}`,
    }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  return JSON.parse(text);
}

export async function generateDescriptions(script: { hook_text: string; problem_text: string; cta_text: string }, platforms: string[]): Promise<Record<string, string>> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Genera descripciones para redes sociales basadas en este guion. Adapta tono y largo por plataforma. Incluye hashtags relevantes. En español.\n\nHook: "${script.hook_text}"\nProblema: "${script.problem_text}"\nCTA: "${script.cta_text}"\n\nPlataformas: ${platforms.join(", ")}\n\nResponde SOLO en JSON con keys: ${platforms.join(", ")}. Cada value es la descripción completa.`,
    }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  return JSON.parse(text);
}

export { client as anthropic };
```

- [ ] **Step 2: Write Whisper client**

```ts
// creator-dashboard/src/lib/whisper.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(audioUrl: string): Promise<string> {
  const response = await fetch(audioUrl);
  const blob = await response.blob();
  const file = new File([blob], "audio.mp4", { type: "audio/mp4" });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "es",
  });

  return transcription.text;
}
```

- [ ] **Step 3: Write analyze API route**

```ts
// creator-dashboard/src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { analyzeHook } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const { hook_text } = await request.json();
  if (!hook_text) return NextResponse.json({ error: "hook_text required" }, { status: 400 });

  const analysis = await analyzeHook(hook_text);
  return NextResponse.json({ analysis });
}
```

- [ ] **Step 4: Commit**

```bash
git add creator-dashboard/src/lib/claude.ts creator-dashboard/src/lib/whisper.ts creator-dashboard/src/app/api/analyze/
git commit -m "feat: add Claude and Whisper client libraries + analyze API"
```

---

### Task 13: Content Engine wizard (5-step SYK methodology)

**Files:**
- Create: `creator-dashboard/src/components/engine-wizard.tsx`
- Create: `creator-dashboard/src/components/engine-step-profile.tsx`
- Create: `creator-dashboard/src/components/engine-step-bio.tsx`
- Create: `creator-dashboard/src/components/engine-step-feed.tsx`
- Create: `creator-dashboard/src/components/engine-step-stories.tsx`
- Create: `creator-dashboard/src/components/engine-step-scripts.tsx`
- Create: `creator-dashboard/src/components/script-editor.tsx`
- Create: `creator-dashboard/src/app/api/engine/route.ts`
- Modify: `creator-dashboard/src/app/engine/page.tsx`

- [ ] **Step 1: Write engine API route**

POST `/api/engine` handles each step. Request body: `{ step: number, session_id: string, data: object }`. For step 2 (bio), calls Claude with SYK bio audit prompt. For step 3 (feed calendar), generates calendar with style constraints. For step 5 (scripts), generates 7 scripts at a time with full SYK structure (HOOK, PROBLEMA, SOLUCIÓN, PRUEBA SOCIAL, CTA). Returns generated content.

Include the full SYK methodology prompts from the spec: lenguaje directo, tono picante, nunca repetir hook/problema/CTA, regla de no repetir estilo consecutivo.

- [ ] **Step 2: Write wizard shell component**

Step indicator bar (1-5) with progress. Renders the active step component. Manages session state in `syk_sessions` table.

- [ ] **Step 3: Write step 1 (profile) — form with 10 SYK questions**

Questions: audiencia, problema principal, resultado concreto, facturación, oferta, bio actual, 6 estilos de contenido, posteos por día, días sin publicar, views promedio stories. Save to `syk_sessions.profile_data` on submit.

- [ ] **Step 4: Write step 2 (bio) — Claude audit + rewrite**

Sends bio to Claude with SYK bio audit prompt (3 lines, emoji per line, CTA). Displays current vs proposed. "Copiar bio" button. "Siguiente" advances.

- [ ] **Step 5: Write step 3 (feed calendar) — generated weekly calendar**

Displays generated L-D calendar with styles and times. Style count per week. Validates no consecutive repeats.

- [ ] **Step 6: Write step 4 (stories calendar)**

Based on views threshold (<3000 or ≥3000), shows appropriate structure. Optional encuesta + caja de preguntas toggle.

- [ ] **Step 7: Write step 5 (42 scripts) — batch of 7 with approve/regenerate/edit**

Shows scripts 7 at a time. Each script card with ScriptViewer + "Aprobar → Calendario" / "Regenerar" / "Editar" buttons. Progress counter (7/42, 14/42, etc.). "Aprobar" creates a calendar_entry + script row.

- [ ] **Step 8: Write script editor component**

Form with fields for hook_text, problem_text, solution_text, social_proof_text, cta_text. Used when "Editar" is clicked on a script.

- [ ] **Step 9: Implement engine page composing wizard**

- [ ] **Step 10: Test full 5-step flow in browser**

- [ ] **Step 11: Commit**

```bash
git add creator-dashboard/src/app/engine/ creator-dashboard/src/app/api/engine/ creator-dashboard/src/components/engine-wizard.tsx creator-dashboard/src/components/engine-step-*.tsx creator-dashboard/src/components/script-editor.tsx
git commit -m "feat: implement Content Engine wizard with 5-step SYK methodology"
```

---

### Task 14: Cron jobs — metrics sync, competitors scrape, trends scan, bombazo detect

**Files:**
- Create: `creator-dashboard/src/lib/instagram.ts`
- Create: `creator-dashboard/src/lib/youtube.ts`
- Create: `creator-dashboard/src/lib/rss.ts`
- Create: `creator-dashboard/src/app/api/cron/metrics/route.ts`
- Create: `creator-dashboard/src/app/api/cron/competitors/route.ts`
- Create: `creator-dashboard/src/app/api/cron/trends/route.ts`
- Create: `creator-dashboard/src/app/api/cron/bombazo/route.ts`
- Create: `creator-dashboard/vercel.json`

- [ ] **Step 1: Write Instagram API client**

```ts
// creator-dashboard/src/lib/instagram.ts
const BASE_URL = "https://graph.instagram.com/v18.0";

export async function fetchIGMetrics(accessToken: string) {
  const res = await fetch(`${BASE_URL}/me/insights?metric=impressions,reach,follower_count&period=day&access_token=${accessToken}`);
  return res.json();
}

export async function fetchIGMedia(accessToken: string, limit = 25) {
  const res = await fetch(`${BASE_URL}/me/media?fields=id,caption,timestamp,media_type,permalink,like_count,comments_count,insights.metric(impressions,reach,saved,shares)&limit=${limit}&access_token=${accessToken}`);
  return res.json();
}
```

- [ ] **Step 2: Write YouTube API client**

```ts
// creator-dashboard/src/lib/youtube.ts
const BASE_URL = "https://www.googleapis.com/youtube/v3";

export async function fetchYTChannelStats(apiKey: string, channelId: string) {
  const res = await fetch(`${BASE_URL}/channels?part=statistics&id=${channelId}&key=${apiKey}`);
  return res.json();
}

export async function fetchYTVideos(apiKey: string, channelId: string, maxResults = 25) {
  const searchRes = await fetch(`${BASE_URL}/search?part=id&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}&key=${apiKey}`);
  const searchData = await searchRes.json();
  const ids = searchData.items.map((i: { id: { videoId: string } }) => i.id.videoId).join(",");
  const statsRes = await fetch(`${BASE_URL}/videos?part=statistics,snippet&id=${ids}&key=${apiKey}`);
  return statsRes.json();
}
```

- [ ] **Step 3: Write RSS parser for trends**

```ts
// creator-dashboard/src/lib/rss.ts
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
      const recent = feed.items.slice(0, 5);
      for (const item of recent) {
        if (item.title && item.link) {
          results.push({
            title: item.title,
            source,
            url: item.link,
            published: item.isoDate || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Skip failed feeds silently
    }
  }

  return results;
}
```

- [ ] **Step 4: Write metrics sync cron**

```ts
// creator-dashboard/src/app/api/cron/metrics/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchIGMetrics, fetchIGMedia } from "@/lib/instagram";
import { fetchYTChannelStats, fetchYTVideos } from "@/lib/youtube";

export async function GET() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // Instagram metrics
  if (process.env.INSTAGRAM_ACCESS_TOKEN) {
    try {
      const metrics = await fetchIGMetrics(process.env.INSTAGRAM_ACCESS_TOKEN);
      // Parse and upsert into metrics_snapshots
      // Fetch individual reels and upsert into reel_metrics
      const media = await fetchIGMedia(process.env.INSTAGRAM_ACCESS_TOKEN);
      // Process media items into reel_metrics rows
    } catch (e) {
      console.error("IG metrics sync failed:", e);
    }
  }

  // YouTube metrics
  if (process.env.YOUTUBE_API_KEY) {
    try {
      // Similar: fetch channel stats → metrics_snapshots, videos → reel_metrics
    } catch (e) {
      console.error("YT metrics sync failed:", e);
    }
  }

  return NextResponse.json({ ok: true, date: today });
}
```

- [ ] **Step 5: Write competitors scrape cron**

Fetches each active competitor from DB, calls IG API for their top reels, transcribes with Whisper, extracts screen text with Claude Vision, classifies hook type, upserts into `competitor_reels`.

- [ ] **Step 6: Write trends scan cron**

Calls `fetchAllFeeds()`, deduplicates by URL against existing trends, sends new items to `classifyTrend()` (Claude), inserts into `trends`.

- [ ] **Step 7: Write bombazo detect cron**

```ts
// creator-dashboard/src/app/api/cron/bombazo/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  // Calculate median views over last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: reels } = await supabase
    .from("reel_metrics")
    .select("id, views")
    .gte("published_at", thirtyDaysAgo)
    .order("views", { ascending: true });

  if (!reels || reels.length < 3) return NextResponse.json({ ok: true, message: "Not enough data" });

  const median = reels[Math.floor(reels.length / 2)].views;
  const threshold = median * 2;

  // Mark bombazos
  const { data: bombazos } = await supabase
    .from("reel_metrics")
    .select("id, views")
    .gte("views", threshold)
    .eq("is_bombazo", false);

  if (bombazos && bombazos.length > 0) {
    for (const reel of bombazos) {
      await supabase
        .from("reel_metrics")
        .update({
          is_bombazo: true,
          bombazo_multiplier: reel.views / median,
          metrics_updated_at: new Date().toISOString(),
        })
        .eq("id", reel.id);
    }
  }

  return NextResponse.json({ ok: true, median, threshold, new_bombazos: bombazos?.length || 0 });
}
```

- [ ] **Step 8: Write vercel.json with cron config**

```json
{
  "crons": [
    { "path": "/api/cron/metrics", "schedule": "0 2 * * *" },
    { "path": "/api/cron/bombazo", "schedule": "0 3 * * *" },
    { "path": "/api/cron/trends", "schedule": "0 7 * * *" },
    { "path": "/api/cron/competitors", "schedule": "0 6 * * 0" }
  ]
}
```

- [ ] **Step 9: Commit**

```bash
git add creator-dashboard/src/lib/instagram.ts creator-dashboard/src/lib/youtube.ts creator-dashboard/src/lib/rss.ts creator-dashboard/src/app/api/cron/ creator-dashboard/vercel.json
git commit -m "feat: add 4 cron jobs (metrics, bombazo, trends, competitors)"
```

---

## Phase 4: Overview + Simulia + Settings + Deploy

### Task 15: Overview page (KPIs + widgets)

**Files:**
- Modify: `creator-dashboard/src/app/page.tsx`

- [ ] **Step 1: Implement Overview page**

Fetch latest metrics, hooks, calendar entries, trends, competitor reels. Compose: KPI row (4 cards with sparklines), two-column layout with hooks recientes widget + mini calendar widget, bottom row with trends today + competencia top reel. Quick action buttons "+ Nuevo Guion" and "Content Engine".

- [ ] **Step 2: Test in browser**

- [ ] **Step 3: Commit**

```bash
git add creator-dashboard/src/app/page.tsx
git commit -m "feat: implement Overview page with KPIs and widgets"
```

---

### Task 16: Simulia + Settings pages

**Files:**
- Create: `creator-dashboard/src/app/api/simulia/route.ts`
- Modify: `creator-dashboard/src/app/simulia/page.tsx`
- Modify: `creator-dashboard/src/app/settings/page.tsx`

- [ ] **Step 1: Write Simulia API**

GET returns latest months. POST creates/updates a month entry.

- [ ] **Step 2: Implement Simulia page**

Big number for revenue last 30 days + new users. Monthly history table with Recharts bar chart. Manual entry form for adding monthly data.

- [ ] **Step 3: Implement Settings page**

Form sections for: API keys status (show connected/not for IG, YT, Claude, Whisper), competitor accounts management, profile data (reuse from Content Engine step 1), password change.

- [ ] **Step 4: Commit**

```bash
git add creator-dashboard/src/app/simulia/ creator-dashboard/src/app/settings/ creator-dashboard/src/app/api/simulia/
git commit -m "feat: implement Simulia metrics and Settings pages"
```

---

### Task 17: Deploy to Vercel

**Files:**
- Create: `creator-dashboard/.env.local` (from .env.local.example with real values)

- [ ] **Step 1: Set up Supabase project**

Create project at supabase.com. Run migration SQL in SQL editor. Copy URL + anon key + service role key.

- [ ] **Step 2: Set up Vercel project**

```bash
cd /Users/cris/Documents/AGENCIA/PROYECTOS/claude-brain/creator-dashboard
npx vercel
```

Link to Vercel account. Set root directory to `creator-dashboard`.

- [ ] **Step 3: Add environment variables in Vercel dashboard**

Add all env vars from `.env.local.example` with production values.

- [ ] **Step 4: Deploy**

```bash
npx vercel --prod
```

- [ ] **Step 5: Verify deployed app**

Open production URL. Test login. Navigate all sections. Verify cron jobs are registered in Vercel dashboard.

- [ ] **Step 6: Commit any deploy config changes**

```bash
git add creator-dashboard/
git commit -m "feat: configure Vercel deployment"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1: Foundation | 1-4 | Scaffold, DB, auth, sidebar shell with routing |
| 2: Core Pages | 5-11 | All 7 section pages + shared components |
| 3: Intelligence | 12-14 | Claude/Whisper integration, Content Engine, cron jobs |
| 4: Ship | 15-17 | Overview, Simulia, Settings, Vercel deploy |

Total: **17 tasks**, each independently committable and testable.
