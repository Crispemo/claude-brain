"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScriptViewer } from "./script-viewer";
import { StatusBadge } from "./status-badge";
import { PlatformBadge } from "./platform-badge";
import type { CalendarEntry } from "@/lib/types";

interface Props {
  entry: CalendarEntry | null;
  open: boolean;
  onClose: () => void;
}

export function CalendarSidePanel({ entry, open, onClose }: Props) {
  if (!entry) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[420px] overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle className="text-base">{entry.date} · {entry.time_slot?.slice(0, 5)}</SheetTitle>
          <div className="flex items-center gap-2 mt-1">
            {entry.platform.map((p) => <PlatformBadge key={p} platform={p} />)}
            <StatusBadge status={entry.status} />
          </div>
        </SheetHeader>

        <div className="mt-6">
          {entry.script ? <ScriptViewer script={entry.script} /> : <p className="text-sm text-muted-foreground">Sin guion asignado</p>}
        </div>

        {entry.reel_metric && (
          <div className="mt-6 p-4 bg-card border border-border rounded-lg">
            <div className="text-[10px] text-muted-foreground tracking-wide mb-2">MÉTRICAS REALES</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Views:</span> <span className="font-bold">{entry.reel_metric.views.toLocaleString()}</span></div>
              <div><span className="text-muted-foreground">Likes:</span> <span className="font-bold">{entry.reel_metric.likes.toLocaleString()}</span></div>
              <div><span className="text-muted-foreground">Guardados:</span> <span className="font-bold">{entry.reel_metric.saves.toLocaleString()}</span></div>
              <div><span className="text-muted-foreground">Comentarios:</span> <span className="font-bold">{entry.reel_metric.comments.toLocaleString()}</span></div>
            </div>
            {entry.reel_metric.is_bombazo && (
              <div className="mt-3 text-sm text-terracota font-semibold">🔥 Bombazo x{entry.reel_metric.bombazo_multiplier?.toFixed(1)}</div>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <Button className="flex-1 bg-terracota hover:bg-terracota/90 text-sm">Publicar</Button>
          <Button variant="outline" className="text-sm">Editar</Button>
          {entry.reel_metric?.is_bombazo && (
            <Button variant="outline" className="text-sm text-terracota border-terracota">Crear Trial →</Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
