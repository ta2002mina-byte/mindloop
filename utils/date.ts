/**
 * Dates are formatted with a fixed locale and time zone so the server-rendered
 * markup always matches what React expects on the client (no hydration warnings,
 * no "19 Sep" turning into "Sep 19" after hydration).
 */
const LOCALE = "en-GB";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dayMonthFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "19 Sep 2026" from a timestamptz. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return dateFormatter.format(date);
}

/** "19 Sep 2026" from a YYYY-MM-DD date column (no time zone shifting). */
export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return dateFormatter.format(date);
}

/** "Today", "Yesterday", "4 days ago", then a plain date. */
export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const days = daysBetween(startOfUtcDay(date), startOfUtcDay(new Date()));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return `${days} days ago`;
  return dayMonthFormatter.format(date);
}

/** Plain-language due date, used next to an action. */
export function describeDueDate(value: string | null | undefined): { label: string; isOverdue: boolean } {
  if (!value) return { label: "", isOverdue: false };

  const due = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(due.getTime())) return { label: "", isOverdue: false };

  const days = daysBetween(due, startOfUtcDay(new Date()));
  if (days === 0) return { label: "Due today", isOverdue: false };
  if (days === 1) return { label: "Due yesterday", isOverdue: true };
  if (days > 1) return { label: `Overdue by ${days} days`, isOverdue: true };
  if (days === -1) return { label: "Due tomorrow", isOverdue: false };
  return { label: `Due ${formatDateOnly(value)}`, isOverdue: false };
}

/** Today as YYYY-MM-DD, for the `min` attribute of a date input. */
export function todayAsDateInput(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Whole days from `date` to `reference`. Positive means `date` is in the past. */
function daysBetween(date: Date, reference: Date): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((startOfUtcDay(reference).getTime() - startOfUtcDay(date).getTime()) / MS_PER_DAY);
}

/* -------------------------------------------------------------------------- */
/* Phase 3: date-only helpers for predictions and capsules (all UTC)          */
/* -------------------------------------------------------------------------- */

/** Today as YYYY-MM-DD in UTC, the same "today" the database uses. */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Adds (or subtracts) whole days to a YYYY-MM-DD string. */
export function addDaysUtc(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** True once the given day is today or in the past. */
export function hasDateArrived(value: string): boolean {
  return value <= todayUtc();
}

/** Whole days from today until the date. 0 = today, negative = already past. */
export function daysUntil(value: string): number {
  const target = new Date(`${value}T00:00:00Z`).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.round((target - startOfUtcDay(new Date()).getTime()) / 86_400_000);
}

/** "in 3 days", "tomorrow", "today", "2 days ago". */
export function describeDaysUntil(value: string): string {
  const days = daysUntil(value);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 1) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/** "19 Sep" from a YYYY-MM-DD date. */
export function formatDayMonth(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return dayMonthFormatter.format(date);
}

/** A local YYYY-MM-DD `days` from now, for the default value of a date input. */
export function dateInputInDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
