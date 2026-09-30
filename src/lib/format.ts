// Formatos de importes, fechas y direcciones según el idioma (DESIGN.md §7).
import type { Locale } from "@/i18n/config";

const intlLocale: Record<Locale, string> = { en: "en-GB", es: "es-ES" };

/** "241.40" → "241,40 €" (es) · "€241.40" (en) */
export function formatAmount(lang: Locale, amount: string): string {
  return new Intl.NumberFormat(intlLocale[lang], { style: "currency", currency: "EUR" }).format(Number(amount));
}

/** "01-09-2024" (formato del QR) → "1 de septiembre de 2024" · "1 September 2024" */
export function formatInvoiceDate(lang: Locale, ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split("-").map(Number);
  return formatDate(lang, new Date(Date.UTC(yyyy, mm - 1, dd)));
}

/** "2024-09" → "septiembre de 2024" · "September 2024" */
export function formatPeriod(lang: Locale, period: string): string {
  const [yyyy, mm] = period.split("-").map(Number);
  return new Intl.DateTimeFormat(intlLocale[lang], { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(yyyy, mm - 1, 1)),
  );
}

/** Segundos desde 1970 → fecha larga. */
export function formatTimestamp(lang: Locale, seconds: number): string {
  return formatDate(lang, new Date(seconds * 1000));
}

function formatDate(lang: Locale, date: Date): string {
  return new Intl.DateTimeFormat(intlLocale[lang], { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" }).format(date);
}

/** "HmD3Qv7bvL6Y3wtDZ6KZ5LpYGnJAkH8sg98yEHqy9hwM" → "HmD3…9hwM" */
export function shortAddress(value: string): string {
  return value.length > 12 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}

/** Sustituye {clave} en una plantilla del diccionario. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
