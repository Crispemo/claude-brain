"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CompetitorReel, Competitor } from "@/lib/types";

function fmtNum(n: number): string { return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n); }

export default function CompetitorsPage() {
  const [reels, setReels] = useState<CompetitorReel[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [newHandle, setNewHandle] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/competitors/reels").then((r) => r.json()).then((d) => Array.isArray(d) && setReels(d));
    fetch("/api/competitors").then((r) => r.json()).then((d) => Array.isArray(d) && setCompetitors(d));
  }, []);

  async function addCompetitor() {
    if (!newHandle) return;
    await fetch("/api/competitors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle: newHandle.replace("@", ""), platform: "instagram" }) });
    setNewHandle("");
    const res = await fetch("/api/competitors");
    setCompetitors(await res.json());
  }

  async function saveToHookVault(reel: CompetitorReel) {
    await fetch("/api/hooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: reel.hook_text || "Sin hook", type: "shock", source: `@${reel.competitor?.handle || "desconocido"}`, source_url: reel.url, views: reel.views, saves: reel.saves, engagement_rate: reel.engagement_rate }) });
    alert("Hook guardado en el Baúl");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">Rastreador de Competencia</h1>
        <div className="flex gap-2">
          <Input placeholder="@handle" value={newHandle} onChange={(e) => setNewHandle(e.target.value)} className="h-9 w-40 text-sm" />
          <Button onClick={addCompetitor} className="bg-terracota hover:bg-terracota/90 text-sm h-9">+ Agregar</Button>
        </div>
      </div>

      {competitors.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {competitors.map((c) => (
            <span key={c.id} className="text-[11px] bg-card border border-border px-3 py-1 rounded-full text-muted-foreground">@{c.handle} · {fmtNum(c.followers)}</span>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wide">
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Creador</th>
              <th className="text-left p-3">Hook</th>
              <th className="text-right p-3">Views</th>
              <th className="text-right p-3">Eng%</th>
              <th className="text-right p-3">Shares</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            {reels.map((reel, i) => (
              <>
                <tr key={reel.id} className="border-b border-border-light hover:bg-border-light/50 cursor-pointer" onClick={() => setExpandedId(expandedId === reel.id ? null : reel.id)}>
                  <td className="p-3 text-muted-foreground font-semibold">{i + 1}</td>
                  <td className="p-3">
                    <div className="font-semibold text-foreground">@{reel.competitor?.handle}</div>
                    <div className="text-[10px] text-muted-foreground">{fmtNum(reel.competitor?.followers || 0)} seg.</div>
                  </td>
                  <td className="p-3 max-w-[200px] truncate text-foreground">{reel.hook_text || "—"}</td>
                  <td className="p-3 text-right font-bold text-foreground">{fmtNum(reel.views)}</td>
                  <td className="p-3 text-right text-muted-foreground">{reel.engagement_rate.toFixed(1)}%</td>
                  <td className="p-3 text-right text-muted-foreground">{fmtNum(reel.shares)}</td>
                  <td className="p-3 text-right"><Button size="sm" variant="outline" className="text-[10px] h-7" onClick={(e) => { e.stopPropagation(); saveToHookVault(reel); }}>Al Baúl →</Button></td>
                </tr>
                {expandedId === reel.id && (
                  <tr key={`${reel.id}-detail`} className="bg-border-light/30">
                    <td colSpan={7} className="p-4">
                      {reel.transcription && <div className="mb-2"><span className="text-[9px] text-terracota font-bold tracking-wide">TRANSCRIPCIÓN</span><p className="text-xs text-foreground mt-1">{reel.transcription}</p></div>}
                      {reel.screen_text && <div><span className="text-[9px] text-terracota font-bold tracking-wide">TEXTO EN PANTALLA</span><p className="text-xs text-foreground mt-1">{reel.screen_text}</p></div>}
                      {!reel.transcription && !reel.screen_text && <p className="text-xs text-muted-foreground">Sin transcripción disponible</p>}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {reels.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No hay reels scrapeados. Agrega cuentas de competencia y ejecuta el scraper.</div>}
      </div>
    </div>
  );
}
