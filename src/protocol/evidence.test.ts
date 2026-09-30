import { describe, expect, it } from "vitest";
import {
  bytesEqual,
  canonicalInvoice,
  canonicalStatement,
  evidenceCommitment,
  invoiceNonceBytes,
  randomSalt,
  statementCommitment,
  statementNonceBytes,
} from "./evidence";
import { decodeEvidence, encodeEvidence, evidenceFromHash, verifyPath } from "./link";
import type { VerifactuInvoice } from "./verifactu";

const invoice: VerifactuInvoice = {
  issuerNif: "89890001K",
  invoiceNumber: "12345678-G33",
  issueDate: "01-09-2024",
  amount: "241.40",
  environment: "production",
};
const key = new Uint8Array(32).fill(7);
const otherKey = new Uint8Array(32).fill(8);

describe("antiduplicado (nonce)", () => {
  it("la misma factura da siempre el mismo nonce", async () => {
    const a = await invoiceNonceBytes(invoice, key);
    const b = await invoiceNonceBytes({ ...invoice }, key);
    expect(a).toHaveLength(32);
    expect(bytesEqual(a, b)).toBe(true);
  });

  it("cualquier cambio en la factura da otro nonce", async () => {
    const base = await invoiceNonceBytes(invoice, key);
    for (const changed of [
      { ...invoice, issuerNif: "89890002X" },
      { ...invoice, invoiceNumber: "12345678-G34" },
      { ...invoice, issueDate: "02-09-2024" },
      { ...invoice, amount: "241.41" },
    ]) {
      expect(bytesEqual(base, await invoiceNonceBytes(changed, key))).toBe(false);
    }
  });

  it("sin la clave del emisor no se reproduce (no sirve para adivinar facturas)", async () => {
    expect(bytesEqual(await invoiceNonceBytes(invoice, key), await invoiceNonceBytes(invoice, otherKey))).toBe(false);
  });

  it("el entorno no cambia la factura canónica: la misma factura no entra dos veces por ir por otro host", () => {
    expect(canonicalInvoice(invoice)).toBe(canonicalInvoice({ ...invoice, environment: "test" }));
  });
});

describe("compromiso de la evidencia", () => {
  it("con la misma sal da la misma huella; con otra sal, otra distinta", async () => {
    const salt = randomSalt();
    const a = await evidenceCommitment(invoice, salt);
    expect(a).toHaveLength(32);
    expect(bytesEqual(a, await evidenceCommitment(invoice, salt))).toBe(true);
    expect(bytesEqual(a, await evidenceCommitment(invoice, randomSalt()))).toBe(false);
  });

  it("un importe manipulado en el enlace ya no coincide", async () => {
    const salt = randomSalt();
    const registered = await evidenceCommitment(invoice, salt);
    const tampered = await evidenceCommitment({ ...invoice, amount: "2410.40" }, salt);
    expect(bytesEqual(registered, tampered)).toBe(false);
  });

  it("rechaza sales de tamaño incorrecto", async () => {
    await expect(evidenceCommitment(invoice, new Uint8Array(8))).rejects.toThrow();
  });
});

describe("enlace para compartir", () => {
  it("ida y vuelta: codificar y decodificar da lo mismo", () => {
    const salt = randomSalt();
    const decoded = decodeEvidence(encodeEvidence({ invoice, salt }));
    expect(decoded?.invoice).toEqual(invoice);
    expect(decoded && bytesEqual(decoded.salt, salt)).toBe(true);
  });

  it("la evidencia va detrás de #, nunca en la ruta", () => {
    const path = verifyPath("es", "Attest1111", { invoice, salt: randomSalt() });
    expect(path.startsWith("/es/verify/Attest1111#e=")).toBe(true);
    expect(evidenceFromHash(path.slice(path.indexOf("#")))?.invoice).toEqual(invoice);
  });

  it.each(["", "basura", "e30", btoa('{"n":"X","s":"1","f":"01-01-2024","i":"1.00","e":"p","k":"AAAA"}')])(
    "devuelve null ante un fragmento inválido (%s)",
    (value) => {
      expect(decodeEvidence(value)).toBeNull();
    },
  );
});

describe("pagos afirmados por el emisor", () => {
  const holder = "8ZaNpA6oyqQwtupMqse9Br37ZRrBdRcC6DaM2R1gLKCi";

  it("un nonce por titular, mes y tipo: el mismo mes no se registra dos veces", async () => {
    const a = await statementNonceBytes(holder, "2024-10", "rent_payment", key);
    expect(bytesEqual(a, await statementNonceBytes(holder, "2024-10", "rent_payment", key))).toBe(true);
    expect(bytesEqual(a, await statementNonceBytes(holder, "2024-11", "rent_payment", key))).toBe(false);
    expect(bytesEqual(a, await statementNonceBytes("Other1111111111111111111111111111", "2024-10", "rent_payment", key))).toBe(false);
  });

  it("nunca coincide con el nonce de una factura (espacios de nombres distintos)", () => {
    expect(canonicalStatement(holder, "2024-09", "rent_payment").startsWith("issuer-statement|")).toBe(true);
    expect(canonicalInvoice(invoice).startsWith("verifactu|")).toBe(true);
  });

  it("el compromiso depende de la sal", async () => {
    const a = await statementCommitment(holder, "2024-10", "rent_payment", randomSalt());
    const b = await statementCommitment(holder, "2024-10", "rent_payment", randomSalt());
    expect(a).toHaveLength(32);
    expect(bytesEqual(a, b)).toBe(false);
  });
});
