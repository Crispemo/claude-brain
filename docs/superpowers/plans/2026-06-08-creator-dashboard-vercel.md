# Creator Dashboard Vercel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a Next.js 14 dashboard on Vercel that shows YouTube and Instagram metrics with per-piece analytics (multiplier vs average, engagement vs average, views by weekday), Tally leads, and an on-demand "Análisis Claude" card that turns all of it into content recommendations.

**Architecture:** Next.js 14 App Router with server-side API Routes for each data source (YouTube Data API + Analytics OAuth, Instagram Graph API, Google Sheets for Tally) plus an `/api/analyze` route that sends the combined payload + ICP to the Anthropic API. Client fetches from `/api/refresh` on button click; the result is shared via React Context so the Dashboard page can pass it to the Análisis Claude card. No database — all data pulled live, analysis not persisted.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, googleapis, recharts, @anthropic-ai/sdk, react-markdown, Vercel

---

## File Map

```
creator-dashboard/               ← new independent project
├── app/
│   ├── layout.tsx               # Root layout: Sidebar + RefreshContext provider
│   ├── page.tsx                 # Dashboard general: summary KPIs + AnalysisCard
│   ├── youtube/page.tsx         # YouTube section
│   ├── instagram/page.tsx       # Instagram section
│   ├── leads/page.tsx           # Leads section
│   └── icp/page.tsx             # ICP section
├── app/api/
│   ├── youtube/route.ts         # YouTube API route
│   ├── instagram/route.ts       # Instagram API route
│   ├── leads/route.ts           # Google Sheets API route
│   ├── refresh/route.ts         # Parallel refresh of all sources
│   └── analyze/route.ts         # Calls Claude with payload + ICP, returns markdown
├── components/
│   ├── Sidebar.tsx              # Nav + refresh button + last-updated
│   ├── KpiCard.tsx              # Single metric card
│   ├── DataTable.tsx            # Generic sortable table
│   ├── WeekdayChart.tsx         # Bar chart of views/reach by weekday (recharts)
│   ├── AnalysisCard.tsx         # "Análisis Claude" card, on-demand
│   └── TokenAlert.tsx           # Instagram token expiry banner
├── data/
│   └── icp.json                 # Static ICP definition
├── lib/
│   ├── refresh-context.tsx      # React Context sharing last RefreshData
│   ├── analytics.ts             # Shared multiplier/rate/weekday helpers
│   ├── youtube.ts                # YouTube Data + Analytics API calls
│   ├── instagram.ts             # Instagram Graph API calls
│   ├── sheets.ts                 # Google Sheets API (Tally responses)
│   └── analysis.ts              # Builds prompt + calls Anthropic API
├── types/
│   └── index.ts                 # Shared TypeScript types
├── __tests__/
│   ├── lib/analytics.test.ts
│   ├── lib/youtube.test.ts
│   ├── lib/instagram.test.ts
│   ├── lib/sheets.test.ts
│   └── lib/analysis.test.ts
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
npm install googleapis recharts @anthropic-ai/sdk react-markdown
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
export interface WeekdayMetric {
  day: string   // 'Dom' | 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb'
  value: number
}

export interface YoutubeStats {
  subscribers: number
  subscriberDelta: number
  viewsThisMonth: number
  watchTimeHours: number
  videosThisMonth: number
  weekdayViews: WeekdayMetric[]
}

export interface YoutubeVideo {
  id: string
  title: string
  publishedAt: string
  views: number
  ctr: number
  avgViewDurationSeconds: number
  leads: number
  multiplier: number       // views / average views of the period
  likeRate: number         // likes as % of views
  commentRate: number      // comments as % of views
  avgLikeRate: number      // average likeRate across the period
  avgCommentRate: number   // average commentRate across the period
}

export interface YoutubeData {
  stats: YoutubeStats
  topVideos: YoutubeVideo[]
}

export interface InstagramStats {
  followers: number
  followerDelta: number
  reachThisMonth: number
  impressionsThisMonth: number
  engagementRate: number
  leadVelocity: number[]  // [week1, week2, week3, week4] leads count
  tokenExpiresAt: string | null  // ISO date or null if unknown
  weekdayReach: WeekdayMetric[]
}

export interface InstagramPost {
  id: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  timestamp: string
  likeCount: number
  commentsCount: number
  reach: number
  savedCount: number
  shareCount: number
  multiplier: number       // reach / average reach of the period
  likeRate: number         // likes as % of reach
  saveRate: number         // saves as % of reach
  commentRate: number      // comments as % of reach
  shareRate: number        // shares as % of reach
  avgLikeRate: number
  avgSaveRate: number
  avgCommentRate: number
  avgShareRate: number
}

export interface InstagramData {
  stats: InstagramStats
  posts: InstagramPost[]
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

export interface AnalysisResponse {
  markdown: string
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

ANTHROPIC_API_KEY=
```

