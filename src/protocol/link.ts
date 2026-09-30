// Enlace para compartir una prueba.
//
//   https://…/es/verify/<dirección de la atestación>#e=<evidencia>
//
// La parte detrás de `#` (la evidencia: datos de la factura + sal) nunca sale del navegador:
// los navegadores no la envían a ningún servidor. Así quien recibe el enlace puede ver y
// comprobar el importe, y quien solo mira la cadena no.

import { SALT_BYTES } from "./evidence";
import type { VerifactuInvoice } from "./verifactu";

export type Evidence = { invoice: VerifactuInvoice; salt: Uint8Array };

type Packed = { n: string; s: string; f: string; i: string; e: "p" | "t"; k: string };

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function encodeEvidence({ invoice, salt }: Evidence): string {
  const packed: Packed = {
    n: invoice.issuerNif,
    s: invoice.invoiceNumber,
    f: invoice.issueDate,
    i: invoice.amount,
    e: invoice.environment === "production" ? "p" : "t",
    k: toBase64Url(salt),
  };
  return toBase64Url(new TextEncoder().encode(JSON.stringify(packed)));
}

/** Devuelve null si el fragmento no es una evidencia válida (enlace cortado, manipulado…). */
export function decodeEvidence(encoded: string): Evidence | null {
  try {
    const packed = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as Partial<Packed>;
    const { n, s, f, i, e, k } = packed;
    if (![n, s, f, i, k].every((v) => typeof v === "string" && v.length > 0) || (e !== "p" && e !== "t")) return null;
    const salt = fromBase64Url(k!);
    if (salt.length !== SALT_BYTES) return null;
    return {
      invoice: {
        issuerNif: n!,
        invoiceNumber: s!,
        issueDate: f!,
        amount: i!,
        environment: e === "p" ? "production" : "test",
      },
      salt,
    };
  } catch {
    return null;
  }
}

export function verifyPath(lang: string, attestation: string, evidence?: Evidence): string {
  const base = `/${lang}/verify/${attestation}`;
  return evidence ? `${base}#e=${encodeEvidence(evidence)}` : base;
}

/** Lee `e=` del fragmento de la URL (sin el `#`). */
export function evidenceFromHash(hash: string): Evidence | null {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get("e");
  return value ? decodeEvidence(value) : null;
}
