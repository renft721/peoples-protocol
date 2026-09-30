// Standalone example: how any platform (a bank, an agency, an insurer) can verify a
// People's Protocol proof WITHOUT our website or our servers — only the official
// Solana Attestation Service client (`sas-lib`) and `@solana/kit`.
//
//   npx tsx examples/verify-proof.ts "<proof link or attestation address>"
//
// It deliberately imports nothing from src/: the protocol is the public schema on Solana.

import { address, createSolanaRpc, devnet, isAddress } from "@solana/kit";
import { deserializeAttestationData, fetchMaybeAttestation, fetchSchema } from "sas-lib";

// Public parameters of the pilot (see README → Protocol addresses).
const RPC = "https://api.devnet.solana.com";
const PILOT_CREDENTIAL = "6r6CdmF1iCpgADRBpqwjVWRTweALVtCjXN4b3oBsSBhZ"; // Demo Agency (fictitious)
const PILOT_SCHEMA = "BtNyhYMdMWFhETYdto28XYMRw4iKmHqs3nxDmrQd12QU"; // PP_RentPayment v1

type ProofData = {
  event_type: string;
  period: string;
  evidence_source: string;
  evidence_commitment: number[];
  payment_confirmed: boolean;
  holder: string;
  issued_at: bigint;
};

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

const fromBase64Url = (value: string) =>
  Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=")), (c) =>
    c.charCodeAt(0),
  );

async function main() {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: npx tsx examples/verify-proof.ts "<proof link or address>"');

  // A shared link looks like https://…/en/verify/<address>#e=<evidence>
  const url = input.startsWith("http") ? new URL(input) : null;
  const target = url ? url.pathname.split("/").pop()! : input;
  if (!isAddress(target)) throw new Error("Not a Solana address");

  const rpc = createSolanaRpc(devnet(RPC));
  const account = await fetchMaybeAttestation(rpc, address(target));
  if (!account.exists) return console.log("✘ No attestation at this address (never existed, or withdrawn by its issuer).");

  const attestation = account.data;
  const trusted = attestation.credential === PILOT_CREDENTIAL && attestation.schema === PILOT_SCHEMA;
  console.log(`Issuer credential: ${attestation.credential} ${trusted ? "(People's Protocol pilot ✔)" : "(unknown issuer ✘)"}`);
  if (!trusted) return;

  const schema = await fetchSchema(rpc, attestation.schema);
  const data = deserializeAttestationData<ProofData>(schema.data, Uint8Array.from(attestation.data));
  console.log({
    event: data.event_type,
    period: data.period,
    source: data.evidence_source, // verifactu-aeat | verifactu-aeat-test | issuer-statement
    paymentConfirmedByIssuer: data.payment_confirmed,
    holder: data.holder || "(none)",
    issuedAt: new Date(Number(data.issued_at) * 1000).toISOString(),
  });

  // Optional: the link's evidence (invoice details + salt) never reaches any server.
  // Recompute SHA-256(salt || canonical invoice) and compare with the on-chain fingerprint.
  const evidence = url ? new URLSearchParams(url.hash.slice(1)).get("e") : null;
  if (!evidence) return console.log("No evidence in the link: amount stays private.");
  const e = JSON.parse(new TextDecoder().decode(fromBase64Url(evidence))) as Record<string, string>;
  const salt = fromBase64Url(e.k);
  const canonical = new TextEncoder().encode(["verifactu", "v1", e.n, e.s, e.f, e.i].join("|"));
  const joined = new Uint8Array(salt.length + canonical.length);
  joined.set(salt);
  joined.set(canonical, salt.length);
  const matches = (await sha256(joined)).every((byte, i) => byte === data.evidence_commitment[i]);
  console.log(matches ? `✔ Link matches the on-chain fingerprint: invoice ${e.s}, ${e.f}, €${e.i}` : "✘ Link does NOT match: it may have been altered");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
