"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { PlatformBadge } from "@/components/platform-badge";
import type { CalendarEntry } from "@/lib/types";

export default function CommunityPage() {
  const [queue, setQueue] = useState<CalendarEntry[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["ig", "tt", "yt"]);

  useEffect(() => {
    fetch("/api/calendar").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setQueue(d.filter((e: CalendarEntry) => e.status !== "published").slice(0, 20));
    });
  }, []);

  async function generateDescriptions(entry: CalendarEntry) {
    if (!entry.script) return;
    setGenerating(true);
    const res = await fetch("/api/publish/describe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hook_text: entry.script.hook_text, problem_text: entry.script.problem_text, cta_text: entry.script.cta_text, platforms: selectedPlatforms }),
    });
    const data = await res.json();
    setDescriptions(data);
    setGenerating(false);
  }

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-5">Community Manager</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[11px] text-muted-foreground tracking-wide mb-3">COMPOSER</div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Plataformas</label>
              <div className="flex gap-2">
                {["ig", "tt", "yt"].map((p) => (
                  <button key={p} onClick={() => togglePlatform(p)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${selectedPlatforms.includes(p) ? "bg-terracota text-white border-terracota" : "border-border text-muted-foreground"}`}>
                    {p === "ig" ? "Instagram" : p === "tt" ? "TikTok" : "YT Shorts"}
                  </button>
                ))}
              </div>
            </div>

            {descriptions.ig && (
              <div className="space-y-2">
                {selectedPlatforms.map((p) => (
                  <div key={p}>
                    <label className="text-[10px] text-terracota font-bold tracking-wide">{p.toUpperCase()}</label>
                    <Textarea value={descriptions[p] || ""} onChange={(e) => setDescriptions((prev) => ({ ...prev, [p]: e.target.value }))} rows={3} className="mt-1 text-xs" />
                  </div>
                ))}
                <Button className="w-full bg-terracota hover:bg-terracota/90">Programar publicación</Button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[11px] text-muted-foreground tracking-wide mb-3">COLA DE PUBLICACIÓN</div>
          <div className="space-y-2">
            {queue.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 p-3 bg-border-light/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{entry.hook_preview}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{entry.date} · {entry.time_slot?.slice(0, 5)}</span>
                    {entry.platform.map((p) => <PlatformBadge key={p} platform={p} />)}
                  </div>
                </div>
                <StatusBadge status={entry.status} />
                <Button size="sm" variant="outline" className="text-[10px] h-7 shrink-0" onClick={() => generateDescriptions(entry)}>
                  {generating ? "..." : "Generar"}
                </Button>
              </div>
            ))}
            {queue.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No hay posts en cola</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
