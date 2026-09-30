import { AeatUnavailableError, checkInvoiceWithAeat } from "@/protocol/aeat";
import { attestInvoice, isOwnInvoice } from "@/protocol/issuer";
import { encodeEvidence } from "@/protocol/link";
import { parseVerifactuQr } from "@/protocol/verifactu";

// Paso 3 del asistente: registrar la prueba en Solana.
// POST { qr: "...", holder?: "<wallet>" }
//
// Vuelve a preguntar a la AEAT aunque el navegador ya lo hiciera en el paso 2:
// lo que llega del navegador no se da por bueno.
//
// Respuesta si se crea: la dirección de la atestación y la evidencia codificada para el enlace.
// La evidencia (datos + sal) se devuelve UNA sola vez y no se guarda en ningún sitio:
// si la persona pierde el enlace, la atestación sigue existiendo pero ya no puede mostrar el importe.

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { qr?: unknown; holder?: unknown } | null;
  if (typeof body?.qr !== "string" || (body.holder !== undefined && typeof body.holder !== "string")) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = parseVerifactuQr(body.qr);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 422 });
  // La agencia solo da fe de sus propias facturas (antes de preguntar a Hacienda: no hace falta).
  if (!isOwnInvoice(parsed.invoice)) return Response.json({ error: "not_issuer_invoice" }, { status: 422 });

  let verdict;
  try {
    verdict = await checkInvoiceWithAeat(parsed.invoice);
  } catch (error) {
    if (error instanceof AeatUnavailableError) return Response.json({ error: "aeat_unavailable" }, { status: 502 });
    throw error;
  }
  if (verdict.status !== "found") return Response.json({ error: "invoice_not_verified", verdict }, { status: 422 });

  try {
    const result = await attestInvoice(parsed.invoice, { holder: body.holder });
    if (result.status === "duplicate") {
      return Response.json({ status: "duplicate", attestation: result.attestation }, { status: 409 });
    }
    return Response.json({
      status: "created",
      attestation: result.attestation,
      signature: result.signature,
      period: result.period,
      evidence: encodeEvidence({ invoice: parsed.invoice, salt: result.salt }),
    });
  } catch (error) {
    console.error("Error al registrar la atestación", error);
    return Response.json({ error: "chain_error" }, { status: 502 });
  }
}
