"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Trend, TrendCategory } from "@/lib/types";

const CATEGORY_CONFIG: Record<TrendCategory, { label: string; bg: string; text: string }> = {
  gancho: { label: "GANCHO", bg: "bg-green-100", text: "text-green-700" },
  explicativo: { label: "EXPLICATIVO", bg: "bg-yellow-100", text: "text-yellow-700" },
  ignorar: { label: "IGNORAR", bg: "bg-gray-100", text: "text-gray-400" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "hace menos de 1h";
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    const params = filter ? `?category=${filter}` : "";
    fetch(`/api/trends${params}`).then((r) => r.json()).then((d) => Array.isArray(d) && setTrends(d));
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">Tendencias</h1>
        <p className="text-xs text-muted-foreground">12 fuentes · escaneo diario 7am</p>
      </div>

      <div className="flex gap-1.5 mb-5">
        {[{ value: null, label: "Todos" }, { value: "gancho", label: "Gancho" }, { value: "explicativo", label: "Explicativo" }, { value: "ignorar", label: "Ignorar" }].map((f) => (
          <button key={f.label} onClick={() => setFilter(f.value)} className={`px-3 py-1.5 rounded-full text-[11px] font-medium ${filter === f.value ? "bg-foreground text-white" : "bg-card border border-border text-muted-foreground"}`}>{f.label}</button>
        ))}
      </div>

      <div className="space-y-2">
        {trends.map((trend) => {
          const cat = CATEGORY_CONFIG[trend.category];
          const isIgnored = trend.category === "ignorar";
          return (
            <div key={trend.id} className={`bg-card border border-border rounded-lg p-4 flex items-start gap-3 ${isIgnored ? "opacity-50" : ""}`}>
              <span className={`text-[9px] font-bold px-2 py-1 rounded ${cat.bg} ${cat.text} shrink-0 mt-0.5`}>{cat.label}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{trend.title}</div>
                {trend.suggested_angle && <div className="text-xs text-muted-foreground mt-1 italic">{trend.suggested_angle}</div>}
                <div className="text-[10px] text-muted-foreground mt-1.5">{trend.source} · {timeAgo(trend.scanned_at)}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" variant="outline" className="text-[10px] h-7 text-terracota border-terracota" onClick={() => { window.location.href = `/engine?trend=${trend.id}`; }}>Crear Guion →</Button>
              </div>
            </div>
          );
        })}
        {trends.length === 0 && <div className="text-center py-20 text-muted-foreground text-sm">No hay tendencias aún. El cron escanea diariamente a las 7am.</div>}
      </div>
    </div>
  );
}
