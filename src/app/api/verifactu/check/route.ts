import { AeatUnavailableError, checkInvoiceWithAeat } from "@/protocol/aeat";
import { isOwnInvoice } from "@/protocol/issuer";
import { invoicePeriod, parseVerifactuQr } from "@/protocol/verifactu";

// Paso 2 del asistente: comprobar la factura contra la AEAT, sin registrar nada todavía.
// POST { qr: "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?..." }

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { qr?: unknown } | null;
  if (typeof body?.qr !== "string") return Response.json({ error: "bad_request" }, { status: 400 });

  const parsed = parseVerifactuQr(body.qr);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 422 });

  try {
    const verdict = await checkInvoiceWithAeat(parsed.invoice);
    return Response.json({
      verdict,
      invoice: parsed.invoice,
      period: invoicePeriod(parsed.invoice),
      /** Si es false, Hacienda puede confirmarla, pero esta agencia no la registrará: no la emitió ella. */
      issuerAccepts: isOwnInvoice(parsed.invoice),
    });
  } catch (error) {
    if (error instanceof AeatUnavailableError) return Response.json({ error: "aeat_unavailable" }, { status: 502 });
    throw error;
  }
}
