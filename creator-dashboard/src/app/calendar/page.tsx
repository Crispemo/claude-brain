"use client";

import { useEffect, useState, useCallback } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/calendar-grid";
import { CalendarSidePanel } from "@/components/calendar-side-panel";
import type { CalendarEntry } from "@/lib/types";

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchEntries = useCallback(async () => {
    const monthStr = format(month, "yyyy-MM");
    const res = await fetch(`/api/calendar?month=${monthStr}`);
    const data = await res.json();
    if (Array.isArray(data)) setEntries(data);
  }, [month]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground capitalize">{format(month, "MMMM yyyy", { locale: es })}</h1>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setMonth(subMonths(month, 1))}>←</Button>
            <Button variant="outline" size="sm" onClick={() => setMonth(addMonths(month, 1))}>→</Button>
          </div>
        </div>
        <Button className="bg-terracota hover:bg-terracota/90 text-sm">+ Desde Content Engine</Button>
      </div>

      <div className="mb-4 flex gap-4 text-[11px]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-status-published" /> Publicado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-status-scheduled" /> Programado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-status-pending" /> Pendiente vídeo</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-status-draft" /> Borrador</span>
      </div>

      <CalendarGrid month={month} entries={entries} onEntryClick={(entry) => { setSelectedEntry(entry); setPanelOpen(true); }} />
      <CalendarSidePanel entry={selectedEntry} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
