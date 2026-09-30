// Huellas de la evidencia. Funciona igual en el navegador y en el servidor (Web Crypto).
//
// Dos huellas distintas, cada una con un fin:
//
// 1. Compromiso (va en los datos de la atestación): SHA-256(sal || factura).
//    La sal solo la tiene la persona, dentro de su enlace. Sin la sal nadie puede averiguar el
//    importe ni el NIF probando combinaciones; con el enlace, cualquiera puede recalcular la huella
//    y comprobar que coincide con la registrada. La sal de una factura se deriva de la clave secreta
//    del emisor (invoiceSalt): nadie de fuera puede calcularla, pero es siempre la misma para la misma
//    factura, así que retirar y volver a registrar una factura da el mismo enlace.
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

/**
 * Forma canónica de un pago afirmado por el emisor (sin factura): un pago por titular, mes y tipo.
 * Registrar dos veces el mismo mes para el mismo titular choca igual que una factura repetida.
 */
export function canonicalStatement(holder: string, period: string, eventType: string): string {
  return ["issuer-statement", "v1", holder, period, eventType].join("|");
}

async function hmac(message: string, key: Uint8Array): Promise<Uint8Array> {
  const hmacKey = await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(message)));
}

/** Sal de una factura: HMAC(clave del emisor, "salt|" + factura), recortada a SALT_BYTES. */
export async function invoiceSalt(invoice: VerifactuInvoice, key: Uint8Array): Promise<Uint8Array> {
  return (await hmac(`salt|${canonicalInvoice(invoice)}`, key)).slice(0, SALT_BYTES);
}

/** 32 bytes deterministas por factura y emisor. `key` sale de la clave privada del emisor (issuer.ts). */
export function invoiceNonceBytes(invoice: VerifactuInvoice, key: Uint8Array): Promise<Uint8Array> {
  return hmac(canonicalInvoice(invoice), key);
}

/** 32 bytes deterministas por titular, mes y tipo de pago afirmado por el emisor. */
export function statementNonceBytes(holder: string, period: string, eventType: string, key: Uint8Array): Promise<Uint8Array> {
  return hmac(canonicalStatement(holder, period, eventType), key);
}

/** Compromiso de un pago afirmado por el emisor: SHA-256(sal || registro). La sal la guarda el emisor. */
export async function statementCommitment(holder: string, period: string, eventType: string, salt: Uint8Array): Promise<Uint8Array> {
  const message = encoder.encode(canonicalStatement(holder, period, eventType));
  const joined = new Uint8Array(salt.length + message.length);
  joined.set(salt, 0);
  joined.set(message, salt.length);
  return sha256(joined);
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
