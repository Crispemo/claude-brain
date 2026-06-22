import { PlatformBadge } from "./platform-badge";
import { CALENDAR_STATUS_CONFIG } from "@/lib/constants";
import type { CalendarEntry } from "@/lib/types";

interface Props {
  day: number;
  isToday: boolean;
  entries: CalendarEntry[];
  onEntryClick: (entry: CalendarEntry) => void;
}

export function CalendarDayCell({ day, isToday, entries, onEntryClick }: Props) {
  return (
    <div className={`border-r border-b border-border-light p-1.5 min-h-[100px] ${isToday ? "bg-terracota-bg" : ""}`}>
      <div className={`text-[11px] font-semibold mb-1 ${isToday ? "text-terracota" : "text-foreground"}`}>{day}</div>
      <div className="space-y-1">
        {entries.map((entry) => {
          const borderColor =
            entry.status === "published" ? "border-l-status-published"
            : entry.status === "scheduled" ? "border-l-status-scheduled"
            : entry.status === "video_pending" ? "border-l-status-pending"
            : "border-l-status-draft";

          return (
            <button key={entry.id} onClick={() => onEntryClick(entry)} className={`w-full text-left border-l-2 ${borderColor} rounded-r bg-card/80 px-1.5 py-1 hover:bg-border-light transition-colors`}>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-semibold text-muted-foreground">{entry.time_slot?.slice(0, 5)}</span>
                {entry.platform.map((p) => <PlatformBadge key={p} platform={p} />)}
                {entry.status === "published" && <span className="text-[9px] text-status-published ml-auto">✓</span>}
                {entry.reel_metric?.is_bombazo && <span className="text-[9px] ml-auto">🔥</span>}
              </div>
              <div className="text-[10px] text-foreground leading-snug mt-0.5 line-clamp-2">{entry.hook_preview}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