Copy values from `/Users/cris/Desktop/claude-brain/dashboard/.env`. For `ANTHROPIC_API_KEY`, use the same key as other Claude integrations in this repo (check `content-engine/.env` or `agencia/carousel-generator/.env`).

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

## Task 2: Analytics helpers (multiplier, engagement vs average, weekday)

**Files:**
- Create: `lib/analytics.ts`
- Create: `__tests__/lib/analytics.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/analytics.test.ts`:
```typescript
import { average, computeMultiplier, computeRate, computeWeekdayMetric } from '@/lib/analytics'

describe('average', () => {
  it('returns 0 for empty array', () => {
    expect(average([])).toBe(0)
  })
  it('returns the mean of values', () => {
    expect(average([10, 20, 30])).toBe(20)
  })
})

describe('computeMultiplier', () => {
  it('returns 0 when average is 0', () => {
    expect(computeMultiplier(100, 0)).toBe(0)
  })
  it('returns value/average rounded to 1 decimal', () => {
    expect(computeMultiplier(460, 100)).toBe(4.6)
    expect(computeMultiplier(30, 100)).toBe(0.3)
  })
})

describe('computeRate', () => {
  it('returns 0 when total is 0', () => {
    expect(computeRate(5, 0)).toBe(0)
  })
  it('returns part/total as a percentage rounded to 2 decimals', () => {
    expect(computeRate(3, 100)).toBe(3)
    expect(computeRate(1, 3)).toBe(33.33)
  })
})

describe('computeWeekdayMetric', () => {
  it('aggregates values by weekday of date, in Sun-Sat order', () => {
    const items = [
      { date: '2026-06-07T00:00:00.000Z', views: 100 }, // Sunday
      { date: '2026-06-08T00:00:00.000Z', views: 50 },  // Monday
      { date: '2026-06-08T00:00:00.000Z', views: 25 },  // Monday
    ]
    const result = computeWeekdayMetric(items, (i) => i.date, (i) => i.views)
    expect(result).toHaveLength(7)
    expect(result[0]).toEqual({ day: 'Dom', value: 100 })
    expect(result[1]).toEqual({ day: 'Lun', value: 75 })
    expect(result[2].value).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- --testPathPattern=analytics
```

Expected: FAIL (lib/analytics not found).

- [ ] **Step 3: Implement lib/analytics.ts**

Create `lib/analytics.ts`:
```typescript
import type { WeekdayMetric } from '@/types'

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

// value / average, rounded to 1 decimal — used for "xN.N" multiplier badges
export function computeMultiplier(value: number, avg: number): number {
  if (avg === 0) return 0
  return parseFloat((value / avg).toFixed(1))
}

// part as a percentage of total, rounded to 2 decimals — used for engagement rates
export function computeRate(part: number, total: number): number {
  if (total === 0) return 0
  return parseFloat(((part / total) * 100).toFixed(2))
}

// Sums getValue(item) per weekday of getDate(item), Sun-Sat
export function computeWeekdayMetric<T>(
  items: T[],
  getDate: (item: T) => string,
  getValue: (item: T) => number
): WeekdayMetric[] {
  const totals = new Array(7).fill(0)
  for (const item of items) {
    const dayIndex = new Date(getDate(item)).getDay()
    totals[dayIndex] += getValue(item)
  }
  return WEEKDAYS.map((day, i) => ({ day, value: totals[i] }))
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --testPathPattern=analytics
```

Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/analytics.ts __tests__/lib/analytics.test.ts
git commit -m "feat: add shared analytics helpers (multiplier, rate, weekday aggregation)"
```

---

## Task 3: ICP data + static page

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

## Task 4: Sidebar layout + RefreshContext + Dashboard shell

**Files:**
- Create: `components/Sidebar.tsx`
- Create: `lib/refresh-context.tsx`
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
  { href: '/', label: 'Dashboard', emoji: '🏠' },
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

- [ ] **Step 2: Create RefreshContext**

Create `lib/refresh-context.tsx`:
```tsx
'use client'

import { createContext, useContext } from 'react'
import type { RefreshData } from '@/types'

export const RefreshContext = createContext<RefreshData | null>(null)

export function useRefreshData(): RefreshData | null {
  return useContext(RefreshContext)
}
```

- [ ] **Step 3: Update root layout**

Replace `app/layout.tsx`:
```tsx
'use client'

import { useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { RefreshContext } from '@/lib/refresh-context'
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
          <RefreshContext.Provider value={data}>
            {children}
          </RefreshContext.Provider>
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Dashboard shell page**

Create `app/page.tsx`:
```tsx
'use client'

import { useRefreshData } from '@/lib/refresh-context'

export default function DashboardPage() {
  const data = useRefreshData()

  if (!data) {
    return (
      <div className="p-8 text-zinc-600 text-sm">
        Pulsa "Actualizar todo" para cargar tus métricas.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-xs text-zinc-500 mt-1">Resumen global de tu marca personal</p>
      </div>
      <p className="text-sm text-zinc-400">
        Datos cargados — la card de Análisis Claude se añade en la Tarea 14.
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Verify layout renders**

```bash
npm run dev
```

Open http://localhost:3000 — should show the sidebar with a "Dashboard" link active and the "Pulsa 'Actualizar todo'" placeholder (refresh button isn't wired to real data yet, that comes once the API routes exist).

- [ ] **Step 6: Commit**

```bash
git add components/Sidebar.tsx lib/refresh-context.tsx app/layout.tsx app/page.tsx
git commit -m "feat: add sidebar layout, RefreshContext, and dashboard shell"
```

---

## Task 5: Shared UI components

**Files:**
- Create: `components/KpiCard.tsx`
- Create: `components/DataTable.tsx`
- Create: `components/WeekdayChart.tsx`
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
'use client'

import { useState } from 'react'

export interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  align?: 'left' | 'right'
  sortable?: boolean
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
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortedRows = sortKey
    ? [...rows].sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av
        }
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      })
    : rows

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
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  className={`pb-2 text-xs text-zinc-600 font-medium border-b border-zinc-800 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.sortable ? 'cursor-pointer hover:text-zinc-400 select-none' : ''}`}
                >
                  {col.label}{sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => (
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

- [ ] **Step 3: WeekdayChart**

Create `components/WeekdayChart.tsx`:
```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { WeekdayMetric } from '@/types'

