import { CALENDAR_STATUS_CONFIG } from "@/lib/constants";
import type { CalendarStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: CalendarStatus }) {
  const config = CALENDAR_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.color} text-white`}>
      {config.icon} {config.label}
    </span>
  );
}
