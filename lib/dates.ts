/**
 * Business dates in Dominican Republic time (debug pass B-04 / E-05, approved 2026-10-18).
 *
 * The backend stores quotes/expenses created_at as naive UTC ("2026-10-19T01:30:00"),
 * and toISOString() is UTC too, so after 8 PM in Santo Domingo the ERP showed tomorrow.
 * Display formats are unchanged here; only the calendar day is corrected.
 */
export const BUSINESS_TZ = "America/Santo_Domingo";

const ymd = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today in Santo Domingo, YYYY-MM-DD. Use for date-input defaults. */
export function businessToday(now: Date = new Date()): string {
  return ymd.format(now);
}

/** Current month in Santo Domingo, YYYY-MM. */
export function businessMonth(now: Date = new Date()): string {
  return businessToday(now).slice(0, 7);
}

/** Parse a backend timestamp. Naive values (no Z or offset) are UTC. */
export function parseBackendTimestamp(value: string): Date {
  const hasZone = /[zZ]$|[+-]\d\d:?\d\d$/.test(value);
  return new Date(hasZone ? value : value.replace(" ", "T") + "Z");
}

/**
 * Santo Domingo calendar date (YYYY-MM-DD) of a backend timestamp.
 * Date-only values ("2026-10-18") are calendar dates already and pass through.
 */
export function localDate(value: string | null | undefined): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = parseBackendTimestamp(value);
  return Number.isNaN(d.getTime()) ? String(value).slice(0, 10) : ymd.format(d);
}

/** Same day, es-DO display format (dd/mm/aaaa), for places that already used it. */
export function localDateEsDO(value: string | null | undefined): string {
  if (!value) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T12:00:00Z") : parseBackendTimestamp(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("es-DO", { timeZone: BUSINESS_TZ });
}

/**
 * Calendar date (invoice_date, expense date, payment_date, valid_until, start_date) as dd/mm/aaaa
 * (debug E-03, approved 2026-10-18). Printed as stored: no time-zone shift, because these values
 * are calendar days (invoice_date is stored at midnight UTC of its day).
 */
export function fmtDay(value: string | null | undefined): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(value);
}

/** Timestamp (created_at) as dd/mm/aaaa on its Santo Domingo day (E-03 + E-05). */
export function fmtTimestamp(value: string | null | undefined): string {
  return fmtDay(localDate(value));
}

const hm = new Intl.DateTimeFormat("en-GB", {
  timeZone: BUSINESS_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Timestamp as "dd/mm/aaaa HH:mm" on the Santo Domingo clock (status history). */
export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const d = parseBackendTimestamp(String(value));
  if (Number.isNaN(d.getTime())) return "";
  return `${fmtDay(localDate(String(value)))} ${hm.format(d)}`;
}
