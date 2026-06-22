"use client";

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

export function KpiCard({ label, value, change, changeType = "neutral", sparkData, sparkColor, accent, sublabel }: KpiCardProps) {
  const changeColor = changeType === "up" ? "text-status-published" : changeType === "down" ? "text-status-pending" : "text-status-scheduled";

  return (
    <div className="bg-card border border-border rounded-xl p-4" style={accent ? { borderLeftWidth: 3, borderLeftColor: accent } : undefined}>
      <div className="text-[10px] tracking-wide uppercase" style={accent ? { color: accent, fontWeight: 600 } : { color: "var(--muted-foreground)" }}>
        {label}
      </div>
      <div className="text-2xl font-extrabold text-foreground mt-1.5">{value}</div>
      {change && <div className={`text-[11px] mt-1 ${changeColor}`}>{change}</div>}
      {sublabel && <div className="text-[11px] text-muted-foreground mt-1">{sublabel}</div>}
      {sparkData && sparkData.length > 0 && (
        <div className="mt-2"><Sparkline data={sparkData} color={sparkColor} /></div>
      )}
    </div>
  );
}
