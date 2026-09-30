// Publicación en lote de pagos AFIRMADOS por el emisor (sin factura ni comprobación de Hacienda).
// Simula lo que haría la agencia desde su software de gestión: «este inquilino pagó estos meses».
// Cada prueba sale con el nivel de confianza «afirmado por el emisor», visible en el certificado.
//
//   npm run issuer:statements -- --holder <wallet> --from 2024-10 --to 2025-08 --yes
//
// Se puede repetir: los meses ya publicados para ese titular se saltan (antiduplicado).

import { existsSync, readFileSync } from "node:fs";
import { explorerUrl } from "../src/protocol/config";
import { attestIssuerStatement } from "../src/protocol/issuer";

function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

function arg(name: string): string | undefined {
  const args = process.argv.slice(2);
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

/** "2024-10" … "2025-08", ambos incluidos. */
function monthsBetween(from: string, to: string): string[] {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  const months: string[] = [];
  for (let y = fy, m = fm; y < ty || (y === ty && m <= tm); m === 12 ? (y++, (m = 1)) : m++) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    if (months.length > 60) throw new Error("Más de 60 meses: revisa --from y --to");
  }
  return months;
}

async function main() {
  loadEnv();
  const holder = arg("holder");
  const from = arg("from");
  const to = arg("to") ?? from;
  if (!holder || !from || !to) throw new Error("Uso: npm run issuer:statements -- --holder <wallet> --from AAAA-MM [--to AAAA-MM] --yes");
  if (!process.argv.includes("--yes")) throw new Error("Añade --yes para confirmar la publicación en devnet.");

  for (const period of monthsBetween(from, to)) {
    const result = await attestIssuerStatement(holder, period);
    if (result.status === "duplicate") console.log(`${period}  ya publicado  ${result.attestation}`);
    else console.log(`${period}  publicado     ${result.attestation}  ${explorerUrl("tx", result.signature)}`);
    // Pausa para no pasar el límite de peticiones del RPC público de devnet.
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
