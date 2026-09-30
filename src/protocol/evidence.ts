// Huellas de la evidencia. Funciona igual en el navegador y en el servidor (Web Crypto).
//
// Dos huellas distintas, cada una con un fin:
//
// 1. Compromiso (va en los datos de la atestación): SHA-256(sal || factura).
//    La sal es aleatoria y solo la tiene la persona, dentro de su enlace. Sin la sal nadie puede
//    averiguar el importe ni el NIF probando combinaciones; con el enlace, cualquiera puede
//    recalcular la huella y comprobar que coincide con la registrada.
//
// 2. Nonce (decide la dirección de la atestación en SAS): HMAC-SHA256(clave del emisor, factura).
//    Es siempre el mismo para la misma factura, así que registrarla dos veces choca con una cuenta
//    que ya existe: antiduplicado sin programa propio. Al llevar una clave secreta, tampoco se
//    puede usar para adivinar facturas.

import type { VerifactuInvoice } from "./verifactu";

const encoder = new TextEncoder();

/** Forma canónica de la factura: mismo texto para los mismos datos, venga el QR como venga. */
export function canonicalInvoice(invoice: VerifactuInvoice): string {
  return ["verifactu", "v1", invoice.issuerNif, invoice.invoiceNumber, invoice.issueDate, invoice.amount].join("|");
}

export const SALT_BYTES = 16;

export function randomSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

export async function evidenceCommitment(invoice: VerifactuInvoice, salt: Uint8Array): Promise<Uint8Array> {
  if (salt.length !== SALT_BYTES) throw new Error(`La sal debe tener ${SALT_BYTES} bytes`);
  const message = encoder.encode(canonicalInvoice(invoice));
  const joined = new Uint8Array(salt.length + message.length);
  joined.set(salt, 0);
  joined.set(message, salt.length);
  return sha256(joined);
}

/** 32 bytes deterministas por factura y emisor. `key` sale de la clave privada del emisor (issuer.ts). */
export async function invoiceNonceBytes(invoice: VerifactuInvoice, key: Uint8Array): Promise<Uint8Array> {
  const hmacKey = await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(canonicalInvoice(invoice)));
  return new Uint8Array(signature);
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
