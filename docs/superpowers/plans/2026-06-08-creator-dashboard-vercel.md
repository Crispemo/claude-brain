# Creator Dashboard Vercel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a Next.js 14 dashboard on Vercel that shows YouTube, Instagram, and Tally lead metrics with ICP-driven analysis, updated via a manual refresh button.

**Architecture:** Next.js 14 App Router with server-side API Routes for each data source (YouTube Data API + Analytics OAuth, Instagram Graph API, Google Sheets for Tally). Client fetches from `/api/refresh` on button click. No database — all data pulled live.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, googleapis npm package, Vercel

---

## File Map

```
creator-dashboard/               ← new independent project
├── app/
│   ├── layout.tsx               # Root layout with Sidebar
│   ├── page.tsx                 # Redirect → /youtube
│   ├── youtube/page.tsx         # YouTube section
│   ├── instagram/page.tsx       # Instagram section
│   ├── leads/page.tsx           # Leads section
│   └── icp/page.tsx             # ICP section
├── app/api/
│   ├── youtube/route.ts         # YouTube API route
│   ├── instagram/route.ts       # Instagram API route
│   ├── leads/route.ts           # Google Sheets API route
│   └── refresh/route.ts         # Parallel refresh of all sources
├── components/
│   ├── Sidebar.tsx              # Nav + refresh button + last-updated
│   ├── KpiCard.tsx              # Single metric card
│   ├── DataTable.tsx            # Generic sortable table
│   ├── IcpInsightBox.tsx        # Deterministic ICP analysis block
│   └── TokenAlert.tsx           # Instagram token expiry banner
├── data/
│   └── icp.json                 # Static ICP definition
├── lib/
│   ├── youtube.ts               # YouTube Data + Analytics API calls
│   ├── instagram.ts             # Instagram Graph API calls
│   └── sheets.ts                # Google Sheets API (Tally responses)
├── types/
│   └── index.ts                 # Shared TypeScript types
├── __tests__/
│   ├── lib/youtube.test.ts
│   ├── lib/instagram.test.ts
│   └── lib/sheets.test.ts
├── .env.local                   # Local secrets (not committed)
├── jest.config.ts
└── tailwind.config.ts
```

---

## Task 1: Project scaffold

**Files:**
- Create: `creator-dashboard/` (new project)
- Create: `creator-dashboard/types/index.ts`
- Create: `creator-dashboard/.env.local`
- Create: `creator-dashboard/jest.config.ts`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /Users/cris/Desktop
npx create-next-app@latest creator-dashboard \
  --typescript --tailwind --app --no-src-dir \
  --import-alias "@/*" --no-eslint
cd creator-dashboard
```

- [ ] **Step 2: Install dependencies**

```bash
npm install googleapis
npm install --save-dev jest @types/jest ts-jest jest-environment-node
```

- [ ] **Step 3: Add Jest config**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default config
```

Add to `package.json` scripts:
```json
"test": "jest"
```

- [ ] **Step 4: Create shared types**

Create `types/index.ts`:
```typescript
export interface YoutubeStats {
  subscribers: number
  subscriberDelta: number
  viewsThisMonth: number
  watchTimeHours: number
  videosThisMonth: number
}

export interface YoutubeVideo {
  id: string
  title: string
  publishedAt: string
  views: number
  ctr: number
  avgViewDurationSeconds: number
  leads: number
}

export interface YoutubeData {
  stats: YoutubeStats
  topVideos: YoutubeVideo[]
  insights: string[]  // computed server-side in API route
}

export interface InstagramStats {
  followers: number
  followerDelta: number
  reachThisMonth: number
  impressionsThisMonth: number
  engagementRate: number
  leadVelocity: number[]  // [week1, week2, week3, week4] leads count
  tokenExpiresAt: string | null  // ISO date or null if unknown
}

export interface InstagramPost {
  id: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  timestamp: string
  likeCount: number
  commentsCount: number
  reach: number
  savedCount: number
}

export interface InstagramData {
  stats: InstagramStats
  posts: InstagramPost[]
  insights: string[]  // computed server-side in API route
}

export interface Lead {
  date: string
  email: string
  name: string
  videoSource: string
  week: 1 | 2 | 3 | 4
}

export interface LeadsData {
  totalThisMonth: number
  byVideoSource: { source: string; count: number; conversionRate?: number }[]
  recentLeads: Lead[]
}

export interface RefreshData {
  youtube: YoutubeData
  instagram: InstagramData
  leads: LeadsData
  updatedAt: string
}
```

- [ ] **Step 5: Create .env.local**

Create `.env.local`:
```
YOUTUBE_API_KEY=
YOUTUBE_CHANNEL_ID=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=

INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_ACCOUNT_ID=

GOOGLE_SHEETS_ID=
GOOGLE_SERVICE_ACCOUNT_JSON=
```

Copy values from `/Users/cris/Desktop/claude-brain/dashboard/.env`.

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: `ready on http://localhost:3000` with no errors.

- [ ] **Step 7: Commit**

```bash
git init && git add -A
git commit -m "feat: scaffold Next.js 14 creator dashboard"
```

---

## Task 2: ICP data + static page

**Files:**
- Create: `data/icp.json`
- Create: `app/icp/page.tsx`

- [ ] **Step 1: Create ICP JSON**

