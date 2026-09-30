@AGENTS.md

# People's Protocol — cliente de demostración

Piloto para el hackathon **Colosseum Crypto World's Fair 2026** (entrega: **12 de octubre de 2026**).
Protocolo de atestaciones en Solana: una persona demuestra un hecho (una factura VeriFactu) y
cualquiera puede comprobarlo sin pedir permiso a nadie.

Leer antes de tocar nada:

- `Docs/People's Protocol — Documento del Proyecto.md` — documento funcional (escrito por Renato; punto de partida, no especificación cerrada).
- `Docs/DESIGN.md` — guía visual. Fuente de verdad para colores, tipografía, componentes y textos.
- `Docs/plan.md` — plan por fases y **decisiones que corrigen o precisan** los dos documentos anteriores.
- `Docs/bitacora.md` — qué se ha hecho, sesión a sesión.

## Stack

- Next.js 16 (App Router) + TypeScript estricto, desplegado en Vercel. **Next 16 cambia APIs**: consultar `node_modules/next/dist/docs/` antes de usar algo nuevo (p. ej. `middleware` ahora es `proxy`).
- Sin base de datos: Solana (devnet) es el registro. Solana Attestation Service (SAS) vía `sas-lib`.
- CSS plano: tokens en `src/app/globals.css` (copiados de DESIGN.md §3) y CSS Modules por componente. Sin Tailwind.

## Estructura

- `src/app/[lang]/…` — todas las páginas cuelgan del idioma (`/en`, `/es`). `src/proxy.ts` redirige las rutas sin idioma según el navegador.
- `src/i18n/dictionaries/{en,es}.ts` — **todos** los textos de la interfaz. `es` está tipado con la forma de `en`: si falta una clave, no compila.
- `src/components/` — componentes compartidos.

## Reglas del proyecto

- **Solo devnet.** Nada de mainnet en el piloto.
- **Todo ficticio.** No hay autónomo real: las facturas son las de prueba de la AEAT.
- **Nunca claves en el repositorio.** RPC y clave del emisor van en variables de entorno (`.env.local` en local, Vercel en producción). Ver `.env.example`.
- **Nada de datos personales ni importes en claro en la cadena.** Ver decisión 5 de `Docs/plan.md`.
- **Dos idiomas siempre.** Ningún texto escrito directamente en un componente: va al diccionario, en inglés y en español.
- Accesibilidad de DESIGN.md §9: elementos reales (`<button>`, `<a>`, `<label>`), foco visible, 44 px mínimos, funciona a 390 px.

## Solana devnet

- Emisor, credencial y esquema: ver `src/protocol/config.ts` y la bitácora (Fase 1).
- `npm run setup:devnet` — alta idempotente (clave del emisor, SOL de prueba, credencial, esquema).
- `npm run demo:attest` — prueba de punta a punta con la factura de ejemplo de la AEAT.
- `npm run issuer:statements -- --holder <wallet> --from AAAA-MM --to AAAA-MM --yes` — pagos afirmados por el emisor (nivel de confianza bajo). Solo desde aquí, nunca desde la web.
- `npm run withdraw -- <dirección|example> --yes` — retira una atestación. Si se retira la de ejemplo y se vuelve a registrar, actualizar `EXAMPLE_PROOF.evidence` en `src/protocol/config.ts` (la sal cambia).
- **No ejecutar `vercel env pull`**: sobrescribe `.env.local` y se perdería `ISSUER_SECRET_KEY`, que en Vercel es *sensitive* y no se puede recuperar.

## Comandos

```bash
npm run dev        # desarrollo en http://localhost:3000
npm run typecheck  # tipos
npm run lint
npm run build
npm test           # tests automáticos del protocolo
```
