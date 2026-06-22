"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/kpi-card";
import type { SimuliaMetric } from "@/lib/types";

export default function SimuliaPage() {
  const [metrics, setMetrics] = useState<SimuliaMetric[]>([]);
  const [newMonth, setNewMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newRevenue, setNewRevenue] = useState("");
  const [newUsers, setNewUsers] = useState("");

  useEffect(() => {
    fetch("/api/simulia").then((r) => r.json()).then((d) => Array.isArray(d) && setMetrics(d));
  }, []);

  async function addMetric() {
    await fetch("/api/simulia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month: `${newMonth}-01`, revenue: parseFloat(newRevenue) || 0, new_users: parseInt(newUsers) || 0, total_users: 0 }) });
    const res = await fetch("/api/simulia");
    setMetrics(await res.json());
    setNewRevenue("");
    setNewUsers("");
  }

  const latest = metrics[0];
  const revenueHistory = [...metrics].reverse().map((m) => m.revenue);

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-5">Simulia</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <KpiCard label="Ingresos · últimos 30d" value={latest ? `€${latest.revenue}` : "€0"} accent="#7da0a7" sparkData={revenueHistory} sparkColor="#7da0a7" />
        <KpiCard label="Nuevos usuarios · 30d" value={latest ? String(latest.new_users) : "0"} accent="#7da0a7" />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="text-[11px] text-muted-foreground tracking-wide mb-3">AÑADIR MES</div>
        <div className="flex gap-2 items-end">
          <div><label className="text-xs text-muted-foreground">Mes</label><Input type="month" value={newMonth} onChange={(e) => setNewMonth(e.target.value)} className="mt-1 w-40" /></div>
          <div><label className="text-xs text-muted-foreground">Ingresos €</label><Input type="number" value={newRevenue} onChange={(e) => setNewRevenue(e.target.value)} placeholder="0" className="mt-1 w-32" /></div>
          <div><label className="text-xs text-muted-foreground">Nuevos usuarios</label><Input type="number" value={newUsers} onChange={(e) => setNewUsers(e.target.value)} placeholder="0" className="mt-1 w-32" /></div>
          <Button onClick={addMetric} className="bg-simulia hover:bg-simulia/90">Guardar</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wide">
            <th className="text-left p-3">Mes</th><th className="text-right p-3">Ingresos</th><th className="text-right p-3">Nuevos usuarios</th>
          </tr></thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.id} className="border-b border-border-light">
                <td className="p-3 font-medium">{m.month.slice(0, 7)}</td>
                <td className="p-3 text-right font-bold">€{m.revenue}</td>
                <td className="p-3 text-right">{m.new_users}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {metrics.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Sin datos. Añade el primer mes.</div>}
      </div>
    </div>
  );
}
