// El emisor de demostración (la agencia inmobiliaria ficticia) firmando atestaciones.
// Solo en el servidor: usa la clave privada de ISSUER_SECRET_KEY.

import {
  createKeyPairSignerFromBytes,
  getAddressDecoder,
  getBase58Encoder,
  isAddress,
  type Address,
  type KeyPairSigner,
  type Signature,
} from "@solana/kit";
import {
  deriveAttestationPda,
  fetchMaybeAttestation,
  fetchSchema,
  getCreateAttestationInstruction,
  serializeAttestationData,
  type Schema,
} from "sas-lib";
import { derivePilotAddresses } from "./addresses";
import { ISSUER_AUTHORITY } from "./config";
import { evidenceCommitment, invoiceNonceBytes, randomSalt } from "./evidence";
import type { AttestationData, EvidenceSource } from "./schema";
import { getRpc, sendAndConfirm } from "./solana";
import { invoicePeriod, type VerifactuInvoice } from "./verifactu";

type Issuer = { signer: KeyPairSigner; nonceKey: Uint8Array };

let cachedIssuer: Promise<Issuer> | undefined;

/** Lee la clave del emisor (base58 de 64 bytes, el formato habitual de Solana). */
export function loadIssuer(): Promise<Issuer> {
  cachedIssuer ??= (async () => {
    const secret = process.env.ISSUER_SECRET_KEY;
    if (!secret) throw new Error("Falta la variable de entorno ISSUER_SECRET_KEY");
    const bytes = new Uint8Array(getBase58Encoder().encode(secret.trim()));
    if (bytes.length !== 64) throw new Error("ISSUER_SECRET_KEY no tiene el formato esperado (64 bytes en base58)");
    const signer = await createKeyPairSignerFromBytes(bytes);
    if (signer.address !== ISSUER_AUTHORITY) {
      throw new Error("ISSUER_SECRET_KEY no corresponde al emisor de config.ts");
    }
    // Clave del antiduplicado, derivada de la privada para no manejar otro secreto más.
    const label = new TextEncoder().encode("peoples-protocol/nonce-key/v1");
    const material = new Uint8Array(label.length + 32);
    material.set(label);
    material.set(bytes.subarray(0, 32), label.length);
    const nonceKey = new Uint8Array(await crypto.subtle.digest("SHA-256", material));
    return { signer, nonceKey };
  })();
  return cachedIssuer;
}

let cachedSchema: Promise<Schema> | undefined;

export function pilotSchema(schemaAddress: Address): Promise<Schema> {
  cachedSchema ??= fetchSchema(getRpc(), schemaAddress).then((account) => account.data);
  return cachedSchema;
}

export type AttestResult =
  | { status: "created"; attestation: Address; signature: Signature; salt: Uint8Array; period: string }
  /** Esa factura ya estaba registrada por este emisor: no se crea otra. */
  | { status: "duplicate"; attestation: Address };

/**
 * Publica la atestación de una factura YA COMPROBADA contra la AEAT.
 * Quien llame es responsable de haber hecho esa comprobación justo antes.
 */
export async function attestInvoice(invoice: VerifactuInvoice, options: { holder?: string } = {}): Promise<AttestResult> {
  const holder = options.holder?.trim() ?? "";
  if (holder && !isAddress(holder)) throw new Error("La wallet del titular no es una dirección de Solana válida");

  const rpc = getRpc();
  const { signer, nonceKey } = await loadIssuer();
  const { credential, schema } = await derivePilotAddresses(signer.address);

  const nonce = getAddressDecoder().decode(await invoiceNonceBytes(invoice, nonceKey));
  const [attestation] = await deriveAttestationPda({ credential, schema, nonce });

  const existing = await fetchMaybeAttestation(rpc, attestation);
  if (existing.exists) return { status: "duplicate", attestation };

  const salt = randomSalt();
  const period = invoicePeriod(invoice);
  const source: EvidenceSource = invoice.environment === "production" ? "verifactu-aeat" : "verifactu-aeat-test";
  const data: AttestationData = {
    event_type: "rent_payment",
    period,
    evidence_source: source,
    evidence_commitment: await evidenceCommitment(invoice, salt),
    payment_confirmed: true,
    holder,
    issued_at: BigInt(Math.floor(Date.now() / 1000)),
  };

  const instruction = getCreateAttestationInstruction({
    payer: signer,
    authority: signer,
    credential,
    schema,
    attestation,
    nonce,
    data: serializeAttestationData(await pilotSchema(schema), {
      ...data,
      evidence_commitment: Array.from(data.evidence_commitment),
    }),
    expiry: 0, // sin caducidad
  });

  const signature = await sendAndConfirm(rpc, signer, [instruction]);
  return { status: "created", attestation, signature, salt, period };
}
