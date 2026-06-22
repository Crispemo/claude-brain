"use client";

import { Input } from "@/components/ui/input";
import { HOOK_TYPES } from "@/lib/constants";

interface HookFiltersProps {
  sources: string[];
  activeSource: string | null;
  activeType: string | null;
  activeSort: string;
  searchQuery: string;
  onSourceChange: (source: string | null) => void;
  onTypeChange: (type: string | null) => void;
  onSortChange: (sort: string) => void;
  onSearchChange: (query: string) => void;
}

export function HookFilters({ sources, activeSource, activeType, activeSort, searchQuery, onSourceChange, onTypeChange, onSortChange, onSearchChange }: HookFiltersProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => onSourceChange(null)} className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${!activeSource ? "bg-foreground text-white" : "bg-card border border-border text-muted-foreground"}`}>Todos</button>
        {sources.map((s) => (
          <button key={s} onClick={() => onSourceChange(s === activeSource ? null : s)} className={`px-3 py-1 rounded-full text-[11px] transition-colors ${s === activeSource ? "bg-foreground text-white" : "bg-card border border-border text-muted-foreground"}`}>{s}</button>
        ))}
      </div>
      <div className="flex gap-1.5 flex-wrap items-center">
        <span className="text-[10px] text-muted-foreground tracking-wide mr-1">TIPO:</span>
        <button onClick={() => onTypeChange(null)} className={`px-2.5 py-1 rounded-full text-[11px] ${!activeType ? "bg-terracota-bg-strong text-terracota font-medium" : "bg-card border border-border text-muted-foreground"}`}>Todas</button>
        {HOOK_TYPES.map((t) => (
          <button key={t.value} onClick={() => onTypeChange(t.value === activeType ? null : t.value)} className={`px-2.5 py-1 rounded-full text-[11px] ${t.value === activeType ? `${t.color} font-medium` : "bg-card border border-border text-muted-foreground"}`}>{t.label}</button>
        ))}
      </div>
      <div className="flex gap-1.5 items-center flex-wrap">
        <span className="text-[10px] text-muted-foreground tracking-wide mr-1">ORDENAR:</span>
        {[{ value: "views", label: "Más vistas" }, { value: "recent", label: "Recientes" }, { value: "saves", label: "Top guardados" }].map((s) => (
          <button key={s.value} onClick={() => onSortChange(s.value)} className={`px-2.5 py-1 rounded-full text-[11px] ${activeSort === s.value ? "bg-foreground text-white" : "bg-card border border-border text-muted-foreground"}`}>{s.label}</button>
        ))}
        <div className="ml-auto">
          <Input placeholder="Buscar en hooks..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="h-8 w-[200px] text-xs" />
        </div>
      </div>
    </div>
  );
}
