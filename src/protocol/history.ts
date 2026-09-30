// Historial de un titular: todas las pruebas del piloto ligadas a una wallet.
//
// Se piden a Solana todas las atestaciones de nuestra credencial y esquema (filtrando por
// posiciones fijas de la cuenta) y se quedan las que tienen esa wallet como `holder`.
// El `holder` va dentro de los datos, detrás de campos de longitud variable, así que no se
// puede filtrar en la propia consulta; para el volumen de un piloto es más que suficiente.

import { getBase58Decoder, getBase64Encoder, isAddress, type Address, type Base58EncodedBytes } from "@solana/kit";
import { SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS, getAttestationDecoder } from "sas-lib";
import { pilotAddresses } from "./addresses";
import { ATTESTATION_DISCRIMINATOR, toPublicAttestation, type PublicAttestation } from "./read";
import { getRpc } from "./solana";

// Posiciones en la cuenta de una atestación de SAS: tipo (1 byte) · nonce (32) · credencial (32) · esquema (32) · …
const OFFSET = { discriminator: 0n, credential: 33n, schema: 65n } as const;

export type HistoryResult = { status: "ok"; attestations: PublicAttestation[] } | { status: "invalid_address" };

export async function listHolderAttestations(input: string): Promise<HistoryResult> {
  const holder = input.trim();
  if (!isAddress(holder)) return { status: "invalid_address" };

  const { credential, schema } = await pilotAddresses();
  const b58 = (bytes: Uint8Array) => getBase58Decoder().decode(bytes) as Base58EncodedBytes;

  const accounts = await getRpc()
    .getProgramAccounts(SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS, {
      encoding: "base64",
      filters: [
        { memcmp: { offset: OFFSET.discriminator, bytes: b58(Uint8Array.of(ATTESTATION_DISCRIMINATOR)), encoding: "base58" } },
        { memcmp: { offset: OFFSET.credential, bytes: credential as string as Base58EncodedBytes, encoding: "base58" } },
        { memcmp: { offset: OFFSET.schema, bytes: schema as string as Base58EncodedBytes, encoding: "base58" } },
      ],
    })
    .send();

  const decoder = getAttestationDecoder();
  const all = await Promise.all(
    accounts.map(({ pubkey, account }) =>
      toPublicAttestation(pubkey as Address, decoder.decode(getBase64Encoder().encode(account.data[0])), null),
    ),
  );

  const mine = all
    .filter((attestation) => attestation.holder === holder)
    // Más recientes primero: por periodo y, a igualdad, por fecha de registro.
    .sort((a, b) => b.period.localeCompare(a.period) || b.issuedAt - a.issuedAt);

  return { status: "ok", attestations: mine };
}
