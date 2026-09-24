/**
 * Delivery dates are stored as UTC midnight of the calendar day ("2026-03-14"
 * -> 2026-03-14T00:00:00.000Z). These helpers keep every query consistent with
 * that, independent of the server's own time zone.
 */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Baku";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "YYYY-MM-DD" -> Date at UTC midnight, or null when invalid. */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = DATE_RE.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return date;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Prisma filter for one calendar day. */
export function dayRange(value: string): { gte: Date; lt: Date } | null {
  const start = parseDateOnly(value);
  if (!start) return null;
  return { gte: start, lt: addDays(start, 1) };
}

/** Today's date ("YYYY-MM-DD") in the shop's time zone. */
export function todayISO(timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Date -> "YYYY-MM-DD" (UTC calendar day, matches how delivery dates are stored). */
export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Time of day "HH:mm" validation. */
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
