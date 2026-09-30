# People's Protocol

**A portable, verifiable record of what you've paid on time — checkable by anyone on Solana, without asking permission from whoever held it first.**

Built for the Colosseum Crypto World's Fair 2026 by Heavy Duty Builders.

- **Live demo client:** https://peoples-protocol.vercel.app (English and Spanish)
- **Example certificate:** [rent for September 2024, backed by a Tax Agency invoice](https://peoples-protocol.vercel.app/en/verify/HmD3Qv7bvL6Y3wtDZ6KZ5LpYGnJAkH8sg98yEHqy9hwM#e=eyJuIjoiODk4OTAwMDFLIiwicyI6IjEyMzQ1Njc4LUczMyIsImYiOiIwMS0wOS0yMDI0IiwiaSI6IjI0MS40MCIsImUiOiJwIiwiayI6IlhrT3FEdm1ady16R3hJVVZHc1EyVUEifQ)
- **Example payment history:** [12 months of rent for a fictitious tenant](https://peoples-protocol.vercel.app/en/history/EspsKBKUwGkvTUUTzNDciHBV5PbfQ52azw3mms2hTTKq)

> **Pilot status.** Solana **devnet** only. All data is fictitious: the issuer is a demo letting agency, and the invoice is the sample the Spanish Tax Agency (AEAT) publishes for its VeriFactu QR check.

## The problem

A tenant pays rent on time for years, but that record lives in someone else's system — a bank, a previous landlord. It isn't portable, and a new landlord, bank or insurer can't verify it without trusting whoever holds it, or asking for documents that are easy to edit and hard to check.

## What People's Protocol is

Infrastructure, not an app. Three layers:

1. **Open rules on Solana.** Proofs are attestations on the [Solana Attestation Service](https://solana.com/docs/tools/attestations) (SAS) under a public schema. No custom program: each attestation's address is derived from its evidence, so **the same invoice can never be registered twice** — enforced on-chain, not by our server.
2. **A record that grows.** Every attestation makes the set more useful to whoever verifies.
3. **An open client.** Anyone can read and verify proofs with the official SAS client — see [`examples/verify-proof.ts`](examples/verify-proof.ts), which imports nothing from this app.

This repository's web app is the **demo client**: generate a proof, check a proof, see a person's history.

## How a proof is made

```
Rent invoice with a VeriFactu QR        (issued by the letting agency, reported to the Tax Agency)
        │
        ▼
Public check against the AEAT           (server-side GET to the Tax Agency's public QR page — no password, no agreement)
        │  "Encontrada" = the invoice exists
        ▼
Attestation on SAS (devnet)             (signed by the agency's credential; address derived from the invoice → no duplicates)
        │
        ▼
Anyone verifies                         (with the link, in the browser, against the on-chain fingerprint)
```

VeriFactu is Spain's e-invoicing system: every invoice carries a QR code that anyone can check on the Tax Agency's public site. It becomes mandatory in 2027 (1 January for companies, 1 July for everyone else).

## Trust levels

We don't promise perfect authenticity; every proof says where it comes from.

| Source (`evidence_source`) | What it proves | Status |
|---|---|---|
| `verifactu-aeat` | The Tax Agency confirms the invoice exists; the issuer states it was paid | Live |
| `issuer-statement` | The issuer states the payment from its own system, with no external check — how an agency would publish all its tenants' payments at once. Only publishable from the issuer's side, never from the public web | Live |
| zkTLS (Reclaim) | A payment seen in the user's own bank session | Coming soon |

An issuer **can withdraw** an attestation it issued (SAS `CloseAttestation`), but the withdrawal stays in Solana's public history; the demo client shows it as "Proof withdrawn".

## Privacy model

Nothing personal and no amounts go on-chain.

- **On-chain:** a SHA-256 fingerprint of `salt ‖ invoice` (issuer tax ID, number, date, amount), the month, the source, the issuer's claim, and optionally the holder's wallet.
- **In the shared link, after `#`:** the invoice details and the salt. Browsers never send the fragment to any server. The certificate page recomputes the fingerprint in the browser and only shows the amount if it matches; a tampered link is flagged.
- **The salt** is derived from the issuer's secret key (HMAC), so outsiders can't brute-force invoices from the fingerprint, and re-registering the same invoice yields the same link.
- **The deduplication nonce** is `HMAC(issuer key, invoice)`: deterministic per invoice, useless for guessing.
- **Issuers only vouch for their own invoices:** the demo agency rejects invoices whose issuer tax ID isn't its own.

## Protocol addresses (devnet)

| | Address |
|---|---|
| SAS program | `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` |
| Issuer authority (demo agency) | `FchZy9B2jfLwQb1mgT34BpUr7gCyYKMABNr6HpB3nH6G` |
| Credential `PeoplesProtocolDemoAgency` | `6r6CdmF1iCpgADRBpqwjVWRTweALVtCjXN4b3oBsSBhZ` |
| Schema `PP_RentPayment` v1 | `BtNyhYMdMWFhETYdto28XYMRw4iKmHqs3nxDmrQd12QU` |

Schema fields: `event_type` (string), `period` (string, `YYYY-MM`), `evidence_source` (string), `evidence_commitment` (bytes, 32), `payment_confirmed` (bool), `holder` (string, wallet or empty), `issued_at` (i64, unix seconds).

## Verify a proof from your own code

```bash
npx tsx examples/verify-proof.ts "https://peoples-protocol.vercel.app/en/verify/<address>#e=<evidence>"
```

It fetches the attestation with `sas-lib`, checks it belongs to the pilot's credential and schema, decodes it, and — if the link carries evidence — recomputes the fingerprint. To list everything linked to a wallet, query SAS program accounts filtered by credential (offset 33) and schema (offset 65) and decode `holder`; see [`src/protocol/history.ts`](src/protocol/history.ts).

## HTTP API of the demo client

| Method | Path | What it does |
|---|---|---|
| `POST` | `/api/verifactu/check` | `{ qr }` → asks the AEAT whether the invoice exists (read-only) |
| `POST` | `/api/proofs` | `{ qr, holder? }` → re-checks with the AEAT and, for the agency's own invoices, publishes the attestation; returns the address and the link evidence (once — it isn't stored) |
| `GET` | `/api/proofs/:address` | Reads and decodes an attestation (`found`, `not_found`, `closed`, `foreign`) |
| `GET` | `/api/holders/:wallet` | Every pilot attestation linked to a wallet |
| `GET` | `/api/health?aeat=1` | RPC in use, issuer balance, AEAT reachability |

## Run it locally

```bash
npm install
cp .env.example .env.local     # SOLANA_RPC_URL optional (public devnet RPC by default)
npm run setup:devnet           # creates an issuer key, gets test SOL, creates credential + schema
npm run dev                    # http://localhost:3000
npm test                       # protocol unit tests (QR parsing, fingerprints, dedup, AEAT responses)
```

Other scripts: `demo:attest` (end-to-end test with the AEAT sample invoice), `issuer:statements` (publish issuer-stated months), `withdraw` (close an attestation), `demo:prepare` (reset state before a live demo).

## Stack

Next.js 16 · TypeScript · Solana Attestation Service (`sas-lib`, `@solana/kit`) · Wallet Standard · VeriFactu public QR check (AEAT) · Helius RPC · Vercel.

## Honest limitations

- Devnet and fictitious data only. One real AEAT sample invoice returns "found", so most of the demo tenant's history is issuer-stated — and labelled as such.
- The AEAT check reads the Tax Agency's public HTML page; if the page changes, the check reports "unrecognized" instead of guessing (real responses are kept as test fixtures).
- A single demo issuer. A real network needs issuers with their own SAS credentials (after KYC) and anti-collusion governance — phase 2.
