"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { HookCard } from "@/components/hook-card";
import { HookFilters } from "@/components/hook-filters";
import type { Hook } from "@/lib/types";

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState("views");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchHooks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeSource) params.set("source", activeSource);
    if (activeType) params.set("type", activeType);
    params.set("sort", activeSort);
    if (searchQuery) params.set("q", searchQuery);

    const res = await fetch(`/api/hooks?${params}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setHooks(data);
      if (sources.length === 0) {
        setSources([...new Set(data.map((h: Hook) => h.source))] as string[]);
      }
    }
    setLoading(false);
  }, [activeSource, activeType, activeSort, searchQuery, sources.length]);

  useEffect(() => { fetchHooks(); }, [fetchHooks]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Baúl de Ganchos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{hooks.length} hooks</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-terracota hover:bg-terracota/90 text-sm">+ Agregar Hook</Button>
          <Button variant="outline" className="text-sm">Importar</Button>
        </div>
      </div>

      <HookFilters sources={sources} activeSource={activeSource} activeType={activeType} activeSort={activeSort} searchQuery={searchQuery} onSourceChange={setActiveSource} onTypeChange={setActiveType} onSortChange={setActiveSort} onSearchChange={setSearchQuery} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
        {hooks.map((hook) => (
          <HookCard key={hook.id} hook={hook} onUse={(h) => { window.location.href = `/engine?hook=${h.id}`; }} onAnalyze={(h) => alert(`Análisis de: "${h.text}"`)} />
        ))}
      </div>

      {!loading && hooks.length === 0 && (
        <div className="text-center py-20 text-muted-foreground text-sm">No hay hooks todavía. Agrega uno manualmente o importa desde Competencia.</div>
      )}
    </div>
  );
}
