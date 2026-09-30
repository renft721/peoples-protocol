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

export function explorerUrl(kind: "address" | "tx", value: string): string {
  return `https://explorer.solana.com/${kind}/${value}?cluster=${CLUSTER}`;
}
