import { describe, expect, it } from "vitest";
import { invoicePeriod, parseVerifactuQr, verifactuCheckUrl } from "./verifactu";

// Factura de ejemplo publicada por la AEAT (NIF de pruebas 89890001K).
const QR = "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678-G33&fecha=01-09-2024&importe=241.4";

describe("parseVerifactuQr", () => {
  it("lee un QR de producción y normaliza el importe a dos decimales", () => {
    const result = parseVerifactuQr(QR);
    expect(result).toEqual({
      ok: true,
      invoice: { issuerNif: "89890001K", invoiceNumber: "12345678-G33", issueDate: "01-09-2024", amount: "241.40", environment: "production" },
    });
  });

  it("reconoce el entorno de pruebas de la AEAT", () => {
    const result = parseVerifactuQr(QR.replace("www2.agenciatributaria.gob.es", "prewww2.aeat.es"));
    expect(result.ok && result.invoice.environment).toBe("test");
  });

  it("acepta espacios alrededor y NIF en minúsculas", () => {
    const result = parseVerifactuQr(`  ${QR.replace("89890001K", "89890001k")}  `);
    expect(result.ok && result.invoice.issuerNif).toBe("89890001K");
  });

  it.each([
    ["texto que no es un enlace", "not_a_url"],
    ["https://example.com/wlpl/TIKE-CONT/ValidarQR?nif=89890001K", "not_aeat"],
    ["http://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=1&fecha=01-09-2024&importe=1", "not_aeat"],
    ["https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu?nif=89890001K&numserie=1&fecha=01-09-2024&importe=1", "not_verifactu"],
    [QR.replace("&importe=241.4", ""), "missing_field"],
    [QR.replace("89890001K", "89890001"), "invalid_nif"],
    [QR.replace("01-09-2024", "31-02-2024"), "invalid_date"],
    [QR.replace("01-09-2024", "2024-09-01"), "invalid_date"],
    [QR.replace("241.4", "241,40"), "invalid_amount"],
  ])("rechaza %s → %s", (input, error) => {
    expect(parseVerifactuQr(input)).toEqual({ ok: false, error });
  });
});

describe("invoicePeriod y verifactuCheckUrl", () => {
  it("saca el periodo AAAA-MM de la fecha", () => {
    const result = parseVerifactuQr(QR);
    if (!result.ok) throw new Error("debería leerse");
    expect(invoicePeriod(result.invoice)).toBe("2024-09");
  });

  it("vuelve a montar la URL oficial, que se puede leer otra vez igual", () => {
    const result = parseVerifactuQr(QR);
    if (!result.ok) throw new Error("debería leerse");
    expect(parseVerifactuQr(verifactuCheckUrl(result.invoice))).toEqual(result);
  });
});
