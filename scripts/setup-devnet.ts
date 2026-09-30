// Alta del piloto en Solana devnet. Se puede ejecutar varias veces: solo hace lo que falte.
//
//   npm run setup:devnet
//
// 1. Si .env.local no tiene ISSUER_SECRET_KEY, genera la clave del emisor de demostración y la guarda ahí.
// 2. Si el emisor tiene poco SOL de prueba, lo pide al grifo (faucet) de devnet.
// 3. Crea la credencial del emisor en SAS, si no existe.
// 4. Crea el esquema de datos, si no existe.

import { existsSync, readFileSync, appendFileSync } from "node:fs";
import {
  createKeyPairSignerFromPrivateKeyBytes,
  getAddressEncoder,
  getBase58Decoder,
  lamports,
  type Address,
} from "@solana/kit";
import { fetchMaybeCredential, fetchMaybeSchema, getCreateCredentialInstruction, getCreateSchemaInstruction } from "sas-lib";
import { derivePilotAddresses } from "../src/protocol/addresses";
import { CREDENTIAL_NAME, SCHEMA_DESCRIPTION, SCHEMA_NAME, explorerUrl } from "../src/protocol/config";
import { loadIssuer } from "../src/protocol/issuer";
import { SCHEMA_FIELD_NAMES, SCHEMA_LAYOUT } from "../src/protocol/schema";
import { getRpc, sendAndConfirm } from "../src/protocol/solana";

const ENV_FILE = ".env.local";
const MIN_BALANCE = 500_000_000n; // 0,5 SOL de prueba
const AIRDROP = 1_000_000_000n; // 1 SOL de prueba

function readEnvFile(): Record<string, string> {
  if (!existsSync(ENV_FILE)) return {};
  return Object.fromEntries(
    readFileSync(ENV_FILE, "utf8")
      .split("\n")
      .map((line) => /^([A-Z0-9_]+)=(.*)$/.exec(line.trim()))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => [m[1], m[2].replace(/^"|"$/g, "")]),
  );
}

async function ensureIssuerKey(): Promise<void> {
  const env = readEnvFile();
  for (const key of ["ISSUER_SECRET_KEY", "SOLANA_RPC_URL"]) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }
  if (process.env.ISSUER_SECRET_KEY) return;

  const seed = crypto.getRandomValues(new Uint8Array(32));
  const signer = await createKeyPairSignerFromPrivateKeyBytes(seed);
  const full = new Uint8Array(64);
  full.set(seed);
  full.set(getAddressEncoder().encode(signer.address), 32);
  const secret = getBase58Decoder().decode(full);

  appendFileSync(ENV_FILE, `\n# Emisor de demostración (devnet). Generado por scripts/setup-devnet.ts\nISSUER_SECRET_KEY=${secret}\n`);
  process.env.ISSUER_SECRET_KEY = secret;
  console.log(`• Clave del emisor generada y guardada en ${ENV_FILE}`);
}

async function ensureBalance(owner: Address): Promise<void> {
  const rpc = getRpc();
  const { value: balance } = await rpc.getBalance(owner, { commitment: "confirmed" }).send();
  console.log(`• Saldo del emisor: ${Number(balance) / 1e9} SOL (devnet)`);
  if (balance >= MIN_BALANCE) return;

  console.log("• Pidiendo 1 SOL de prueba al grifo de devnet…");
  const signature = await rpc.requestAirdrop(owner, lamports(AIRDROP), { commitment: "confirmed" }).send();
  for (let i = 0; i < 60; i++) {
    const { value } = await rpc.getSignatureStatuses([signature]).send();
    if (value[0]?.confirmationStatus === "confirmed" || value[0]?.confirmationStatus === "finalized") {
      console.log("  Recibido.");
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("El grifo de devnet no confirmó a tiempo");
}

async function main() {
  await ensureIssuerKey();
  const { signer } = await loadIssuer();
  console.log(`• Emisor: ${signer.address}`);

  await ensureBalance(signer.address);

  const rpc = getRpc();
  const { credential, schema } = await derivePilotAddresses(signer.address);

  if ((await fetchMaybeCredential(rpc, credential)).exists) {
    console.log(`• Credencial ya existía: ${credential}`);
  } else {
    const signature = await sendAndConfirm(rpc, signer, [
      getCreateCredentialInstruction({ payer: signer, credential, authority: signer, name: CREDENTIAL_NAME, signers: [signer.address] }),
    ]);
    console.log(`• Credencial creada: ${credential}\n  ${explorerUrl("tx", signature)}`);
  }

  if ((await fetchMaybeSchema(rpc, schema)).exists) {
    console.log(`• Esquema ya existía: ${schema}`);
  } else {
    const signature = await sendAndConfirm(rpc, signer, [
      getCreateSchemaInstruction({
        payer: signer,
        authority: signer,
        credential,
        schema,
        name: SCHEMA_NAME,
        description: SCHEMA_DESCRIPTION,
        layout: SCHEMA_LAYOUT,
        fieldNames: [...SCHEMA_FIELD_NAMES],
      }),
    ]);
    console.log(`• Esquema creado: ${schema}\n  ${explorerUrl("tx", signature)}`);
  }

  console.log(`\nListo. Pon ISSUER_AUTHORITY = "${signer.address}" en src/protocol/config.ts si aún no está.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
