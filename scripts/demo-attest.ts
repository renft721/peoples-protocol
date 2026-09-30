// Prueba de punta a punta del núcleo del protocolo (criterio de cierre de la Fase 1).
//
//   npm run demo:attest                 # factura de ejemplo de la AEAT
//   npm run demo:attest -- "<URL QR>"   # otra factura
//
// 1. Lee el QR  2. Pregunta a la AEAT  3. Publica la atestación en devnet
// 4. La vuelve a leer de la cadena  5. Comprueba que el enlace cuadra con la huella registrada
// 6. Intenta registrarla otra vez y comprueba que se rechaza como duplicada

import { existsSync, readFileSync } from "node:fs";
import { checkInvoiceWithAeat } from "../src/protocol/aeat";
import { explorerUrl } from "../src/protocol/config";
import { bytesEqual, evidenceCommitment } from "../src/protocol/evidence";
import { attestInvoice } from "../src/protocol/issuer";
import { decodeEvidence, encodeEvidence, verifyPath } from "../src/protocol/link";
import { readAttestation } from "../src/protocol/read";
import { parseVerifactuQr } from "../src/protocol/verifactu";

const SAMPLE_QR =
  "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678-G33&fecha=01-09-2024&importe=241.4";

function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const hexToBytes = (hex: string) => Uint8Array.from(hex.match(/../g)!.map((h) => parseInt(h, 16)));

async function main() {
  loadEnv();
  const qr = process.argv[2] ?? SAMPLE_QR;

  const parsed = parseVerifactuQr(qr);
  if (!parsed.ok) throw new Error(`QR no válido: ${parsed.error}`);
  console.log("1. QR leído:", parsed.invoice);

  const verdict = await checkInvoiceWithAeat(parsed.invoice);
  console.log("2. AEAT:", verdict);
  if (verdict.status !== "found") throw new Error("La AEAT no encuentra la factura");

  const result = await attestInvoice(parsed.invoice);
  if (result.status === "duplicate") {
    console.log(`3. Ya estaba registrada (antiduplicado): ${result.attestation}\n   ${explorerUrl("address", result.attestation)}`);
    const again = await readAttestation(result.attestation);
    console.log("4. Leída de la cadena:", again);
    return;
  }
  console.log(`3. Atestación publicada: ${result.attestation}\n   ${explorerUrl("tx", result.signature)}`);

  const read = await readAttestation(result.attestation);
  console.log("4. Leída de la cadena:", read);
  if (read.status !== "found") throw new Error("No se pudo leer la atestación recién creada");

  const evidence = decodeEvidence(encodeEvidence({ invoice: parsed.invoice, salt: result.salt }))!;
  const matches = bytesEqual(
    await evidenceCommitment(evidence.invoice, evidence.salt),
    hexToBytes(read.attestation.evidenceCommitment),
  );
  console.log(`5. El enlace cuadra con la huella registrada: ${matches ? "SÍ" : "NO"}`);
  if (!matches) throw new Error("La huella no coincide");
  console.log(`   Enlace: https://peoples-protocol.vercel.app${verifyPath("es", result.attestation, evidence)}`);

  const second = await attestInvoice(parsed.invoice);
  console.log(`6. Segundo intento con la misma factura: ${second.status === "duplicate" ? "rechazado como duplicado ✔" : "¡SE CREÓ OTRA! ✘"}`);
  if (second.status !== "duplicate") throw new Error("El antiduplicado no funcionó");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
