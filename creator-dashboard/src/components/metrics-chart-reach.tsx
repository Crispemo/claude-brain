"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { MetricsSnapshot } from "@/lib/types";

export function MetricsChartReach({ data }: { data: MetricsSnapshot[] }) {
  const chartData = data.filter((d) => d.platform === "instagram").map((d) => ({
    date: d.date.slice(5),
    reach: d.reach,
    impressions: d.impressions,
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-foreground">Alcance & Visibilidad</span>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span><span className="inline-block w-2 h-2 rounded-full bg-terracota mr-1" />Alcance</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-terracota/40 mr-1" />Impresiones</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#999" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Bar dataKey="reach" fill="#c4704b" radius={[3, 3, 0, 0]} />
          <Bar dataKey="impressions" fill="rgba(196,112,75,0.3)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
