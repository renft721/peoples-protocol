// Esquema de datos de la atestación en Solana Attestation Service (SAS).
//
// Sustituye al esquema del documento del proyecto (ver Docs/plan.md, decisión 5):
// - `issuer` sobra: la credencial del emisor ya va en la propia atestación.
// - `subject_hash` (hash del DNI) se cambia por `holder`: la wallet de la persona, o vacío.
// - `verification_ref` en claro se cambia por `evidence_commitment`: nada de NIF ni importes en la cadena.
// - Se añaden `evidence_source` (para el nivel de confianza) y `payment_confirmed`
//   (la factura la comprueba Hacienda; el pago lo afirma el emisor — decisión 7).

// Códigos de tipo de SAS (compactLayoutMapping de sas-lib).
const SAS_TYPE = { bool: 10, i64: 8, string: 12, vecU8: 13 } as const;

export const SCHEMA_FIELDS = [
  ["event_type", SAS_TYPE.string],
  ["period", SAS_TYPE.string],
  ["evidence_source", SAS_TYPE.string],
  ["evidence_commitment", SAS_TYPE.vecU8],
  ["payment_confirmed", SAS_TYPE.bool],
  ["holder", SAS_TYPE.string],
  ["issued_at", SAS_TYPE.i64],
] as const;

export const SCHEMA_LAYOUT = Uint8Array.from(SCHEMA_FIELDS.map(([, type]) => type));
export const SCHEMA_FIELD_NAMES = SCHEMA_FIELDS.map(([name]) => name);

export type EventType = "rent_payment";
export type EvidenceSource = "verifactu-aeat" | "verifactu-aeat-test";

/** Datos de una atestación tal como se guardan en la cadena. */
export type AttestationData = {
  event_type: EventType;
  /** AAAA-MM */
  period: string;
  evidence_source: EvidenceSource;
  /** SHA-256(sal || factura canónica), 32 bytes. */
  evidence_commitment: Uint8Array;
  payment_confirmed: boolean;
  /** Dirección de la wallet de la persona, o "" si no la dio. */
  holder: string;
  /** Segundos desde 1970 (UTC). */
  issued_at: bigint;
};
