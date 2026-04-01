/** Parse "10:00 AM" / "02:30 PM" to 24h "HH:MM:00" for ISO datetime. */
export function timeSlotToISOTime(timeSlot: string): string {
  const normalized = String(timeSlot)
    .trim()
    .replace(/\u202f|\u00a0/g, " ");
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "10:00:00";
  let [, h, m, period] = match;
  let hour = parseInt(h!, 10);
  const min = m!;
  if (period?.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (period?.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${min}:00`;
}

/** Local scheduled instant from booking date + time slot label. */
export function getScheduledAtMs(dateStr: string, timeSlot: string): number | null {
  const t = timeSlotToISOTime(timeSlot);
  const d = new Date(`${dateStr}T${t}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

/** Formats remaining milliseconds as a readable countdown. */
export function formatDurationMs(ms: number, compact = false): string {
  if (ms <= 0) return compact ? "0:00" : "0 min";
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (compact) {
    if (days > 0) return `${days}d ${h}h`;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  if (days > 0) return `${days}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
