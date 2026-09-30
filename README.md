# People's Protocol

A portable, verifiable record of good behaviour — rent paid, invoices issued — that belongs to the person, checkable by anyone on Solana without asking permission from whoever held it first.

Built for the Colosseum Crypto World's Fair 2026. This repository contains the **demo client** of the pilot; the protocol itself is the Solana Attestation Service schema and the open SDK that issue and read the attestations.

> Pilot status: runs on Solana **devnet** only. All invoices are AEAT (Spanish Tax Agency) test data.

## Run locally

```bash
cp .env.example .env.local   # optional: add your devnet RPC URL
npm install
npm run dev                  # http://localhost:3000
```

## Stack

Next.js 16 · TypeScript · Solana Attestation Service (`sas-lib`) · VeriFactu public QR verification (AEAT).
