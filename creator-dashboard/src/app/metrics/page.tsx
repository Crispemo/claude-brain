"use client";

import { useEffect, useState, useCallback } from "react";
import { KpiCard } from "@/components/kpi-card";
import { MetricsChartReach } from "@/components/metrics-chart-reach";
import { MetricsChartEngagement } from "@/components/metrics-chart-engagement";
import { BombazoCard } from "@/components/bombazo-card";
import type { MetricsSnapshot, ReelMetric } from "@/lib/types";

function fmtNum(n: number): string { return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n); }

export default function MetricsPage() {
  const [range, setRange] = useState(7);
  const [ig, setIg] = useState({ views: 0, saves: 0, followers_new: 0, dms: 0, likes: 0, comments: 0, engagement_rate: 0 });
  const [yt, setYt] = useState({ views: 0, followers_new: 0, followers_total: 0 });
  const [snapshots, setSnapshots] = useState<MetricsSnapshot[]>([]);
  const [bombazos, setBombazos] = useState<ReelMetric[]>([]);

  const fetchData = useCallback(async () => {
    const [metricsRes, reelsRes] = await Promise.all([
      fetch(`/api/metrics?range=${range}`),
      fetch(`/api/metrics/reels?bombazo=true`),
    ]);
    const metricsData = await metricsRes.json();
    const reelsData = await reelsRes.json();
    if (metricsData.ig) setIg(metricsData.ig);
    if (metricsData.yt) setYt(metricsData.yt);
    if (metricsData.snapshots) setSnapshots(metricsData.snapshots);
    if (Array.isArray(reelsData)) setBombazos(reelsData);
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const igViews = snapshots.filter((s) => s.platform === "instagram").map((s) => s.views);
  const igSaves = snapshots.filter((s) => s.platform === "instagram").map((s) => s.saves);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Métricas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Última actualización: hoy</p>
        </div>
        <div className="flex gap-1.5">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setRange(d)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${range === d ? "bg-foreground text-white" : "bg-card border border-border text-muted-foreground"}`}>{d} días</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Vistas totales" value={fmtNum(ig.views)} sparkData={igViews} sparkColor="#c4704b" />
        <KpiCard label="Guardados" value={fmtNum(ig.saves)} sparkData={igSaves} sparkColor="#22c55e" />
        <KpiCard label="Seguidores nuevos" value={`+${fmtNum(ig.followers_new)}`} sparkColor="#3b82f6" />
        <KpiCard label="DMs recibidos" value={fmtNum(ig.dms)} sparkColor="#a855f7" />
        <KpiCard label={`YT Views · ${range}D`} value={fmtNum(yt.views)} sparkColor="#ef4444" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <MetricsChartReach data={snapshots} />
        <MetricsChartEngagement likes={ig.likes} saves={ig.saves} comments={ig.comments} rate={ig.engagement_rate} />
      </div>

      {bombazos.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-xs font-semibold text-foreground">Bombazos</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Reels que duplicaron la mediana de 30 días</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bombazos.map((reel) => (
              <BombazoCard key={reel.id} reel={reel} onCreateTrial={(r) => { window.location.href = `/engine?trial=${r.id}`; }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
