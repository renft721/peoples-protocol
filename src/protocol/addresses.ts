// Direcciones en Solana de la credencial (el emisor) y del esquema del piloto.
// Se calculan a partir de datos públicos: cualquiera puede reproducirlas.

import { address, type Address } from "@solana/kit";
import { deriveCredentialPda, deriveSchemaPda } from "sas-lib";
import { CREDENTIAL_NAME, ISSUER_AUTHORITY, SCHEMA_NAME, SCHEMA_VERSION } from "./config";

export type PilotAddresses = { authority: Address; credential: Address; schema: Address };

export async function derivePilotAddresses(authority: Address): Promise<PilotAddresses> {
  const [credential] = await deriveCredentialPda({ authority, name: CREDENTIAL_NAME });
  const [schema] = await deriveSchemaPda({ credential, name: SCHEMA_NAME, version: SCHEMA_VERSION });
  return { authority, credential, schema };
}

let cached: Promise<PilotAddresses> | undefined;

/** Direcciones del emisor configurado en config.ts. */
export function pilotAddresses(): Promise<PilotAddresses> {
  cached ??= derivePilotAddresses(address(ISSUER_AUTHORITY));
  return cached;
}