export default function WeekdayChart({ title, data }: { title: string; data: WeekdayMetric[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
          <YAxis stroke="#71717a" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', fontSize: 12 }}
            labelStyle={{ color: '#e4e4e7' }}
          />
          <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
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
git commit -m "feat: add KpiCard, DataTable, WeekdayChart, TokenAlert components"
```

---

## Task 6: YouTube lib + tests

**Files:**
- Create: `lib/youtube.ts`
- Create: `__tests__/lib/youtube.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/youtube.test.ts`:
```typescript
import { filterLongFormVideos, buildTopVideos } from '@/lib/youtube'

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

describe('buildTopVideos', () => {
  const longFormRaw = [
    { id: 'a', title: 'Video A', publishedAt: '2026-06-01T00:00:00.000Z', views: 400, likeCount: 40, commentCount: 8 },
    { id: 'b', title: 'Video B', publishedAt: '2026-06-02T00:00:00.000Z', views: 100, likeCount: 2, commentCount: 1 },
  ]
  const analyticsMap = {
    a: { ctr: 6, avgDuration: 120 },
    b: { ctr: 3, avgDuration: 60 },
  }
  const leadsByVideoId = { a: 5, b: 0 }

  it('computes multiplier vs average views', () => {
    const result = buildTopVideos(longFormRaw, analyticsMap, leadsByVideoId)
    const a = result.find(v => v.id === 'a')!
    const b = result.find(v => v.id === 'b')!
    // average views = (400 + 100) / 2 = 250
    expect(a.multiplier).toBe(1.6)
    expect(b.multiplier).toBe(0.4)
  })

  it('computes like/comment rate vs average', () => {
    const result = buildTopVideos(longFormRaw, analyticsMap, leadsByVideoId)
    const a = result.find(v => v.id === 'a')!
    expect(a.likeRate).toBe(10) // 40/400 = 10%
    expect(a.commentRate).toBe(2) // 8/400 = 2%
    expect(a.avgLikeRate).toBeGreaterThan(0)
  })

  it('carries through ctr, leads, and sorts by views descending', () => {
    const result = buildTopVideos(longFormRaw, analyticsMap, leadsByVideoId)
    expect(result[0].id).toBe('a')
    expect(result[0].ctr).toBe(6)
    expect(result[0].leads).toBe(5)
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
import type { YoutubeData, YoutubeVideo } from '@/types'
import { average, computeMultiplier, computeRate, computeWeekdayMetric } from '@/lib/analytics'

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

interface RawLongFormVideo {
  id: string
  title: string
  publishedAt: string
  views: number
  likeCount: number
  commentCount: number
}

// Builds the sorted top-videos list with multiplier and engagement-vs-average fields
export function buildTopVideos(
  longFormRaw: RawLongFormVideo[],
  analyticsMap: Record<string, { ctr: number; avgDuration: number }>,
  leadsByVideoId: Record<string, number>
): YoutubeVideo[] {
  const avgViews = average(longFormRaw.map(v => v.views))
  const avgLikeRate = parseFloat(average(longFormRaw.map(v => computeRate(v.likeCount, v.views))).toFixed(2))
  const avgCommentRate = parseFloat(average(longFormRaw.map(v => computeRate(v.commentCount, v.views))).toFixed(2))

  return longFormRaw
    .map(v => ({
      id: v.id,
      title: v.title,
      publishedAt: v.publishedAt,
      views: v.views,
      ctr: parseFloat((analyticsMap[v.id]?.ctr ?? 0).toFixed(1)),
      avgViewDurationSeconds: analyticsMap[v.id]?.avgDuration ?? 0,
      leads: leadsByVideoId[v.id] ?? 0,
      multiplier: computeMultiplier(v.views, avgViews),
      likeRate: computeRate(v.likeCount, v.views),
      commentRate: computeRate(v.commentCount, v.views),
      avgLikeRate,
      avgCommentRate,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
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
        weekdayViews: computeWeekdayMetric([], () => '', () => 0),
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
    statistics: { viewCount: string; likeCount: string; commentCount: string }
    contentDetails: { duration: string }
  }) => ({
    id: item.id,
    title: item.snippet.title,
    publishedAt: item.snippet.publishedAt,
    views: parseInt(item.statistics.viewCount ?? '0'),
    likeCount: parseInt(item.statistics.likeCount ?? '0'),
    commentCount: parseInt(item.statistics.commentCount ?? '0'),
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

  const topVideos: YoutubeVideo[] = buildTopVideos(longFormRaw, analyticsMap, leadsByVideoId)

  return {
    stats: {
      subscribers: parseInt(stats.subscriberCount),
      subscriberDelta: 0, // YouTube API doesn't give delta directly — shown as 0
      viewsThisMonth: longFormRaw.reduce((s: number, v: RawLongFormVideo) => s + v.views, 0),
      watchTimeHours: Math.round(totalWatchHours),
      videosThisMonth: longFormRaw.length,
      weekdayViews: computeWeekdayMetric(longFormRaw, v => v.publishedAt, v => v.views),
    },
    topVideos,
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --testPathPattern=youtube
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/youtube.ts __tests__/lib/youtube.test.ts
git commit -m "feat: YouTube lib with long-form filter, multiplier, and engagement analytics"
```

---

## Task 7: Instagram lib + tests

**Files:**
- Create: `lib/instagram.ts`
- Create: `__tests__/lib/instagram.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/instagram.test.ts`:
```typescript
import { computeLeadVelocity, getDaysUntilExpiry, buildPosts } from '@/lib/instagram'
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

describe('buildPosts', () => {
  const rawPosts = [
    { id: 'a', mediaType: 'IMAGE' as const, timestamp: '2026-06-01T00:00:00.000Z', likeCount: 80, commentsCount: 4, reach: 800, savedCount: 16, shareCount: 8 },
    { id: 'b', mediaType: 'IMAGE' as const, timestamp: '2026-06-02T00:00:00.000Z', likeCount: 10, commentsCount: 1, reach: 200, savedCount: 2, shareCount: 1 },
  ]

  it('computes multiplier vs average reach', () => {
    const result = buildPosts(rawPosts)
    const a = result.find(p => p.id === 'a')!
    const b = result.find(p => p.id === 'b')!
    // average reach = (800 + 200) / 2 = 500
    expect(a.multiplier).toBe(1.6)
    expect(b.multiplier).toBe(0.4)
  })

  it('computes like/save/comment/share rates vs average', () => {
    const result = buildPosts(rawPosts)
    const a = result.find(p => p.id === 'a')!
    expect(a.likeRate).toBe(10) // 80/800 = 10%
    expect(a.saveRate).toBe(2)  // 16/800 = 2%
    expect(a.commentRate).toBe(0.5) // 4/800 = 0.5%
    expect(a.shareRate).toBe(1) // 8/800 = 1%
    expect(a.avgLikeRate).toBeGreaterThan(0)
  })

  it('sorts by timestamp descending (most recent first)', () => {
    const result = buildPosts(rawPosts)
    expect(result[0].id).toBe('b')
    expect(result[1].id).toBe('a')
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
import { average, computeMultiplier, computeRate, computeWeekdayMetric } from '@/lib/analytics'

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

interface RawPost {
  id: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  timestamp: string
  likeCount: number
  commentsCount: number
  reach: number
  savedCount: number
  shareCount: number
}

// Builds the posts list with multiplier and engagement-vs-average fields, sorted by recency
export function buildPosts(rawPosts: RawPost[]): InstagramPost[] {
  const avgReach = average(rawPosts.map(p => p.reach))
  const avgLikeRate = parseFloat(average(rawPosts.map(p => computeRate(p.likeCount, p.reach))).toFixed(2))
  const avgSaveRate = parseFloat(average(rawPosts.map(p => computeRate(p.savedCount, p.reach))).toFixed(2))
  const avgCommentRate = parseFloat(average(rawPosts.map(p => computeRate(p.commentsCount, p.reach))).toFixed(2))
  const avgShareRate = parseFloat(average(rawPosts.map(p => computeRate(p.shareCount, p.reach))).toFixed(2))

  return rawPosts
    .map(p => ({
      id: p.id,
      mediaType: p.mediaType,
      timestamp: p.timestamp,
      likeCount: p.likeCount,
      commentsCount: p.commentsCount,
      reach: p.reach,
      savedCount: p.savedCount,
      shareCount: p.shareCount,
      multiplier: computeMultiplier(p.reach, avgReach),
      likeRate: computeRate(p.likeCount, p.reach),
      saveRate: computeRate(p.savedCount, p.reach),
      commentRate: computeRate(p.commentsCount, p.reach),
      shareRate: computeRate(p.shareCount, p.reach),
      avgLikeRate,
      avgSaveRate,
      avgCommentRate,
      avgShareRate,
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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

  // 5. Per-media reach/saves/shares (requires individual insight calls)
  const rawPosts = (mediaJson.data ?? []).map((item: {
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
    reach: 0,       // filled in below
    savedCount: 0,
    shareCount: 0,
  }))

  // Fetch reach/saved/shares for each post individually (IG API requires this)
  for (const post of rawPosts.slice(0, 10)) {
    try {
      const r = await fetch(
        `${BASE}/${post.id}/insights?metric=reach,saved,shares&access_token=${token}`
      )
      const rj = await r.json()
      post.reach = (rj.data ?? []).find((d: { name: string }) => d.name === 'reach')?.values?.[0]?.value ?? 0
      post.savedCount = (rj.data ?? []).find((d: { name: string }) => d.name === 'saved')?.values?.[0]?.value ?? 0
      post.shareCount = (rj.data ?? []).find((d: { name: string }) => d.name === 'shares')?.values?.[0]?.value ?? 0
    } catch {
      // non-critical, leave as 0
    }
  }

  const posts: InstagramPost[] = buildPosts(rawPosts)

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
    weekdayReach: computeWeekdayMetric(posts, p => p.timestamp, p => p.reach),
  }

  return { stats: statsResult, posts }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --testPathPattern=instagram
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/instagram.ts __tests__/lib/instagram.test.ts
git commit -m "feat: Instagram lib with token expiry, lead velocity, and engagement analytics"
```

---

## Task 8: Google Sheets lib (Tally leads) + tests

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

## Task 9: Claude analysis lib + API route + AnalysisCard

**Files:**
- Create: `lib/analysis.ts`
- Create: `__tests__/lib/analysis.test.ts`
- Create: `app/api/analyze/route.ts`
- Create: `components/AnalysisCard.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/lib/analysis.test.ts`:
```typescript
import { buildAnalysisPrompt } from '@/lib/analysis'
import type { RefreshData } from '@/types'

const emptyData: RefreshData = {
  youtube: {
    stats: { subscribers: 100, subscriberDelta: 0, viewsThisMonth: 1000, watchTimeHours: 10, videosThisMonth: 2, weekdayViews: [] },
    topVideos: [
      { id: 'a', title: 'Video A', publishedAt: '2026-06-01T00:00:00.000Z', views: 800, ctr: 6, avgViewDurationSeconds: 120, leads: 3, multiplier: 1.6, likeRate: 5, commentRate: 1, avgLikeRate: 3, avgCommentRate: 0.5 },
    ],
  },
  instagram: {
    stats: { followers: 500, followerDelta: 0, reachThisMonth: 2000, impressionsThisMonth: 3000, engagementRate: 4.2, leadVelocity: [1, 2, 1, 3], tokenExpiresAt: null, weekdayReach: [] },
    posts: [],
  },
  leads: { totalThisMonth: 7, byVideoSource: [{ source: 'video-a', count: 3 }], recentLeads: [] },
  updatedAt: '2026-06-11T00:00:00.000Z',
}

const icp = { baseProfile: { revenue: '5.000€ – 50.000€/mes' } }

describe('buildAnalysisPrompt', () => {
  it('includes the four required section headers', () => {
    const prompt = buildAnalysisPrompt(emptyData, icp)
    expect(prompt).toContain('## Qué repetir')
    expect(prompt).toContain('## Qué evitar')
    expect(prompt).toContain('## Mejor día para publicar')
    expect(prompt).toContain('## Próximas ideas de contenido')
  })

  it('embeds the YouTube and Instagram data and the ICP', () => {
    const prompt = buildAnalysisPrompt(emptyData, icp)
    expect(prompt).toContain('Video A')
    expect(prompt).toContain('"multiplier": 1.6')
    expect(prompt).toContain('5.000€')
  })

  it('adds a token expiry warning when Instagram token expires within 7 days', () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    const dataWithExpiry: RefreshData = {
      ...emptyData,
      instagram: { ...emptyData.instagram, stats: { ...emptyData.instagram.stats, tokenExpiresAt: soon } },
    }
    const prompt = buildAnalysisPrompt(dataWithExpiry, icp)
    expect(prompt.toUpperCase()).toContain('ALERTA')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- --testPathPattern=analysis
```

Expected: FAIL (lib/analysis not found).

- [ ] **Step 3: Implement lib/analysis.ts**

Create `lib/analysis.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { RefreshData } from '@/types'

export function buildAnalysisPrompt(data: RefreshData, icp: unknown): string {
  const summary = {
    youtube: {
      stats: data.youtube.stats,
      topVideos: data.youtube.topVideos.map(v => ({
        title: v.title,
        views: v.views,
        multiplier: v.multiplier,
        likeRate: v.likeRate,
        avgLikeRate: v.avgLikeRate,
        commentRate: v.commentRate,
        avgCommentRate: v.avgCommentRate,
        leads: v.leads,
        ctr: v.ctr,
      })),
    },
    instagram: {
      stats: data.instagram.stats,
      posts: data.instagram.posts.map(p => ({
        mediaType: p.mediaType,
        timestamp: p.timestamp,
        reach: p.reach,
        multiplier: p.multiplier,
        likeRate: p.likeRate,
        avgLikeRate: p.avgLikeRate,
        saveRate: p.saveRate,
        avgSaveRate: p.avgSaveRate,
        commentRate: p.commentRate,
        avgCommentRate: p.avgCommentRate,
        shareRate: p.shareRate,
        avgShareRate: p.avgShareRate,
      })),
    },
    leads: {
      totalThisMonth: data.leads.totalThisMonth,
      byVideoSource: data.leads.byVideoSource,
    },
  }

  const expiresAt = data.instagram.stats.tokenExpiresAt
  let tokenWarning = ''
  if (expiresAt) {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days <= 7) {
      tokenWarning = `\n\nALERTA: el access token de Instagram caduca en ${days} días. Avisa de esto al principio del análisis.`
    }
  }

  return `Eres un analista de contenido para un creador de contenido IA+ecommerce en español (nicho: dueños de ecommerce Shopify que ya facturan y quieren escalar con Klaviyo/automatizaciones).

Analiza los datos de YouTube e Instagram del último periodo (incluyen multiplicador = valor del item / promedio del periodo, y tasas de engagement comparadas con el promedio) junto con el ICP del cliente ideal. Devuelve un análisis en markdown con EXACTAMENTE estas 4 secciones, en este orden:

## Qué repetir
## Qué evitar
## Mejor día para publicar
## Próximas ideas de contenido

En "Qué repetir" y "Qué evitar" usa el multiplicador y el engagement vs promedio para identificar qué piezas funcionaron mejor o peor y por qué. En "Mejor día para publicar" usa los datos de vistas/alcance por día de semana. En "Próximas ideas de contenido" da 2-3 ideas concretas y accionables, alineadas con el ICP.

DATOS:
${JSON.stringify(summary, null, 2)}

ICP:
${JSON.stringify(icp, null, 2)}${tokenWarning}`
}

export async function generateAnalysis(data: RefreshData, icp: unknown): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const prompt = buildAnalysisPrompt(data, icp)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('Claude no devolvió texto')
  return textBlock.text
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm test -- --testPathPattern=analysis
```

Expected: PASS (3 tests).

- [ ] **Step 5: Create the API route**

Create `app/api/analyze/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { generateAnalysis } from '@/lib/analysis'
import icp from '@/data/icp.json'
import type { RefreshData } from '@/types'

export async function POST(request: Request) {
  try {
    const data: RefreshData = await request.json()
    const markdown = await generateAnalysis(data, icp)
    return NextResponse.json({ markdown })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

- [ ] **Step 6: Create AnalysisCard component**

Create `components/AnalysisCard.tsx`:
```tsx
'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { RefreshData, AnalysisResponse } from '@/types'

export default function AnalysisCard({ data }: { data: RefreshData }) {
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error generando el análisis')
      const json: AnalysisResponse = await res.json()
      setMarkdown(json.markdown)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Análisis Claude</h3>
        <button
          onClick={analyze}
          disabled={loading}
          className="bg-violet-700 hover:bg-violet-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors shrink-0"
        >
          {loading ? '⟳ Analizando…' : '🧠 Analizar con Claude'}
        </button>
      </div>
      {error && <p className="text-sm text-rose-400">Error: {error}</p>}
      {markdown && (
        <div className="space-y-2">
          <ReactMarkdown
            components={{
              h2: ({ children }) => <h4 className="text-sm font-bold text-white mt-3 first:mt-0">{children}</h4>,
              p: ({ children }) => <p className="text-sm text-zinc-300">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">{children}</ul>,
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => <strong className="text-white">{children}</strong>,
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/analysis.ts __tests__/lib/analysis.test.ts app/api/analyze/route.ts components/AnalysisCard.tsx
git commit -m "feat: add Claude-based content analysis (lib, API route, AnalysisCard)"
```

---

## Task 10: API routes

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
import { fetchYoutubeData } from '@/lib/youtube'

export async function GET() {
  try {
    const leadsData = await fetchLeadsData()
    const leadsByVideoId: Record<string, number> = {}
    for (const { source, count } of leadsData.byVideoSource) {
      leadsByVideoId[source] = count
    }
    const data = await fetchYoutubeData(leadsByVideoId)
    return NextResponse.json(data)
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
import { fetchInstagramData } from '@/lib/instagram'

export async function GET() {
  try {
    const leadsData = await fetchLeadsData()
    const data = await fetchInstagramData(leadsData.recentLeads)
    return NextResponse.json(data)
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

## Task 11: YouTube page

**Files:**
- Create: `app/youtube/page.tsx`

- [ ] **Step 1: Create YouTube page**

Create `app/youtube/page.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import KpiCard from '@/components/KpiCard'
import DataTable, { type Column } from '@/components/DataTable'
import WeekdayChart from '@/components/WeekdayChart'
import type { YoutubeData, YoutubeVideo } from '@/types'

function MultiplierBadge({ value }: { value: number }) {
  const color = value >= 1.2 ? 'bg-emerald-950 text-emerald-400' : value <= 0.8 ? 'bg-rose-950 text-rose-400' : 'bg-zinc-800 text-zinc-400'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>x{value.toFixed(1)}</span>
}

function RateVsAvg({ rate, avg }: { rate: number; avg: number }) {
  const color = rate >= avg ? 'text-emerald-400' : 'text-zinc-400'
  return (
    <span className="text-xs">
      <span className={`font-semibold ${color}`}>{rate.toFixed(2)}%</span>
      <span className="text-zinc-600"> vs {avg.toFixed(2)}% avg</span>
    </span>
  )
}

const COLUMNS: Column<YoutubeVideo>[] = [
  {
    key: 'title',
    label: 'Vídeo',
    render: (v) => (
      <span className="text-white text-xs leading-tight line-clamp-2 max-w-xs">{v as string}</span>
    ),
  },
  { key: 'views', label: 'Vistas', align: 'right', sortable: true,
    render: (v) => <span className="font-semibold">{Number(v).toLocaleString('es-ES')}</span> },
  { key: 'multiplier', label: 'Multiplicador', align: 'right', sortable: true,
    render: (v) => <MultiplierBadge value={Number(v)} /> },
  { key: 'ctr', label: 'CTR', align: 'right', sortable: true,
    render: (v) => {
      const n = Number(v)
      return <span className={n >= 5 ? 'text-emerald-400' : n >= 3 ? 'text-amber-400' : 'text-zinc-400'}>{n.toFixed(1)}%</span>
    }
  },
  { key: 'likeRate', label: 'Likes vs avg', align: 'right', sortable: true,
    render: (v, row) => <RateVsAvg rate={Number(v)} avg={row.avgLikeRate} /> },
  { key: 'commentRate', label: 'Comentarios vs avg', align: 'right', sortable: true,
    render: (v, row) => <RateVsAvg rate={Number(v)} avg={row.avgCommentRate} /> },
  { key: 'avgViewDurationSeconds', label: 'Duración media', align: 'right', sortable: true,
    render: (v) => {
      const secs = Number(v)
      return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
    }
  },
  { key: 'leads', label: 'Leads', align: 'right', sortable: true,
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

      <WeekdayChart title="Vistas por día de semana" data={data.stats.weekdayViews} />
    </div>
  )
}
```

- [ ] **Step 2: Verify page renders with real data**

```bash
npm run dev
```

Open http://localhost:3000/youtube. Click the refresh button or wait for initial load. Verify YouTube data appears, including multiplier badges, like/comment rate vs average, and the weekday views chart.

- [ ] **Step 3: Commit**

```bash
git add app/youtube/page.tsx
git commit -m "feat: YouTube page with multiplier, engagement vs average, and weekday chart"
```

---

## Task 12: Instagram page

**Files:**
- Create: `app/instagram/page.tsx`

- [ ] **Step 1: Create Instagram page**

Create `app/instagram/page.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import KpiCard from '@/components/KpiCard'
import DataTable, { type Column } from '@/components/DataTable'
import WeekdayChart from '@/components/WeekdayChart'
import TokenAlert from '@/components/TokenAlert'
import type { InstagramData, InstagramPost } from '@/types'

function MultiplierBadge({ value }: { value: number }) {
  const color = value >= 1.2 ? 'bg-emerald-950 text-emerald-400' : value <= 0.8 ? 'bg-rose-950 text-rose-400' : 'bg-zinc-800 text-zinc-400'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>x{value.toFixed(1)}</span>
}

function RateVsAvg({ rate, avg }: { rate: number; avg: number }) {
  const color = rate >= avg ? 'text-emerald-400' : 'text-zinc-400'
  return (
    <span className="text-xs">
      <span className={`font-semibold ${color}`}>{rate.toFixed(2)}%</span>
      <span className="text-zinc-600"> vs {avg.toFixed(2)}% avg</span>
    </span>
  )
}

const COLUMNS: Column<InstagramPost>[] = [
  { key: 'mediaType', label: 'Tipo', render: (v) => {
    const icons = { VIDEO: '🎬', IMAGE: '🖼️', CAROUSEL_ALBUM: '📑' }
    return icons[v as keyof typeof icons] ?? v
  }},
  { key: 'timestamp', label: 'Fecha', render: (v) =>
    new Date(v as string).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  },
  { key: 'reach', label: 'Alcance', align: 'right', sortable: true,
    render: (v) => <span className="font-semibold">{Number(v).toLocaleString('es-ES')}</span> },
  { key: 'multiplier', label: 'Multiplicador', align: 'right', sortable: true,
    render: (v) => <MultiplierBadge value={Number(v)} /> },
  { key: 'likeRate', label: 'Likes vs avg', align: 'right', sortable: true,
    render: (v, row) => <RateVsAvg rate={Number(v)} avg={row.avgLikeRate} /> },
  { key: 'saveRate', label: 'Guardados vs avg', align: 'right', sortable: true,
    render: (v, row) => <RateVsAvg rate={Number(v)} avg={row.avgSaveRate} /> },
  { key: 'commentRate', label: 'Comentarios vs avg', align: 'right', sortable: true,
    render: (v, row) => <RateVsAvg rate={Number(v)} avg={row.avgCommentRate} /> },
  { key: 'shareRate', label: 'Compartidos vs avg', align: 'right', sortable: true,
    render: (v, row) => <RateVsAvg rate={Number(v)} avg={row.avgShareRate} /> },
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

      <WeekdayChart title="Alcance por día de semana" data={data.stats.weekdayReach} />
    </div>
  )
}
```

- [ ] **Step 2: Verify page**

Open http://localhost:3000/instagram after refresh — should show follower KPIs, lead velocity bar, posts table with multiplier and engagement vs average columns, token alert, and the weekday reach chart.

- [ ] **Step 3: Commit**

```bash
git add app/instagram/page.tsx
git commit -m "feat: Instagram page with multiplier, engagement vs average, and weekday chart"
```

---

## Task 13: Leads page

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

## Task 14: Dashboard page with AnalysisCard

**Files:**
- Modify: `app/page.tsx`

This replaces the placeholder dashboard shell from Task 4 with summary KPIs across YouTube/Instagram/Leads and the "Análisis Claude" card.

- [ ] **Step 1: Replace app/page.tsx**

Replace `app/page.tsx`:
```tsx
'use client'

import { useRefreshData } from '@/lib/refresh-context'
import KpiCard from '@/components/KpiCard'
import AnalysisCard from '@/components/AnalysisCard'

export default function DashboardPage() {
  const data = useRefreshData()

  if (!data) {
    return (
      <div className="p-8 text-zinc-600 text-sm">
        Pulsa "Actualizar todo" para cargar tus métricas.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-xs text-zinc-500 mt-1">Resumen global de tu marca personal</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Suscriptores YouTube" value={data.youtube.stats.subscribers.toLocaleString('es-ES')} />
        <KpiCard label="Vistas YouTube / mes" value={data.youtube.stats.viewsThisMonth.toLocaleString('es-ES')} />
        <KpiCard label="Seguidores Instagram" value={data.instagram.stats.followers.toLocaleString('es-ES')} />
        <KpiCard label="Leads este mes" value={data.leads.totalThisMonth} />
      </div>

      <AnalysisCard data={data} />
    </div>
  )
}
```

- [ ] **Step 2: Verify page**

```bash
npm run dev
```

Open http://localhost:3000, click "Actualizar todo", verify the 4 summary KPIs populate and the "🧠 Analizar con Claude" button is visible.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: Dashboard page with summary KPIs and Análisis Claude card"
```

---

## Task 15: Wire refresh button to global state + smoke test all pages

The sidebar's `onRefresh` is already wired in `layout.tsx`. The individual pages currently load on mount independently. This task verifies the full flow works end-to-end.

- [ ] **Step 1: Smoke test all pages locally**

```bash
npm run dev
```

Visit each page and verify they load without errors:
- http://localhost:3000/ (Dashboard)
- http://localhost:3000/youtube
- http://localhost:3000/instagram
- http://localhost:3000/leads
- http://localhost:3000/icp

Click "Actualizar todo" — verify the sidebar shows a loading state and then "Actualizado: HH:MM".

On the Dashboard page, click "🧠 Analizar con Claude" — verify the button shows "⟳ Analizando…", then renders a markdown analysis with the four sections (Qué repetir, Qué evitar, Mejor día para publicar, Próximas ideas de contenido).

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

## Task 16: Vercel deploy

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
ANTHROPIC_API_KEY
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
