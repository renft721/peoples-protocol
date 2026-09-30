# Guion de la demo — People's Protocol

Duración objetivo: **4 minutos**. Se presenta en inglés: las frases entre comillas son para decir tal cual; lo demás son indicaciones.

Web: https://peoples-protocol.vercel.app/en

## Preparación

**El día antes**

- [ ] En Phantom (Chrome), la cuenta **«María (demo)»** existe y su dirección es `DEMO_HOLDER` de `src/protocol/config.ts`.
- [ ] Claude (o quien tenga el repositorio) ejecuta `npm run demo:prepare -- --holder <wallet de María> --yes`. Publica los 11 meses afirmados por la agencia, retira la prueba de ejemplo para registrarla en directo y comprueba Hacienda y el saldo.
- [ ] Ensayo completo una vez. Si se ensaya registrando, volver a ejecutar `demo:prepare` después (la retira otra vez).

**30 minutos antes**

- [ ] Abrir https://peoples-protocol.vercel.app/api/health?aeat=1 → debe decir `"ok":true`, `"rpcHost":"devnet.helius-rpc.com"` y `"aeat":"found"`.
- [ ] Chrome con zoom al 125 %, una sola pestaña en `/en`, Phantom desbloqueado y en la cuenta «María (demo)».
- [ ] Tener a mano el vídeo de respaldo (Fase 4) por si falla la conexión.

## Guion

**1 · El problema (30 s)** — Inicio.

> "A tenant pays rent on time for years. That record lives in someone else's system: a bank, a landlord. It isn't portable, and nobody else can verify it without trusting whoever holds it. People's Protocol makes it provable — by anyone, without asking permission."

**2 · Generar la prueba en directo (70 s)** — *Connect wallet* → «María (demo)» → *Generate my proof*.

> "María's agency issued her September rent invoice under VeriFactu, Spain's new e-invoicing system. Every invoice carries a QR code that anyone can check against the Tax Agency."

*Use the Tax Agency's sample invoice* → *Continue*.

> "Our server asks the Tax Agency's public service — no password, no API agreement. It confirms the invoice exists."

*Register on Solana*.

> "Now the agency's credential signs an attestation on the Solana Attestation Service. Its address is derived from the invoice itself, so the same invoice can never be registered twice."

**3 · El certificado (45 s)** — *Open certificate*.

> "This is what a landlord or a bank sees. The amount and date are checked in the browser against a fingerprint on Solana. On-chain there is no amount and no tax ID — only the fingerprint."

Abrir *Technical details* y, si hay tiempo, *View on Solana Explorer*.

> "And we're explicit about trust: the Tax Agency confirms the invoice exists; the payment itself is stated by the issuer."

**4 · El historial (45 s)** — *View the holder's payment history*.

> "Twelve months of rent, from September 2024 to August 2025. One backed by a Tax Agency invoice, eleven stated by the agency only — and every proof says which. That's how an agency would publish all its tenants at once."

**5 · Antiduplicado (20 s)** — Volver a *Generate proof* → misma factura → *Register*.

> "Try to register it again: rejected. No duplicates, enforced on-chain, not by our server."

**6 · Cierre (30 s)** — Inicio → *For institutions*.

> "This site is just the demo client. The protocol is an open schema on Solana plus an open SDK: any bank, agency or insurer can issue or check proofs without going through us. Zero cost, on devnet, today."

## Si algo falla

| Síntoma | Qué hacer |
| --- | --- |
| Hacienda no responde (paso 2) | Saltar al certificado de ejemplo del inicio (*Open this certificate*) y al historial: no dependen de Hacienda. Explicar que la consulta es en directo al servicio público. |
| «This invoice was already registered» en el paso 2 | No se ejecutó `demo:prepare`. Aprovecharlo como demostración del antiduplicado y seguir con *Open the existing proof*. |
| Se registró sin la wallet de María | El historial de María tendrá 11 meses. Contarlo tal cual; después, restaurar con `demo:prepare` + `demo:attest -- --holder <María>`. |
| Solana tarda más de 30 s | Esperar con la pantalla de «Registering…»; si no, pasar al vídeo de respaldo. |
| Sin conexión | Vídeo de respaldo. |

## Después de la demo

No hay que tocar nada: la prueba registrada en directo tiene la misma dirección y el mismo enlace que la de ejemplo del inicio.
