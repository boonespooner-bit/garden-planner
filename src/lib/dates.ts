/** Date helpers that work on plain calendar dates (no time-of-day, no timezone drift). */

export type MonthDay = `${string}-${string}`; // "04-15"

export function utcDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, Math.round(weeks * 7));
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return utcDate(y, m, d);
}

export function fromMonthDay(year: number, md: string): Date {
  const [m, d] = md.split("-").map(Number);
  // Feb 29 in a non-leap year rolls to Mar 1, which is fine for frost averages.
  return utcDate(year, m, d);
}

export function toMonthDay(date: Date): string {
  return isoDate(date).slice(5);
}

/** Today's calendar date in an IANA timezone, as a UTC-midnight Date. */
export function todayIn(timeZone: string, now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return parseIsoDate(parts);
}

export function formatDate(date: Date, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(date);
}

export function formatRange(start: Date, end: Date): string {
  if (isoDate(start) === isoDate(end)) return formatDate(start);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  return sameMonth
    ? `${formatDate(start)}–${end.getUTCDate()}`
    : `${formatDate(start)} – ${formatDate(end)}`;
}
