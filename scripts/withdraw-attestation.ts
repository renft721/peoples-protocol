// Retira (cierra) una atestación del emisor de demostración. Solo devnet.
//
//   npm run withdraw -- <dirección> --yes
//   npm run withdraw -- example --yes      # la prueba de ejemplo de config.ts
//
// Para qué sirve en el piloto: solo hay una factura de ejemplo de la AEAT que responde
// «Encontrada». Retirarla antes de una demo permite registrarla de cero en directo.
// La retirada queda en el historial público de Solana: la página de comprobación la muestra
// como «Prueba retirada» (decisión 4 de Docs/plan.md).

import { existsSync, readFileSync } from "node:fs";
import { address, isAddress } from "@solana/kit";
import { deriveEventAuthorityAddress, fetchMaybeAttestation, getCloseAttestationInstruction } from "sas-lib";
import { derivePilotAddresses } from "../src/protocol/addresses";
import { EXAMPLE_PROOF, explorerUrl } from "../src/protocol/config";
import { loadIssuer } from "../src/protocol/issuer";
import { getRpc, sendAndConfirm } from "../src/protocol/solana";

function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

async function main() {
  loadEnv();
  const [target, confirm] = process.argv.slice(2);
  const value = target === "example" ? EXAMPLE_PROOF.attestation : target;
  if (!value || !isAddress(value)) throw new Error("Uso: npm run withdraw -- <dirección|example> --yes");
  if (confirm !== "--yes") throw new Error("Añade --yes para confirmar: la retirada no se puede deshacer (solo volver a registrar).");

  const rpc = getRpc();
  const attestation = address(value);
  const existing = await fetchMaybeAttestation(rpc, attestation);
  if (!existing.exists) {
    console.log("No existe (o ya estaba retirada). Nada que hacer.");
    return;
  }

  const { signer } = await loadIssuer();
  const { credential } = await derivePilotAddresses(signer.address);
  if (existing.data.credential !== credential) throw new Error("La atestación no es de este emisor");

  const signature = await sendAndConfirm(rpc, signer, [
    getCloseAttestationInstruction({
      payer: signer,
      authority: signer,
      credential,
      attestation,
      eventAuthority: await deriveEventAuthorityAddress(),
    }),
  ]);
  console.log(`Retirada: ${attestation}\n${explorerUrl("tx", signature)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
