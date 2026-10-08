/** The three windows the Insights page and the printable report share. */
export const INSIGHT_RANGES = [7, 30, 90] as const;
export type InsightRange = (typeof INSIGHT_RANGES)[number];

export const DEFAULT_INSIGHT_RANGE: InsightRange = 30;

export function parseInsightRange(value: string | string[] | undefined): InsightRange {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  return (INSIGHT_RANGES as readonly number[]).includes(parsed) ? (parsed as InsightRange) : DEFAULT_INSIGHT_RANGE;
}

export function describeRange(range: InsightRange): string {
  if (range === 7) return "the last 7 days";
  if (range === 30) return "the last 30 days";
  return "the last 90 days";
}

/** The Monday (UTC) of the week a date falls in, as YYYY-MM-DD. */
export function weekStartOf(date: Date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // getUTCDay(): 0 is Sunday, so Sunday belongs to the week that started 6 days earlier.
  const shift = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - shift);
  return utc.toISOString().slice(0, 10);
}
