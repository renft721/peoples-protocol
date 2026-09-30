// Consulta al servicio público de verificación de facturas VeriFactu de la AEAT.
//
// Es la misma página que abre un ciudadano al escanear el QR: no pide sesión ni certificado.
// Solo puede llamarse desde el servidor (el navegador bloquea las peticiones a otro dominio).
// Respuestas reales guardadas en __fixtures__/ para los tests.

import { verifactuCheckUrl, type VerifactuInvoice } from "./verifactu";

export type AeatVerdict =
  | { status: "found" }
  | { status: "not_found" }
  /** La AEAT rechazó los datos (formato de fecha, importe…). */
  | { status: "rejected"; messages: string[] }
  /** La página no tiene la forma esperada: la AEAT la ha cambiado o está caída. */
  | { status: "unrecognized" };

function pageText(html: string): string {
  const withoutCode = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ");
  return decodeEntities(withoutCode.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
}

function decodeEntities(text: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const value = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : entity;
    }
    if (named[code.toLowerCase()]) return named[code.toLowerCase()];
    // Vocales acentuadas y eñes de la página (&aacute;, &ntilde;…).
    const accent = /^([aeiounAEIOUN])(acute|tilde|uml)$/.exec(code);
    if (accent) return (accent[1] + { acute: "́", tilde: "̃", uml: "̈" }[accent[2]]).normalize("NFC");
    return entity;
  });
}

/** Interpreta la página HTML que devuelve la AEAT. Función pura: no hace ninguna petición. */
export function parseAeatResponse(html: string): AeatVerdict {
  const text = pageText(html);
  // El orden importa: "no consta" contiene "consta".
  if (/no consta informaci[oó]n de ninguna factura/i.test(text)) return { status: "not_found" };
  if (/consta informaci[oó]n de una factura/i.test(text)) return { status: "found" };
  const errors = [...text.matchAll(/ERROR:\s*(.+?)(?=\s*ERROR:|\s+Agencia Tributaria|$)/g)].map((m) => m[1].trim());
  if (errors.length > 0) return { status: "rejected", messages: errors };
  return { status: "unrecognized" };
}

export class AeatUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AeatUnavailableError";
  }
}

const TIMEOUT_MS = 15_000;

/** Pregunta a la AEAT si la factura existe. Lanza AeatUnavailableError si no se puede contactar. */
export async function checkInvoiceWithAeat(invoice: VerifactuInvoice): Promise<AeatVerdict> {
  let response: Response;
  try {
    response = await fetch(verifactuCheckUrl(invoice), {
      headers: { "Accept-Language": "es-ES,es;q=0.9", "User-Agent": "PeoplesProtocol-pilot/0.1 (+https://peoples-protocol.vercel.app)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    throw new AeatUnavailableError("No se pudo contactar con la AEAT", { cause: error });
  }
  if (!response.ok) throw new AeatUnavailableError(`La AEAT respondió ${response.status}`);

  // La página viene en ISO-8859-15, no en UTF-8.
  const html = new TextDecoder("iso-8859-15").decode(await response.arrayBuffer());
  return parseAeatResponse(html);
}