Create `data/icp.json`:
```json
{
  "baseProfile": {
    "revenue": "5.000€ – 50.000€/mes",
    "platform": "Shopify",
    "esp": "Klaviyo",
    "tenure": "6–12 meses mínimo",
    "advertising": "Meta Ads recurrente"
  },
  "awarenessLevel": "ALTO — sabe que tiene el problema. Conoce LTV, CAC, flows, segmentación. No ha encontrado quién lo implemente bien.",
  "notFor": "Quienes están montando su tienda o curiosos de Claude.",
  "symptoms": [
    "Mis anuncios funcionan pero cada venta me cuesta más cada mes",
    "Tengo lista de email pero no la trabajo o no convierte nada",
    "Los clientes compran una vez y desaparecen",
    "Facturo pero cuando miro el margen real no gano lo que debería",
    "Tengo el carrito abandonado puesto pero poco más",
    "No sé qué segmentos trabajar ni cómo",
    "Mi welcome email es el de por defecto de Klaviyo",
    "No sé qué producto me genera más clientes recurrentes"
  ],
  "painMetrics": [
    "LTV (life time value) — no sube aunque vendan más",
    "CAC (coste de adquisición) — sube cada mes con Meta Ads",
    "Tasa de repetición — por debajo del 15-20% es señal de alarma",
    "AOV (average order value) — estancado, sin upsell activo",
    "Open rate — lista dormida, por debajo del 20%",
    "Tasa de conversión web — tráfico que no compra",
    "Cohortes — no saben qué producto genera cliente recurrente"
  ],
  "missingSystems": [
    "Welcome series que segmenta y pre-educa",
    "Flujo de recompra por tiempo de uso del producto",
    "Segmento VIP activo con trato diferenciado",
    "Winback (reactivación de clientes dormidos)"
  ]
}
```

- [ ] **Step 2: Create ICP page**

Create `app/icp/page.tsx`:
```tsx
import icp from '@/data/icp.json'

export default function IcpPage() {
  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">ICP — Dueño de ecom que factura</h1>
        <p className="text-sm text-zinc-500">Perfil del cliente ideal de la Agencia</p>
      </div>

      <Section title="Perfil base">
        <dl className="grid grid-cols-2 gap-3">
          {Object.entries(icp.baseProfile).map(([k, v]) => (
            <div key={k} className="bg-zinc-900 rounded-lg p-3">
              <dt className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{k}</dt>
              <dd className="text-sm text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Nivel de conciencia">
        <p className="text-sm text-zinc-300">{icp.awarenessLevel}</p>
        <p className="text-xs text-red-400 mt-2">⚠ {icp.notFor}</p>
      </Section>

      <Section title="Síntomas que reconoce">
        <ul className="space-y-2">
          {icp.symptoms.map((s) => (
            <li key={s} className="text-sm text-zinc-300 flex gap-2">
              <span className="text-zinc-600 shrink-0">"</span>{s}<span className="text-zinc-600">"</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Métricas que le duelen">
        <ul className="space-y-1">
          {icp.painMetrics.map((m) => (
            <li key={m} className="text-sm text-zinc-300 flex gap-2 items-start">
              <span className="text-rose-500 shrink-0 mt-0.5">▸</span>{m}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Sistemas que no tiene">
        <ul className="space-y-1">
          {icp.missingSystems.map((s) => (
            <li key={s} className="text-sm text-zinc-300 flex gap-2 items-start">
              <span className="text-violet-500 shrink-0 mt-0.5">▸</span>{s}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">{title}</h2>
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Verify page renders**

```bash
npm run dev
```

Open http://localhost:3000/icp — should show the full ICP.

- [ ] **Step 4: Commit**

```bash
git add data/icp.json app/icp/page.tsx
git commit -m "feat: add ICP static data and page"
```

---

## Task 3: Sidebar layout + root structure

**Files:**
- Create: `components/Sidebar.tsx`
- Modify: `app/layout.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Create Sidebar component**

Create `components/Sidebar.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/youtube', label: 'YouTube', emoji: '▶️' },
  { href: '/instagram', label: 'Instagram', emoji: '📸' },
  { href: '/leads', label: 'Leads', emoji: '🎯' },
  { href: '/icp', label: 'ICP', emoji: '👤' },
]

export default function Sidebar({
  onRefresh,
  updatedAt,
  isRefreshing,
}: {
  onRefresh: () => void
  updatedAt: string | null
  isRefreshing: boolean
}) {
  const pathname = usePathname()

  return (
    <aside className="w-48 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="text-sm font-bold text-white tracking-wide">CRIS OS</div>
        <div className="text-xs text-zinc-600 mt-0.5">Creator Dashboard</div>
      </div>

      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {NAV.map(({ href, label, emoji }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-violet-950 text-violet-300 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <span className="text-base leading-none">{emoji}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-zinc-800 space-y-2">
        {updatedAt && (
          <p className="text-xs text-zinc-600">
            Actualizado: {updatedAt}
          </p>
        )}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full bg-violet-700 hover:bg-violet-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold py-2 px-3 rounded-md transition-colors"
        >
          {isRefreshing ? '⟳ Actualizando…' : '↻ Actualizar todo'}
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Update root layout**

Replace `app/layout.tsx`:
```tsx
'use client'

import { useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import type { RefreshData } from '@/types'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RefreshData | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/refresh')
      if (!res.ok) throw new Error('Refresh failed')
      const json: RefreshData = await res.json()
      setData(json)
      setUpdatedAt(new Date(json.updatedAt).toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit'
      }))
    } catch (e) {
      console.error(e)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  return (
    <html lang="es">
      <body className="bg-zinc-950 text-white flex min-h-screen">
        <Sidebar onRefresh={handleRefresh} updatedAt={updatedAt} isRefreshing={isRefreshing} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Root redirect**

Create `app/page.tsx`:
```tsx
import { redirect } from 'next/navigation'
export default function Home() { redirect('/youtube') }
```

- [ ] **Step 4: Verify layout renders**

```bash
npm run dev
```

Open http://localhost:3000 — should redirect to /youtube with sidebar visible (page content empty for now).

- [ ] **Step 5: Commit**

```bash
git add components/Sidebar.tsx app/layout.tsx app/page.tsx
git commit -m "feat: add sidebar layout and root redirect"
```

---

## Task 4: Shared UI components

**Files:**
- Create: `components/KpiCard.tsx`
- Create: `components/DataTable.tsx`
- Create: `components/IcpInsightBox.tsx`
- Create: `components/TokenAlert.tsx`

- [ ] **Step 1: KpiCard**

Create `components/KpiCard.tsx`:
```tsx
export default function KpiCard({
  label,
  value,
  delta,
  deltaPositive,
}: {
  label: string
  value: string | number
  delta?: string
  deltaPositive?: boolean
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {delta && (
        <p className={`text-xs mt-1.5 ${deltaPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {deltaPositive ? '▲' : '▼'} {delta}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: DataTable**

Create `components/DataTable.tsx`:
```tsx
export interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  align?: 'left' | 'right'
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  title,
}: {
  columns: Column<T>[]
  rows: T[]
  title: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`pb-2 text-xs text-zinc-600 font-medium border-b border-zinc-800 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-zinc-800 last:border-0">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`py-2.5 text-zinc-300 ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: IcpInsightBox**

Create `components/IcpInsightBox.tsx`:
```tsx
export default function IcpInsightBox({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null
  return (
    <div className="bg-violet-950/30 border border-violet-800/40 rounded-xl p-4 space-y-2">
      <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">🧠 Análisis ICP</p>
      {insights.map((text, i) => (
        <p key={i} className="text-sm text-zinc-400 leading-relaxed">{text}</p>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: TokenAlert**

Create `components/TokenAlert.tsx`:
```tsx
export default function TokenAlert({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null

  const daysLeft = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  if (daysLeft > 7) return null

  return (
    <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-3 flex items-center gap-3">
      <span className="text-amber-400 text-base">⚠️</span>
      <p className="text-sm text-amber-300">
        El access token de Instagram caduca en <strong>{daysLeft} días</strong>. Renuévalo en Meta for Developers.
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/
git commit -m "feat: add KpiCard, DataTable, IcpInsightBox, TokenAlert components"
```

---

## Task 5: YouTube lib + tests

**Files:**
- Create: `lib/youtube.ts`
- Create: `__tests__/lib/youtube.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/youtube.test.ts`:
```typescript
import { getOAuthAccessToken, filterLongFormVideos, computeYoutubeInsights } from '@/lib/youtube'

describe('filterLongFormVideos', () => {
  it('keeps videos longer than 60 seconds (ISO 8601 duration)', () => {
    const videos = [
      { id: 'a', durationIso: 'PT45S' },   // 45s short → excluded
      { id: 'b', durationIso: 'PT2M30S' }, // 2m30s long → included
      { id: 'c', durationIso: 'PT1M' },    // exactly 60s → excluded
      { id: 'd', durationIso: 'PT1M1S' },  // 61s → included
    ]
    const result = filterLongFormVideos(videos)
    expect(result.map(v => v.id)).toEqual(['b', 'd'])
  })
})

describe('computeYoutubeInsights', () => {
  it('flags videos with high views but no leads', () => {
    const videos = [{ id: 'a', title: 'Test', views: 3000, leads: 0, ctr: 5, avgViewDurationSeconds: 300, publishedAt: '', }]
    const insights = computeYoutubeInsights(videos)
    expect(insights.some(i => i.includes('CTA'))).toBe(true)
  })

  it('flags top lead-generating video', () => {
    const videos = [
      { id: 'a', title: 'Video A', views: 1000, leads: 8, ctr: 5, avgViewDurationSeconds: 300, publishedAt: '' },
      { id: 'b', title: 'Video B', views: 500, leads: 2, ctr: 3, avgViewDurationSeconds: 200, publishedAt: '' },
    ]
    const insights = computeYoutubeInsights(videos)
    expect(insights.some(i => i.includes('Video A'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- --testPathPattern=youtube
```

Expected: FAIL (lib/youtube not found).

- [ ] **Step 3: Implement lib/youtube.ts**

Create `lib/youtube.ts`:
```typescript
import type { YoutubeData, YoutubeVideo, YoutubeStats } from '@/types'

// Parse ISO 8601 duration (PT2M30S) to seconds
export function parseDurationSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const h = parseInt(match[1] ?? '0')
  const m = parseInt(match[2] ?? '0')
  const s = parseInt(match[3] ?? '0')
  return h * 3600 + m * 60 + s
}

export function filterLongFormVideos<T extends { durationIso: string }>(videos: T[]): T[] {
  return videos.filter(v => parseDurationSeconds(v.durationIso) > 60)
}

export async function getOAuthAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  })
  const json = await res.json()
  if (!json.access_token) throw new Error('YouTube OAuth failed: ' + JSON.stringify(json))
  return json.access_token as string
}

export function computeYoutubeInsights(videos: YoutubeVideo[]): string[] {
  const insights: string[] = []
  if (videos.length === 0) return insights

  // Top lead generator
  const topByLeads = [...videos].sort((a, b) => b.leads - a.leads)[0]
  if (topByLeads.leads > 0) {
    insights.push(`"${topByLeads.title}" es tu vídeo con más leads este mes (${topByLeads.leads}). Repite el tema y el formato.`)
  }

  // High views, zero leads
  const avgViews = videos.reduce((s, v) => s + v.views, 0) / videos.length
  const highViewsNoLeads = videos.filter(v => v.views > avgViews * 1.5 && v.leads === 0)
  if (highViewsNoLeads.length > 0) {
    insights.push(`${highViewsNoLeads.length} vídeo(s) tienen muchas vistas pero 0 leads — revisa el CTA o si el tema encaja con tu ICP.`)
  }

  // High CTR + leads = winning format
  const winners = videos.filter(v => v.ctr > 6 && v.leads > 0)
  if (winners.length > 0) {
    insights.push(`CTR > 6% con leads: formato ganador para tu ICP. Mantén thumbnails y títulos similares.`)
  }

  return insights
}

export async function fetchYoutubeData(leadsByVideoId: Record<string, number>): Promise<YoutubeData> {
  const apiKey = process.env.YOUTUBE_API_KEY!
  const channelId = process.env.YOUTUBE_CHANNEL_ID!
  const accessToken = await getOAuthAccessToken()

  // 1. Channel stats
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`
  )
  const channelJson = await channelRes.json()
  const stats = channelJson.items[0].statistics

  // 2. Videos uploaded in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&type=video&publishedAfter=${thirtyDaysAgo}&maxResults=50&key=${apiKey}`
  )
  const searchJson = await searchRes.json()
  const videoIds: string[] = (searchJson.items ?? []).map((i: { id: { videoId: string } }) => i.id.videoId)

  if (videoIds.length === 0) {
    return {
      stats: {
        subscribers: parseInt(stats.subscriberCount),
        subscriberDelta: 0,
        viewsThisMonth: 0,
        watchTimeHours: 0,
        videosThisMonth: 0,
      },
      topVideos: [],
    }
  }

  // 3. Video details (filter long-form)
  const detailsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds.join(',')}&key=${apiKey}`
  )
  const detailsJson = await detailsRes.json()

  const rawVideos = (detailsJson.items ?? []).map((item: {
    id: string
    snippet: { title: string; publishedAt: string }
    statistics: { viewCount: string }
    contentDetails: { duration: string }
  }) => ({
    id: item.id,
    title: item.snippet.title,
    publishedAt: item.snippet.publishedAt,
    views: parseInt(item.statistics.viewCount ?? '0'),
    durationIso: item.contentDetails.duration,
  }))

  const longFormRaw = filterLongFormVideos(rawVideos)

  // 4. Analytics: CTR + avg view duration per video
  const analyticsRes = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel%3D%3DMINE` +
    `&metrics=views,estimatedMinutesWatched,averageViewDuration,impressionClickThroughRate` +
    `&dimensions=video` +
    `&startDate=${thirtyDaysAgo.split('T')[0]}` +
    `&endDate=${new Date().toISOString().split('T')[0]}` +
    `&filters=video%3D%3D${longFormRaw.map(v => v.id).join('%2C')}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const analyticsJson = await analyticsRes.json()

  // Map analytics by video id
  const analyticsMap: Record<string, { ctr: number; avgDuration: number; watchMinutes: number }> = {}
  for (const row of (analyticsJson.rows ?? [])) {
    // columns: video, views, estimatedMinutesWatched, averageViewDuration, impressionClickThroughRate
    analyticsMap[row[0]] = {
      watchMinutes: row[2],
      avgDuration: row[3],
      ctr: row[4] * 100, // convert to percentage
    }
  }

  const totalWatchHours = Object.values(analyticsMap).reduce((s, v) => s + v.watchMinutes, 0) / 60

  const topVideos: YoutubeVideo[] = longFormRaw
    .map(v => ({
      id: v.id,
      title: v.title,
      publishedAt: v.publishedAt,
      views: v.views,
      ctr: parseFloat((analyticsMap[v.id]?.ctr ?? 0).toFixed(1)),
      avgViewDurationSeconds: analyticsMap[v.id]?.avgDuration ?? 0,
      leads: leadsByVideoId[v.id] ?? 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)

  return {
    stats: {
      subscribers: parseInt(stats.subscriberCount),
      subscriberDelta: 0, // YouTube API doesn't give delta directly — shown as 0
      viewsThisMonth: longFormRaw.reduce((s, v) => s + v.views, 0),
      watchTimeHours: Math.round(totalWatchHours),
      videosThisMonth: longFormRaw.length,
    },
    topVideos,
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --testPathPattern=youtube
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/youtube.ts __tests__/lib/youtube.test.ts
git commit -m "feat: YouTube lib with long-form filter and ICP insights"
```

---

## Task 6: Instagram lib + tests

**Files:**
- Create: `lib/instagram.ts`
- Create: `__tests__/lib/instagram.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/instagram.test.ts`:
```typescript
import { computeLeadVelocity, computeInstagramInsights, getDaysUntilExpiry } from '@/lib/instagram'
import type { Lead } from '@/types'

const makeDate = (daysAgo: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

describe('computeLeadVelocity', () => {
  it('counts leads per week of current month', () => {
    const leads: Lead[] = [
      { date: makeDate(2), email: 'a@a.com', name: 'A', videoSource: 'vid1', week: 4 },
      { date: makeDate(2), email: 'b@b.com', name: 'B', videoSource: 'vid1', week: 4 },
      { date: makeDate(10), email: 'c@c.com', name: 'C', videoSource: 'vid2', week: 3 },
    ]
    const velocity = computeLeadVelocity(leads)
    expect(velocity).toHaveLength(4)
    expect(velocity[3]).toBe(2) // week 4 = last 7 days
    expect(velocity[2]).toBe(1) // week 3
  })
})

describe('getDaysUntilExpiry', () => {
  it('returns null for null input', () => {
    expect(getDaysUntilExpiry(null)).toBeNull()
  })
  it('returns days remaining for future date', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    const days = getDaysUntilExpiry(future)
    expect(days).toBe(5)
  })
})

describe('computeInstagramInsights', () => {
  it('returns low velocity warning when leads < 3 in most recent week', () => {
    const insights = computeInstagramInsights([1, 0, 1, 0])
    expect(insights.some(i => i.toLowerCase().includes('lead'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- --testPathPattern=instagram
```

Expected: FAIL.

- [ ] **Step 3: Implement lib/instagram.ts**

Create `lib/instagram.ts`:
```typescript
import type { InstagramData, InstagramPost, InstagramStats, Lead } from '@/types'

export function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function computeLeadVelocity(leads: Lead[]): number[] {
  // Returns [week1, week2, week3, week4] lead counts for current month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const velocity = [0, 0, 0, 0]
  for (const lead of leads) {
    const d = new Date(lead.date)
    if (d < monthStart) continue
    const dayOfMonth = d.getDate()
    const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 3)
    velocity[weekIndex]++
  }
  return velocity
}

export function computeInstagramInsights(leadVelocity: number[]): string[] {
  const insights: string[] = []
  const lastWeek = leadVelocity[3] ?? 0
  const total = leadVelocity.reduce((s, n) => s + n, 0)

  if (total === 0) {
    insights.push('No hay leads desde Instagram este mes. Revisa que el link del formulario Tally esté activo en tu bio y en las stories.')
  } else if (lastWeek < 3) {
    insights.push(`Última semana: ${lastWeek} lead(s). Añade un CTA directo al formulario en el próximo reel.`)
  } else {
    insights.push(`Lead velocity estable: ${lastWeek} leads esta semana. Mantén la frecuencia de publicación.`)
  }

  return insights
}

export async function fetchInstagramData(leads: Lead[]): Promise<InstagramData> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN!
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID!
  const BASE = `https://graph.facebook.com/v19.0`

  // 1. Account insights (followers, reach, impressions)
  const insightsRes = await fetch(
    `${BASE}/${accountId}/insights?metric=reach,impressions&period=month&access_token=${token}`
  )
  const insightsJson = await insightsRes.json()

  const reach = (insightsJson.data ?? []).find((d: { name: string }) => d.name === 'reach')?.values?.slice(-1)[0]?.value ?? 0
  const impressions = (insightsJson.data ?? []).find((d: { name: string }) => d.name === 'impressions')?.values?.slice(-1)[0]?.value ?? 0

  // 2. Followers
  const profileRes = await fetch(
    `${BASE}/${accountId}?fields=followers_count&access_token=${token}`
  )
  const profileJson = await profileRes.json()
  const followers = profileJson.followers_count ?? 0

  // 3. Token expiry check
  const debugRes = await fetch(
    `${BASE}/debug_token?input_token=${token}&access_token=${token}`
  )
  const debugJson = await debugRes.json()
  const expiresAt = debugJson.data?.expires_at
    ? new Date(debugJson.data.expires_at * 1000).toISOString()
    : null

  // 4. Media list (last 20)
  const mediaRes = await fetch(
    `${BASE}/${accountId}/media?fields=id,media_type,timestamp,like_count,comments_count&limit=20&access_token=${token}`
  )
  const mediaJson = await mediaRes.json()

  // 5. Per-media reach (requires individual insight calls — batch for top 5)
  const posts: InstagramPost[] = (mediaJson.data ?? []).map((item: {
    id: string
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
    timestamp: string
    like_count: number
    comments_count: number
  }) => ({
    id: item.id,
    mediaType: item.media_type,
    timestamp: item.timestamp,
    likeCount: item.like_count ?? 0,
    commentsCount: item.comments_count ?? 0,
    reach: 0,       // filled in below for top posts
    savedCount: 0,
  }))

  // Fetch reach for each post individually (IG API requires this)
  for (const post of posts.slice(0, 10)) {
    try {
      const r = await fetch(
        `${BASE}/${post.id}/insights?metric=reach,saved&access_token=${token}`
      )
      const rj = await r.json()
      post.reach = (rj.data ?? []).find((d: { name: string }) => d.name === 'reach')?.values?.[0]?.value ?? 0
      post.savedCount = (rj.data ?? []).find((d: { name: string }) => d.name === 'saved')?.values?.[0]?.value ?? 0
    } catch {
      // non-critical, leave as 0
    }
  }

  const totalLikes = posts.reduce((s, p) => s + p.likeCount, 0)
  const totalComments = posts.reduce((s, p) => s + p.commentsCount, 0)
  const engagementRate = followers > 0
    ? parseFloat(((totalLikes + totalComments) / followers * 100).toFixed(2))
    : 0

  const velocity = computeLeadVelocity(leads)

  const statsResult: InstagramStats = {
    followers,
    followerDelta: 0, // IG API doesn't provide delta without historical data
    reachThisMonth: reach,
    impressionsThisMonth: impressions,
    engagementRate,
    leadVelocity: velocity,
    tokenExpiresAt: expiresAt,
  }

  return { stats: statsResult, posts }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --testPathPattern=instagram
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/instagram.ts __tests__/lib/instagram.test.ts
git commit -m "feat: Instagram lib with token expiry, lead velocity, and ICP insights"
```

---

## Task 7: Google Sheets lib (Tally leads) + tests

**Files:**
- Create: `lib/sheets.ts`
- Create: `__tests__/lib/sheets.test.ts`

**Note:** The Google Sheet columns depend on your Tally form. Assumed structure: Column A = Timestamp, Column B = Name, Column C = Email, Column D = UTM source (video slug). **Adjust `COLUMNS` constant in `lib/sheets.ts` if yours differ.**

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/sheets.test.ts`:
```typescript
import { parseSheetRows, extractVideoSlug, groupByVideoSource } from '@/lib/sheets'

describe('extractVideoSlug', () => {
  it('extracts UTM source from full URL', () => {
    expect(extractVideoSlug('https://tally.so/r/abc?utm_source=video-fichas-producto'))
      .toBe('video-fichas-producto')
  })
  it('returns raw value if not a URL', () => {
    expect(extractVideoSlug('video-carritos')).toBe('video-carritos')
  })
  it('returns empty string for empty input', () => {
    expect(extractVideoSlug('')).toBe('')
  })
})

describe('parseSheetRows', () => {
  it('converts raw sheet rows to Lead objects', () => {
    const now = new Date()
    const rows = [
      [now.toISOString(), 'Pepe García', 'pepe@shop.com', 'video-fichas-producto'],
    ]
    const leads = parseSheetRows(rows)
    expect(leads).toHaveLength(1)
    expect(leads[0].email).toBe('pepe@shop.com')
    expect(leads[0].videoSource).toBe('video-fichas-producto')
    expect([1, 2, 3, 4]).toContain(leads[0].week)
  })

  it('skips rows with missing email', () => {
    const rows = [['2026-01-01', 'Name', '', 'source']]
    const leads = parseSheetRows(rows)
    expect(leads).toHaveLength(0)
  })
})

describe('groupByVideoSource', () => {
  it('counts and sorts leads by source', () => {
    const leads = [
      { videoSource: 'vid-a', date: '', email: 'a@a.com', name: 'A', week: 1 as const },
      { videoSource: 'vid-a', date: '', email: 'b@b.com', name: 'B', week: 1 as const },
      { videoSource: 'vid-b', date: '', email: 'c@c.com', name: 'C', week: 1 as const },
    ]
    const grouped = groupByVideoSource(leads)
    expect(grouped[0]).toEqual({ source: 'vid-a', count: 2, conversionRate: undefined })
    expect(grouped[1]).toEqual({ source: 'vid-b', count: 1, conversionRate: undefined })
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- --testPathPattern=sheets
```

Expected: FAIL.

- [ ] **Step 3: Implement lib/sheets.ts**

Create `lib/sheets.ts`:
```typescript
import { google } from 'googleapis'
import type { Lead, LeadsData } from '@/types'

// Adjust column indices to match your Tally sheet structure
const COLUMNS = {
  timestamp: 0,
  name: 1,
  email: 2,
  utmSource: 3,
}

export function extractVideoSlug(raw: string): string {
  if (!raw) return ''
  try {
    const url = new URL(raw)
    return url.searchParams.get('utm_source') ?? raw
  } catch {
    return raw
  }
}

export function parseSheetRows(rows: string[][]): Lead[] {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  return rows
    .filter(row => row[COLUMNS.email]?.trim())
    .map(row => {
      const date = new Date(row[COLUMNS.timestamp])
      const dayOfMonth = date.getDate()
      const week = Math.min(Math.floor((dayOfMonth - 1) / 7) + 1, 4) as 1 | 2 | 3 | 4
      return {
        date: date.toISOString().split('T')[0],
        name: row[COLUMNS.name] ?? '',
        email: row[COLUMNS.email] ?? '',
        videoSource: extractVideoSlug(row[COLUMNS.utmSource] ?? ''),
        week,
      }
    })
    .filter(lead => new Date(lead.date) >= monthStart)
}

export function groupByVideoSource(
  leads: Lead[]
): { source: string; count: number; conversionRate?: number }[] {
  const map = new Map<string, number>()
  for (const lead of leads) {
    map.set(lead.videoSource, (map.get(lead.videoSource) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([source, count]) => ({ source, count, conversionRate: undefined }))
    .sort((a, b) => b.count - a.count)
}

export async function fetchLeadsData(): Promise<LeadsData> {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID!,
    range: 'A2:Z',  // skip header row; adjust sheet name if needed e.g. 'Sheet1!A2:Z'
  })

  const rows = (res.data.values ?? []) as string[][]
  const leads = parseSheetRows(rows)
  const byVideoSource = groupByVideoSource(leads)

  return {
    totalThisMonth: leads.length,
    byVideoSource,
    recentLeads: leads.slice(-20).reverse(),
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --testPathPattern=sheets
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/sheets.ts __tests__/lib/sheets.test.ts
git commit -m "feat: Google Sheets lib for Tally leads with UTM parsing"
```

---

## Task 8: API routes

**Files:**
- Create: `app/api/youtube/route.ts`
- Create: `app/api/instagram/route.ts`
- Create: `app/api/leads/route.ts`
- Create: `app/api/refresh/route.ts`

- [ ] **Step 1: YouTube route**

Create `app/api/youtube/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { fetchLeadsData } from '@/lib/sheets'
import { fetchYoutubeData, computeYoutubeInsights } from '@/lib/youtube'

export async function GET() {
  try {
    const leadsData = await fetchLeadsData()
    const leadsByVideoId: Record<string, number> = {}
    for (const { source, count } of leadsData.byVideoSource) {
      leadsByVideoId[source] = count
    }
    const data = await fetchYoutubeData(leadsByVideoId)
    // Insights computed server-side so client components don't import server-only lib
    return NextResponse.json({ ...data, insights: computeYoutubeInsights(data.topVideos) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

- [ ] **Step 2: Instagram route**

Create `app/api/instagram/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { fetchLeadsData } from '@/lib/sheets'
import { fetchInstagramData, computeInstagramInsights } from '@/lib/instagram'

export async function GET() {
  try {
    const leadsData = await fetchLeadsData()
    const data = await fetchInstagramData(leadsData.recentLeads)
    return NextResponse.json({ ...data, insights: computeInstagramInsights(data.stats.leadVelocity) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

- [ ] **Step 3: Leads route**

Create `app/api/leads/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { fetchLeadsData } from '@/lib/sheets'

export async function GET() {
  try {
    const data = await fetchLeadsData()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

- [ ] **Step 4: Refresh route (parallel)**

Create `app/api/refresh/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { fetchLeadsData } from '@/lib/sheets'
import { fetchYoutubeData } from '@/lib/youtube'
import { fetchInstagramData } from '@/lib/instagram'
import type { RefreshData } from '@/types'

export async function GET() {
  try {
    // Fetch leads first (needed for cross-reference in YT and IG)
    const leadsData = await fetchLeadsData()

    const leadsByVideoId: Record<string, number> = {}
    for (const { source, count } of leadsData.byVideoSource) {
      leadsByVideoId[source] = count
    }

    // Fetch YT and IG in parallel
    const [youtube, instagram] = await Promise.all([
      fetchYoutubeData(leadsByVideoId),
      fetchInstagramData(leadsData.recentLeads),
    ])

    const result: RefreshData = {
      youtube,
      instagram,
      leads: leadsData,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/
git commit -m "feat: add API routes for YouTube, Instagram, leads, and parallel refresh"
```

---

## Task 9: YouTube page

**Files:**
- Create: `app/youtube/page.tsx`

- [ ] **Step 1: Create YouTube page**

Create `app/youtube/page.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import KpiCard from '@/components/KpiCard'
import DataTable, { type Column } from '@/components/DataTable'
import IcpInsightBox from '@/components/IcpInsightBox'
import type { YoutubeData, YoutubeVideo } from '@/types'

const COLUMNS: Column<YoutubeVideo>[] = [
  {
    key: 'title',
    label: 'Vídeo',
    render: (v) => (
      <span className="text-white text-xs leading-tight line-clamp-2 max-w-xs">{v as string}</span>
    ),
  },
  { key: 'views', label: 'Vistas', align: 'right',
    render: (v) => <span className="font-semibold">{Number(v).toLocaleString('es-ES')}</span> },
  { key: 'ctr', label: 'CTR', align: 'right',
    render: (v) => {
      const n = Number(v)
      return <span className={n >= 5 ? 'text-emerald-400' : n >= 3 ? 'text-amber-400' : 'text-zinc-400'}>{n.toFixed(1)}%</span>
    }
  },
  { key: 'avgViewDurationSeconds', label: 'Duración media', align: 'right',
    render: (v) => {
      const secs = Number(v)
      return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
    }
  },
  { key: 'leads', label: 'Leads', align: 'right',
    render: (v) => (
      <span className={Number(v) > 0 ? 'text-violet-400 font-bold' : 'text-zinc-600'}>{v as number}</span>
    )
  },
]

export default function YoutubePage() {
  const [data, setData] = useState<YoutubeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/youtube')
      if (!res.ok) throw new Error('Error cargando YouTube')
      setData(await res.json())
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="p-8 text-zinc-500 text-sm">Cargando YouTube…</div>
  if (error) return <div className="p-8 text-rose-400 text-sm">Error: {error}</div>
  if (!data) return <div className="p-8 text-zinc-600 text-sm">Pulsa "Actualizar todo" para ver los datos.</div>

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">YouTube — Agencia</h1>
        <p className="text-xs text-zinc-500 mt-1">Últimos 30 días · Solo vídeos largos</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Suscriptores" value={data.stats.subscribers.toLocaleString('es-ES')} />
        <KpiCard label="Vistas / mes" value={data.stats.viewsThisMonth.toLocaleString('es-ES')} />
        <KpiCard label="Watch time" value={`${data.stats.watchTimeHours}h`} />
        <KpiCard label="Vídeos largos" value={data.stats.videosThisMonth} />
      </div>

      <DataTable columns={COLUMNS} rows={data.topVideos} title="Top vídeos largos del mes" />

      <IcpInsightBox insights={data.insights} />
    </div>
  )
}
```

- [ ] **Step 2: Verify page renders with real data**

```bash
npm run dev
```

Open http://localhost:3000/youtube. Click the refresh button or wait for initial load. Verify YouTube data appears.

- [ ] **Step 3: Commit**

```bash
git add app/youtube/page.tsx
git commit -m "feat: YouTube page with KPIs, video table, and ICP insights"
```

---

## Task 10: Instagram page

**Files:**
- Create: `app/instagram/page.tsx`

- [ ] **Step 1: Create Instagram page**

Create `app/instagram/page.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import KpiCard from '@/components/KpiCard'
import DataTable, { type Column } from '@/components/DataTable'
import IcpInsightBox from '@/components/IcpInsightBox'
import TokenAlert from '@/components/TokenAlert'
import type { InstagramData, InstagramPost } from '@/types'

const COLUMNS: Column<InstagramPost>[] = [
  { key: 'mediaType', label: 'Tipo', render: (v) => {
    const icons = { VIDEO: '🎬', IMAGE: '🖼️', CAROUSEL_ALBUM: '📑' }
    return icons[v as keyof typeof icons] ?? v
  }},
  { key: 'timestamp', label: 'Fecha', render: (v) =>
    new Date(v as string).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  },
  { key: 'likeCount', label: 'Likes', align: 'right',
    render: (v) => <span className="font-semibold">{Number(v).toLocaleString('es-ES')}</span> },
  { key: 'commentsCount', label: 'Comentarios', align: 'right' },
  { key: 'reach', label: 'Alcance', align: 'right',
    render: (v) => Number(v).toLocaleString('es-ES') },
  { key: 'savedCount', label: 'Guardados', align: 'right',
    render: (v) => <span className={Number(v) > 10 ? 'text-violet-400' : ''}>{v as number}</span> },
]

function LeadVelocityBar({ velocity }: { velocity: number[] }) {
  const max = Math.max(...velocity, 1)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Lead velocity — semanas del mes</h3>
      <div className="flex gap-3 items-end h-16">
        {velocity.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-violet-400">{v}</span>
            <div
              className="w-full bg-violet-700 rounded-t-md transition-all"
              style={{ height: `${(v / max) * 48}px`, minHeight: v > 0 ? '4px' : '2px', opacity: v > 0 ? 1 : 0.2 }}
            />
            <span className="text-xs text-zinc-600">S{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InstagramPage() {
  const [data, setData] = useState<InstagramData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/instagram')
      if (!res.ok) throw new Error('Error cargando Instagram')
      setData(await res.json())
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="p-8 text-zinc-500 text-sm">Cargando Instagram…</div>
  if (error) return <div className="p-8 text-rose-400 text-sm">Error: {error}</div>
  if (!data) return <div className="p-8 text-zinc-600 text-sm">Pulsa "Actualizar todo" para ver los datos.</div>

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Instagram</h1>
        <p className="text-xs text-zinc-500 mt-1">Últimos 30 días</p>
      </div>

      <TokenAlert expiresAt={data.stats.tokenExpiresAt} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Seguidores" value={data.stats.followers.toLocaleString('es-ES')} />
        <KpiCard label="Alcance / mes" value={data.stats.reachThisMonth.toLocaleString('es-ES')} />
        <KpiCard label="Impresiones" value={data.stats.impressionsThisMonth.toLocaleString('es-ES')} />
        <KpiCard label="Engagement" value={`${data.stats.engagementRate}%`} />
      </div>

      <LeadVelocityBar velocity={data.stats.leadVelocity} />

      <DataTable columns={COLUMNS} rows={data.posts} title="Últimos 20 posts / reels" />

      <IcpInsightBox insights={data.insights} />
    </div>
  )
}
```

- [ ] **Step 2: Verify page**

Open http://localhost:3000/instagram after refresh — should show follower KPIs, lead velocity bar, posts table, and ICP insight.

- [ ] **Step 3: Commit**

```bash
git add app/instagram/page.tsx
git commit -m "feat: Instagram page with lead velocity bar and token alert"
```

---

## Task 11: Leads page

**Files:**
- Create: `app/leads/page.tsx`

- [ ] **Step 1: Create Leads page**

Create `app/leads/page.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import KpiCard from '@/components/KpiCard'
import DataTable, { type Column } from '@/components/DataTable'
import type { Lead, LeadsData } from '@/types'

const LEAD_COLUMNS: Column<Lead>[] = [
  { key: 'date', label: 'Fecha' },
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'videoSource', label: 'Vídeo origen',
    render: (v) => (
      <span className="text-violet-400 text-xs font-mono">{v as string}</span>
    )
  },
  { key: 'week', label: 'Semana', align: 'right',
    render: (v) => <span className="text-zinc-500">S{v as number}</span>
  },
]

export default function LeadsPage() {
  const [data, setData] = useState<LeadsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/leads')
      if (!res.ok) throw new Error('Error cargando leads')
      setData(await res.json())
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="p-8 text-zinc-500 text-sm">Cargando leads…</div>
  if (error) return <div className="p-8 text-rose-400 text-sm">Error: {error}</div>
  if (!data) return <div className="p-8 text-zinc-600 text-sm">Pulsa "Actualizar todo" para ver los datos.</div>

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Leads — Agencia</h1>
        <p className="text-xs text-zinc-500 mt-1">Mes en curso · Fuente: Tally via Google Sheets</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Total leads este mes" value={data.totalThisMonth} />
        <KpiCard label="Fuentes distintas" value={data.byVideoSource.length} />
      </div>

      {/* Ranking by video source */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Leads por vídeo origen</h3>
        <div className="space-y-2">
          {data.byVideoSource.map(({ source, count }, i) => {
            const max = data.byVideoSource[0]?.count ?? 1
            return (
              <div key={source} className="flex items-center gap-3">
                <span className="text-xs text-zinc-600 w-4">{i + 1}</span>
                <span className="text-xs text-zinc-300 w-48 truncate font-mono">{source}</span>
                <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="bg-violet-600 h-1.5 rounded-full"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-violet-400 w-6 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <DataTable columns={LEAD_COLUMNS} rows={data.recentLeads} title="Últimos leads (20)" />
    </div>
  )
}
```

- [ ] **Step 2: Verify page**

Open http://localhost:3000/leads — verify ranking and table render correctly.

- [ ] **Step 3: Commit**

```bash
git add app/leads/page.tsx
git commit -m "feat: Leads page with video source ranking and recent leads table"
```

---

## Task 12: Wire refresh button to global state + smoke test all pages

The sidebar's `onRefresh` is already wired in `layout.tsx`. The individual pages currently load on mount independently. This task verifies the full flow works end-to-end.

- [ ] **Step 1: Smoke test all pages locally**

```bash
npm run dev
```

Visit each page and verify they load without errors:
- http://localhost:3000/youtube
- http://localhost:3000/instagram
- http://localhost:3000/leads
- http://localhost:3000/icp

Click "Actualizar todo" — verify the sidebar shows a loading state and then "Actualizado: HH:MM".

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: full creator dashboard working locally"
```

---

## Task 13: Vercel deploy

- [ ] **Step 1: Create GitHub repo**

Go to github.com, create a new **private** repo named `creator-dashboard`. Then:

```bash
git remote add origin https://github.com/Crispemo/creator-dashboard.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Connect to Vercel**

1. Go to vercel.com → New Project
2. Import `Crispemo/creator-dashboard`
3. Framework: Next.js (auto-detected)
4. Root directory: `.` (leave default)
5. Click Deploy — it will fail because env vars are missing. That's expected.

- [ ] **Step 3: Add environment variables in Vercel**

In Vercel project → Settings → Environment Variables, add each variable from `.env.local`:

```
YOUTUBE_API_KEY
YOUTUBE_CHANNEL_ID
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_REFRESH_TOKEN
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_ACCOUNT_ID
GOOGLE_SHEETS_ID
GOOGLE_SERVICE_ACCOUNT_JSON    ← paste the full JSON as one line
```

For `GOOGLE_SERVICE_ACCOUNT_JSON`: the JSON must be on a single line. Run this to get it:
```bash
cat your-service-account-file.json | tr -d '\n'
```

- [ ] **Step 4: Setup Google Service Account (if not done yet)**

1. Go to console.cloud.google.com → new project → enable Google Sheets API
2. IAM → Service Accounts → Create → download JSON key
3. Share your Tally Google Sheet with the service account email (Editor or Viewer)
4. Paste the minified JSON into `GOOGLE_SERVICE_ACCOUNT_JSON` in Vercel

- [ ] **Step 5: Redeploy**

In Vercel → Deployments → Redeploy (or push any change to trigger):

```bash
echo "# Creator Dashboard" >> README.md
git add README.md && git commit -m "docs: add README"
git push
```

- [ ] **Step 6: Verify production**

Open your Vercel URL (e.g. `https://creator-dashboard-xxx.vercel.app`).

- All 4 pages load
- Click "Actualizar todo" — data populates within 10 seconds
- Instagram token alert appears if token expires in < 7 days

- [ ] **Step 7: Final commit**

```bash
git add -A && git commit -m "feat: Vercel deployment configured"
git push
```

---

## Post-deploy: Adjust Sheets column mapping

If the Tally → Google Sheets data has different column order than assumed, update `COLUMNS` in `lib/sheets.ts`:

```typescript
// Check your actual sheet — open it and count columns (0-indexed):
const COLUMNS = {
  timestamp: 0,  // Column A
  name: 1,       // Column B
  email: 2,      // Column C
  utmSource: 3,  // Column D — the UTM slug from the Tally form URL
}
```

After adjusting, run `npm test` and redeploy.
