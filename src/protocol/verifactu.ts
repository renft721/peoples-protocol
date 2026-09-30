// Lectura del enlace del QR de una factura VeriFactu.
//
// El QR de VeriFactu es una URL pública de la AEAT con cuatro datos de la factura, p. ej.:
//   https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678-G33&fecha=01-09-2024&importe=241.4
// Aquí solo se interpreta y se valida: la consulta a Hacienda está en aeat.ts.

/** Entorno de la AEAT al que apunta el QR: producción o el de pruebas para desarrolladores. */
export type AeatEnvironment = "production" | "test";

export type VerifactuInvoice = {
  /** NIF de quien expide la factura, en mayúsculas. */
  issuerNif: string;
  /** Número de serie de la factura, tal cual. */
  invoiceNumber: string;
  /** Fecha de expedición en formato DD-MM-AAAA (el del QR). */
  issueDate: string;
  /** Importe total con dos decimales y punto, p. ej. "241.40". */
  amount: string;
  environment: AeatEnvironment;
};

const HOSTS: Record<string, AeatEnvironment> = {
  "www2.agenciatributaria.gob.es": "production",
  "prewww2.aeat.es": "test",
};

// Solo el QR de VeriFactu. Existe otro (ValidarQRNoVerifactu) para sistemas que no envían
// las facturas a Hacienda en el momento: esas no se pueden comprobar igual, así que no se aceptan.
const VERIFACTU_PATH = "/wlpl/TIKE-CONT/ValidarQR";

export type ParseError =
  | "not_a_url"
  | "not_aeat"
  | "not_verifactu"
  | "missing_field"
  | "invalid_nif"
  | "invalid_date"
  | "invalid_amount";

export type ParseResult = { ok: true; invoice: VerifactuInvoice } | { ok: false; error: ParseError };

const NIF_PATTERN = /^[0-9A-Z]{9}$/;
const DATE_PATTERN = /^(\d{2})-(\d{2})-(\d{4})$/;
const AMOUNT_PATTERN = /^-?\d{1,12}(\.\d{1,2})?$/;

export function parseVerifactuQr(input: string): ParseResult {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { ok: false, error: "not_a_url" };
  }

  const environment = HOSTS[url.hostname.toLowerCase()];
  if (url.protocol !== "https:" || !environment) return { ok: false, error: "not_aeat" };
  if (url.pathname !== VERIFACTU_PATH) return { ok: false, error: "not_verifactu" };

  const nif = url.searchParams.get("nif")?.trim().toUpperCase();
  const invoiceNumber = url.searchParams.get("numserie")?.trim();
  const issueDate = url.searchParams.get("fecha")?.trim();
  const rawAmount = url.searchParams.get("importe")?.trim();
  if (!nif || !invoiceNumber || !issueDate || !rawAmount) return { ok: false, error: "missing_field" };

  if (!NIF_PATTERN.test(nif)) return { ok: false, error: "invalid_nif" };
  if (!isValidDate(issueDate)) return { ok: false, error: "invalid_date" };
  if (!AMOUNT_PATTERN.test(rawAmount)) return { ok: false, error: "invalid_amount" };

  return {
    ok: true,
    invoice: { issuerNif: nif, invoiceNumber, issueDate, amount: Number(rawAmount).toFixed(2), environment },
  };
}

function isValidDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, dd, mm, yyyy] = match.map(Number);
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  return date.getUTCFullYear() === yyyy && date.getUTCMonth() === mm - 1 && date.getUTCDate() === dd;
}

/** Periodo AAAA-MM al que corresponde la factura, sacado de su fecha. */
export function invoicePeriod(invoice: VerifactuInvoice): string {
  const [, mm, yyyy] = invoice.issueDate.split("-");
  return `${yyyy}-${mm}`;
}

/** Vuelve a montar la URL oficial de comprobación a partir de los datos (misma forma que el QR). */
export function verifactuCheckUrl(invoice: VerifactuInvoice): string {
  const host = Object.keys(HOSTS).find((h) => HOSTS[h] === invoice.environment)!;
  const params = new URLSearchParams({
    nif: invoice.issuerNif,
    numserie: invoice.invoiceNumber,
    fecha: invoice.issueDate,
    importe: invoice.amount,
  });
  return `https://${host}${VERIFACTU_PATH}?${params.toString()}`;
}
