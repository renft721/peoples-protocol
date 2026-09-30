import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAeatResponse } from "./aeat";

// Páginas reales de la AEAT guardadas el 30-09-2026 (factura de ejemplo con NIF de pruebas 89890001K).
const fixture = (name: string) => readFileSync(new URL(`./__fixtures__/${name}.html`, import.meta.url), "utf8");

describe("parseAeatResponse", () => {
  it("factura encontrada en producción", () => {
    expect(parseAeatResponse(fixture("aeat-found-production"))).toEqual({ status: "found" });
  });

  it("factura no encontrada en producción (no confunde «no consta» con «consta»)", () => {
    expect(parseAeatResponse(fixture("aeat-not-found-production"))).toEqual({ status: "not_found" });
  });

  it("factura encontrada en el entorno de pruebas", () => {
    expect(parseAeatResponse(fixture("aeat-found-test"))).toEqual({ status: "found" });
  });

  it("datos rechazados por la AEAT: devuelve sus mensajes de error", () => {
    const verdict = parseAeatResponse(fixture("aeat-invalid-request"));
    expect(verdict.status).toBe("rejected");
    expect(verdict.status === "rejected" && verdict.messages).toEqual([
      "La fecha de expedición tiene formato inválido y debe tener el formato DD-MM-AAAA",
      "El importe tiene un formato incorrecto",
    ]);
  });

  it("una página desconocida no se da por buena", () => {
    expect(parseAeatResponse("<html><body>Servicio en mantenimiento</body></html>")).toEqual({ status: "unrecognized" });
  });

  it("entiende también la página con entidades HTML sin decodificar", () => {
    const html = "<p>En la Agencia Tributaria no consta informaci&oacute;n de ninguna factura</p>";
    expect(parseAeatResponse(html)).toEqual({ status: "not_found" });
  });
});
