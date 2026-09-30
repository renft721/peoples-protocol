// Lectura de una atestación: lo que hace la página «Comprobar una prueba».
// No necesita ninguna clave: todo es público en la cadena.

import { fetchEncodedAccount, isAddress, type Address, type Signature } from "@solana/kit";
import {
  SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
  decodeAttestation,
  deserializeAttestationData,
  fetchSchema,
  type Attestation,
  type Schema,
} from "sas-lib";
import { pilotAddresses } from "./addresses";
import type { EventType, EvidenceSource } from "./schema";
import { getRpc } from "./solana";

/** Versión apta para JSON (sin bigint ni bytes) de una atestación del piloto. */
export type PublicAttestation = {
  address: string;
  credential: string;
  schema: string;
  signer: string;
  /** 0 = sin caducidad */
  expiry: number;
  eventType: EventType;
  period: string;
  evidenceSource: EvidenceSource;
  /** Huella de la evidencia en hexadecimal. */
  evidenceCommitment: string;
  paymentConfirmed: boolean;
  holder: string;
  issuedAt: number;
  /** Transacción que la creó, si se encuentra. */
  creationSignature: string | null;
};

export type ReadResult =
  | { status: "found"; attestation: PublicAttestation }
  | { status: "invalid_address" }
  | { status: "not_found" }
  /** Existió pero el emisor la cerró: la retirada queda en el historial público. */
  | { status: "closed"; lastSignature: string }
  /** Es una atestación de SAS, pero de otro emisor o esquema: el piloto no la interpreta. */
  | { status: "foreign"; credential: string; schema: string };

type RawData = {
  event_type: EventType;
  period: string;
  evidence_source: EvidenceSource;
  evidence_commitment: number[];
  payment_confirmed: boolean;
  holder: string;
  issued_at: bigint;
};

export const ATTESTATION_DISCRIMINATOR = 2;

let cachedSchema: Promise<Schema> | undefined;

const toHex = (bytes: ArrayLike<number>) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

async function touchedSas(signature: Signature): Promise<boolean> {
  const tx = await getRpc()
    .getTransaction(signature, { encoding: "json", maxSupportedTransactionVersion: 0, commitment: "confirmed" })
    .send();
  return tx?.transaction.message.accountKeys.includes(SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS) ?? false;
}

export async function readAttestation(input: string): Promise<ReadResult> {
  const value = input.trim();
  if (!isAddress(value)) return { status: "invalid_address" };
  const target = value as Address;

  const rpc = getRpc();
  const encoded = await fetchEncodedAccount(rpc, target);

  if (!encoded.exists) {
    // ¿Fue alguna vez una atestación? Si su última transacción pasó por SAS, la cerraron.
    const history = await rpc.getSignaturesForAddress(target, { limit: 1 }).send();
    if (history.length > 0 && (await touchedSas(history[0].signature))) {
      return { status: "closed", lastSignature: history[0].signature };
    }
    return { status: "not_found" };
  }
  // Existe pero no es una atestación de SAS (una wallet, un token, una credencial…):
  // para el piloto, no es una prueba. El primer byte de las cuentas de SAS dice su tipo (2 = atestación).
  if (encoded.programAddress !== SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS || encoded.data[0] !== ATTESTATION_DISCRIMINATOR) {
    return { status: "not_found" };
  }
  const account = decodeAttestation(encoded);

  const { credential, schema } = await pilotAddresses();
  const onChain = account.data;
  if (onChain.credential !== credential || onChain.schema !== schema) {
    return { status: "foreign", credential: onChain.credential, schema: onChain.schema };
  }

  // La transacción más antigua de la cuenta es la que la creó.
  const signatures = await rpc.getSignaturesForAddress(target, { limit: 20 }).send();
  const creationSignature = signatures.length > 0 ? signatures[signatures.length - 1].signature : null;

  return { status: "found", attestation: await toPublicAttestation(target, onChain, creationSignature) };
}

/** Pasa una atestación del piloto (ya comprobado emisor y esquema) a su forma pública en JSON. */
export async function toPublicAttestation(
  address: Address,
  onChain: Attestation,
  creationSignature: string | null,
): Promise<PublicAttestation> {
  cachedSchema ??= fetchSchema(getRpc(), onChain.schema).then((s) => s.data);
  const data = deserializeAttestationData<RawData>(await cachedSchema, Uint8Array.from(onChain.data));
  return {
    address,
    credential: onChain.credential,
    schema: onChain.schema,
    signer: onChain.signer,
    expiry: Number(onChain.expiry),
    eventType: data.event_type,
    period: data.period,
    evidenceSource: data.evidence_source,
    evidenceCommitment: toHex(data.evidence_commitment),
    paymentConfirmed: data.payment_confirmed,
    holder: data.holder,
    issuedAt: Number(data.issued_at),
    creationSignature,
  };
}
