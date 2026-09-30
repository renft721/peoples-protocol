import { address } from "@solana/kit";
import { checkInvoiceWithAeat } from "@/protocol/aeat";
import { CLUSTER, ISSUER_AUTHORITY, SAMPLE_QR, PUBLIC_DEVNET_RPC } from "@/protocol/config";
import { getRpc } from "@/protocol/solana";
import { parseVerifactuQr } from "@/protocol/verifactu";

// Chequeo previo a la demo: ¿qué RPC se usa?, ¿responde Solana?, ¿le queda saldo al emisor?,
// ¿está la clave del emisor configurada? y, con ?aeat=1, ¿responde Hacienda?
// Solo muestra el nombre del servidor del RPC, nunca la URL completa (lleva la clave de Helius).

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MIN_BALANCE_SOL = 0.1;

export async function GET(request: Request) {
  const rpcUrl = process.env.SOLANA_RPC_URL || PUBLIC_DEVNET_RPC;
  const checks: Record<string, unknown> = {
    cluster: CLUSTER,
    rpcHost: new URL(rpcUrl).hostname,
    issuer: ISSUER_AUTHORITY,
    issuerKeyConfigured: Boolean(process.env.ISSUER_SECRET_KEY),
  };

  let ok = checks.issuerKeyConfigured === true;
  try {
    const started = Date.now();
    const { value } = await getRpc().getBalance(address(ISSUER_AUTHORITY), { commitment: "confirmed" }).send();
    checks.solanaMs = Date.now() - started;
    checks.issuerBalanceSol = Number(value) / 1e9;
    if (Number(value) / 1e9 < MIN_BALANCE_SOL) ok = false;
  } catch {
    checks.solana = "unreachable";
    ok = false;
  }

  if (new URL(request.url).searchParams.get("aeat") === "1") {
    const sample = parseVerifactuQr(SAMPLE_QR);
    try {
      checks.aeat = sample.ok ? (await checkInvoiceWithAeat(sample.invoice)).status : "sample_invalid";
      if (checks.aeat !== "found") ok = false;
    } catch {
      checks.aeat = "unreachable";
      ok = false;
    }
  }

  return Response.json({ ok, ...checks }, { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
