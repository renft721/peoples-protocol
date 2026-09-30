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

## Comandos

```bash
npm run dev        # desarrollo en http://localhost:3000
npm run typecheck  # tipos
npm run lint
npm run build
```
