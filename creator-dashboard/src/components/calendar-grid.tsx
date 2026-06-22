"use client";

import { useMemo } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, isSameMonth } from "date-fns";
import { CalendarDayCell } from "./calendar-day-cell";
import { DAYS_OF_WEEK } from "@/lib/constants";
import type { CalendarEntry } from "@/lib/types";

interface Props {
  month: Date;
  entries: CalendarEntry[];
  onEntryClick: (entry: CalendarEntry) => void;
}

export function CalendarGrid({ month, entries, onEntryClick }: Props) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    entries.forEach((e) => {
      const key = e.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [entries]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="p-2.5 text-center text-[11px] text-muted-foreground tracking-wide font-medium">{d.toUpperCase()}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayEntries = entriesByDate.get(dateStr) || [];
          if (!isSameMonth(day, month)) {
            return <div key={dateStr} className="border-r border-b border-border-light p-2 min-h-[100px] opacity-20" />;
          }
          return <CalendarDayCell key={dateStr} day={day.getDate()} isToday={isToday(day)} entries={dayEntries} onEntryClick={onEntryClick} />;
        })}
      </div>
    </div>
  );
}
