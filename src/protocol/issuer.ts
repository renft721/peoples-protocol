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
import { DEMO_AGENCY_NIF, ISSUER_AUTHORITY } from "./config";
import { evidenceCommitment, invoiceNonceBytes, randomSalt, statementCommitment, statementNonceBytes } from "./evidence";
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
  /** Ya estaba registrada por este emisor (misma factura, o mismo titular y mes): no se crea otra. */
  | { status: "duplicate"; attestation: Address };

/** Parte común: dirección determinista por nonce, antiduplicado, serialización y envío. */
async function publish(nonceBytes: Uint8Array, data: AttestationData, salt: Uint8Array): Promise<AttestResult> {
  const rpc = getRpc();
  const { signer } = await loadIssuer();
  const { credential, schema } = await derivePilotAddresses(signer.address);

  const nonce = getAddressDecoder().decode(nonceBytes);
  const [attestation] = await deriveAttestationPda({ credential, schema, nonce });

  const existing = await fetchMaybeAttestation(rpc, attestation);
  if (existing.exists) return { status: "duplicate", attestation };

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
  return { status: "created", attestation, signature, salt, period: data.period };
}

const now = () => BigInt(Math.floor(Date.now() / 1000));

/** ¿La emitió la propia agencia? Solo esas se pueden registrar. */
export function isOwnInvoice(invoice: VerifactuInvoice): boolean {
  return invoice.issuerNif === DEMO_AGENCY_NIF;
}

/**
 * Publica la atestación de una factura YA COMPROBADA contra la AEAT y emitida por la propia agencia.
 * Quien llame es responsable de haber hecho esa comprobación justo antes.
 */
export async function attestInvoice(invoice: VerifactuInvoice, options: { holder?: string } = {}): Promise<AttestResult> {
  const holder = options.holder?.trim() ?? "";
  if (holder && !isAddress(holder)) throw new Error("La wallet del titular no es una dirección de Solana válida");
  if (!isOwnInvoice(invoice)) throw new Error(`El emisor solo registra sus propias facturas (NIF ${DEMO_AGENCY_NIF})`);

  const { nonceKey } = await loadIssuer();
  const salt = randomSalt();
  const source: EvidenceSource = invoice.environment === "production" ? "verifactu-aeat" : "verifactu-aeat-test";
  return publish(
    await invoiceNonceBytes(invoice, nonceKey),
    {
      event_type: "rent_payment",
      period: invoicePeriod(invoice),
      evidence_source: source,
      evidence_commitment: await evidenceCommitment(invoice, salt),
      payment_confirmed: true,
      holder,
      issued_at: now(),
    },
    salt,
  );
}

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Publica un pago AFIRMADO por el emisor, sin factura ni comprobación externa (nivel de confianza
 * más bajo, y así se muestra). Solo desde el lado del emisor: no hay ruta de API pública para esto.
 * La sal que se devuelve es la que permitiría al emisor demostrar más adelante su registro interno.
 */
export async function attestIssuerStatement(holder: string, period: string): Promise<AttestResult> {
  if (!isAddress(holder)) throw new Error("Un pago afirmado por el emisor necesita la wallet del titular");
  if (!PERIOD.test(period)) throw new Error(`Periodo no válido: ${period} (formato AAAA-MM)`);

  const { nonceKey } = await loadIssuer();
  const salt = randomSalt();
  const eventType = "rent_payment" as const;
  return publish(
    await statementNonceBytes(holder, period, eventType, nonceKey),
    {
      event_type: eventType,
      period,
      evidence_source: "issuer-statement",
      evidence_commitment: await statementCommitment(holder, period, eventType, salt),
      payment_confirmed: true,
      holder,
      issued_at: now(),
    },
    salt,
  );
}
