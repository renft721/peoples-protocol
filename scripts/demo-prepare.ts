// Deja devnet lista para la demo en directo. Se puede repetir sin riesgo.
//
//   npm run demo:prepare -- --holder <wallet de la titular de la demo> --yes
//
// 1. Publica los pagos afirmados por la agencia de octubre de 2024 a agosto de 2025 para esa
//    wallet (los que ya estén se saltan).
// 2. Retira la prueba de la factura de ejemplo, para que en la demo se registre en directo
//    (septiembre de 2024) y el historial pase de 11 a 12 meses delante de los jueces.
// 3. Comprueba que Hacienda responde y que al emisor le queda saldo.
//
// Si al final no se hace la demo en directo: `npm run demo:attest -- --holder <wallet>` la restaura
// (mismo enlace de siempre: la sal no cambia).

import { existsSync, readFileSync } from "node:fs";
import { address, isAddress } from "@solana/kit";
import { deriveEventAuthorityAddress, fetchMaybeAttestation, getCloseAttestationInstruction } from "sas-lib";
import { derivePilotAddresses } from "../src/protocol/addresses";
import { checkInvoiceWithAeat } from "../src/protocol/aeat";
import { EXAMPLE_PROOF, ISSUER_AUTHORITY, SAMPLE_QR } from "../src/protocol/config";
import { attestIssuerStatement, loadIssuer } from "../src/protocol/issuer";
import { getRpc, sendAndConfirm } from "../src/protocol/solana";
import { parseVerifactuQr } from "../src/protocol/verifactu";

const STATEMENT_MONTHS = ["2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08"];

function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const pause = () => new Promise((resolve) => setTimeout(resolve, 3000));

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  const holder = args[args.indexOf("--holder") + 1];
  if (!args.includes("--holder") || !holder || !isAddress(holder)) throw new Error("Uso: npm run demo:prepare -- --holder <wallet> --yes");
  if (!args.includes("--yes")) throw new Error("Añade --yes para confirmar (publica y retira en devnet).");

  console.log("1. Pagos afirmados por la agencia (oct 2024 – ago 2025)");
  for (const period of STATEMENT_MONTHS) {
    const result = await attestIssuerStatement(holder, period);
    console.log(`   ${period}  ${result.status === "created" ? "publicado" : "ya estaba"}`);
    if (result.status === "created") await pause();
  }

  console.log("2. Retirar la prueba de ejemplo para registrarla en directo");
  const rpc = getRpc();
  const example = address(EXAMPLE_PROOF.attestation);
  if ((await fetchMaybeAttestation(rpc, example)).exists) {
    const { signer } = await loadIssuer();
    const { credential } = await derivePilotAddresses(signer.address);
    await sendAndConfirm(rpc, signer, [
      getCloseAttestationInstruction({
        payer: signer,
        authority: signer,
        credential,
        attestation: example,
        eventAuthority: await deriveEventAuthorityAddress(),
      }),
    ]);
    console.log("   Retirada.");
  } else {
    console.log("   Ya estaba retirada.");
  }

  console.log("3. Comprobaciones");
  const sample = parseVerifactuQr(SAMPLE_QR);
  const aeat = sample.ok ? (await checkInvoiceWithAeat(sample.invoice)).status : "sample_invalid";
  const { value } = await rpc.getBalance(address(ISSUER_AUTHORITY)).send();
  console.log(`   Hacienda: ${aeat === "found" ? "responde ✔" : `PROBLEMA (${aeat})`}`);
  console.log(`   Saldo del emisor: ${Number(value) / 1e9} SOL ${Number(value) > 1e8 ? "✔" : "— BAJO, recargar en faucet.solana.com"}`);
  console.log("\nListo. En la demo: conectar la wallet de la titular ANTES de registrar la factura de ejemplo.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
