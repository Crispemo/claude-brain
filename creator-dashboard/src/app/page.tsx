"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { PlatformBadge } from "@/components/platform-badge";
import type { Hook, CalendarEntry, Trend } from "@/lib/types";

export default function OverviewPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [igMetrics, setIgMetrics] = useState({ views: 0, saves: 0, followers_new: 0, dms: 0 });
  const [ytMetrics, setYtMetrics] = useState({ followers_total: 0, views: 0 });
  const [simulia, setSimulia] = useState({ revenue: 0, new_users: 0 });

  useEffect(() => {
    fetch("/api/hooks?sort=recent").then((r) => r.json()).then((d) => Array.isArray(d) && setHooks(d.slice(0, 3)));
    fetch("/api/calendar").then((r) => r.json()).then((d) => Array.isArray(d) && setCalendar(d.slice(0, 5)));
    fetch("/api/trends?category=gancho").then((r) => r.json()).then((d) => Array.isArray(d) && setTrends(d.slice(0, 3)));
    fetch("/api/metrics?range=7").then((r) => r.json()).then((d) => { if (d.ig) setIgMetrics(d.ig); if (d.yt) setYtMetrics(d.yt); });
    fetch("/api/simulia").then((r) => r.json()).then((d) => { if (Array.isArray(d) && d[0]) setSimulia(d[0]); });
  }, []);

  const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  const weekNum = Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] text-muted-foreground tracking-wide uppercase">SEMANA {weekNum} · {new Date().toLocaleDateString("es", { month: "long", year: "numeric" })}</div>
          <div className="text-xl font-bold text-foreground mt-1">Buenos días, Cris</div>
        </div>
        <div className="flex gap-2">
          <Link href="/engine"><Button className="bg-terracota hover:bg-terracota/90 text-sm">+ Nuevo Guion</Button></Link>
          <Link href="/engine"><Button variant="outline" className="text-sm">Content Engine</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="IG Views · 7D" value={fmtNum(igMetrics.views)} changeType="up" sparkColor="#c4704b" />
        <KpiCard label="YT Subs" value={fmtNum(ytMetrics.followers_total)} sparkColor="#ef4444" />
        <KpiCard label="Guardados · 7D" value={fmtNum(igMetrics.saves)} sparkColor="#22c55e" />
        <KpiCard label="Simulia · 30D" value={`€${simulia.revenue}`} accent="#7da0a7" sublabel={`${simulia.new_users} nuevos usuarios`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[11px] text-muted-foreground tracking-wide mb-3">HOOKS RECIENTES</div>
          <div className="space-y-2">
            {hooks.map((h) => (
              <div key={h.id} className="bg-border-light rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div className="text-[13px] text-foreground">&ldquo;{h.text}&rdquo;</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{h.type} · {fmtNum(h.views)} views</div>
                </div>
                <Link href={`/engine?hook=${h.id}`} className="text-[10px] text-terracota font-semibold">Usar →</Link>
              </div>
            ))}
            {hooks.length === 0 && <p className="text-xs text-muted-foreground">Sin hooks aún</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[11px] text-muted-foreground tracking-wide mb-3">ESTA SEMANA</div>
          <div className="space-y-1.5">
            {calendar.map((e) => (
              <div key={e.id} className="flex items-center gap-2.5 py-2 border-b border-border-light last:border-0">
                <span className="text-[11px] text-muted-foreground w-[30px] font-semibold">{new Date(e.date).toLocaleDateString("es", { weekday: "short" }).slice(0, 3).toUpperCase()}</span>
                {e.platform.map((p) => <PlatformBadge key={p} platform={p} />)}
                <span className="text-[12px] text-foreground flex-1 truncate">{e.hook_preview}</span>
                <span className="text-[10px] text-muted-foreground">{e.time_slot?.slice(0, 5)}</span>
              </div>
            ))}
            {calendar.length === 0 && <p className="text-xs text-muted-foreground">Sin contenido programado</p>}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="text-[11px] text-muted-foreground tracking-wide mb-3">TENDENCIAS HOY</div>
        <div className="space-y-2">
          {trends.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <span className="text-[9px] font-bold px-2 py-1 rounded bg-green-100 text-green-700 shrink-0">GANCHO</span>
              <span className="text-[12px] text-foreground flex-1">{t.title}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{t.source}</span>
            </div>
          ))}
          {trends.length === 0 && <p className="text-xs text-muted-foreground">Sin tendencias. El cron escanea a las 7am.</p>}
        </div>
      </div>
    </div>
  );
}
