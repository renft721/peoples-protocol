// Parámetros públicos del piloto. Nada de aquí es secreto.

export const CLUSTER = "devnet" as const;

/** RPC público de Solana devnet: se usa si no hay SOLANA_RPC_URL (p. ej. la de Helius). */
export const PUBLIC_DEVNET_RPC = "https://api.devnet.solana.com";

/**
 * Dirección pública del emisor de demostración (la agencia inmobiliaria ficticia).
 * Su clave privada está en la variable de entorno ISSUER_SECRET_KEY.
 * Generada con `npm run setup:devnet` el 30 de septiembre de 2026.
 */
export const ISSUER_AUTHORITY = "FchZy9B2jfLwQb1mgT34BpUr7gCyYKMABNr6HpB3nH6G";

/** Nombre de la credencial en SAS (máx. 32 bytes: forma parte de su dirección). */
export const CREDENTIAL_NAME = "PeoplesProtocolDemoAgency";

export const SCHEMA_NAME = "PP_RentPayment";
export const SCHEMA_VERSION = 1;
export const SCHEMA_DESCRIPTION =
  "People's Protocol pilot: rent payment backed by a VeriFactu invoice checked against the Spanish Tax Agency (AEAT).";

/**
 * Prueba de ejemplo (factura de ejemplo de la AEAT, NIF de pruebas 89890001K, 241,40 €),
 * retirada y vuelta a registrar desde la web el 30-09-2026 (prueba del asistente).
 * La evidencia incluye la sal: son datos ficticios y públicos a propósito, para que
 * cualquiera pueda abrir el certificado completo. Si se retira y se vuelve a registrar,
 * la dirección no cambia pero la evidencia sí: hay que actualizarla aquí.
 */
export const EXAMPLE_PROOF = {
  attestation: "HmD3Qv7bvL6Y3wtDZ6KZ5LpYGnJAkH8sg98yEHqy9hwM",
  evidence:
    "eyJuIjoiODk4OTAwMDFLIiwicyI6IjEyMzQ1Njc4LUczMyIsImYiOiIwMS0wOS0yMDI0IiwiaSI6IjI0MS40MCIsImUiOiJwIiwiayI6Ik91ajVReEZvbE9BMXZsaWVUaEFrSkEifQ",
  amount: "241.40",
};

/** QR de la factura de ejemplo que publica la AEAT (datos de prueba, responde «Encontrada»). */
export const SAMPLE_QR =
  "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678-G33&fecha=01-09-2024&importe=241.4";

export function exampleProofPath(lang: string): string {
  return `/${lang}/verify/${EXAMPLE_PROOF.attestation}#e=${EXAMPLE_PROOF.evidence}`;
}

export function explorerUrl(kind: "address" | "tx", value: string): string {
  return `https://explorer.solana.com/${kind}/${value}?cluster=${CLUSTER}`;
}
