# Bitácora — People's Protocol

## 30 de septiembre de 2026 — Fase 0: cimientos

**Análisis previo.** Leídos el documento del proyecto, DESIGN.md, el deck y el lienzo de diseño (dirección C).
Las contradicciones encontradas y cómo se resuelven están en `Docs/plan.md` («Decisiones»). Comprobaciones hechas:

- La página pública de validación de QR de VeriFactu responde «Encontrada» / «No encontrada» a una petición directa desde servidor, sin captcha.
- SAS: la dirección de una atestación sale de `[credencial, esquema, nonce]` y el emisor puede cerrarla (`CloseAttestation`). Leído en su código fuente.
- VeriFactu se aplazó a 2027 (RDL 15/2025).
- `sas-lib` estable en npm: 1.0.10 (usa `@solana/kit` 5). La 2.x está en beta: no se usa en el piloto.

**Hecho.**

- Repositorio git en la raíz del proyecto; rama `fase-0-cimientos`.
- Next.js 16 + TypeScript estricto, sin Tailwind. Tokens de DESIGN.md en `globals.css`; fuentes Source Serif 4 y Source Sans 3 servidas desde el propio dominio.
- Dos idiomas con rutas `/en` y `/es`. `proxy.ts` redirige `/` según el idioma del navegador. Diccionarios tipados: si falta una traducción, no compila.
- Barra superior según DESIGN.md §5: enlace activo subrayado, etiqueta Devnet, cambio de idioma y menú colapsado por debajo de 1100 px.
- Inicio con titular y cuatro pasos; «Generar prueba» y «Verificar» como marcadores «en construcción».
- 404 propia, en su idioma y con la barra superior.

**Publicación.**

- Repositorio público: https://github.com/renft721/peoples-protocol
- Proyecto de Vercel `peoples-protocol` (equipo «renft721's projects»), conectado al repositorio: cada `git push` a `main` publica solo.
- Producción: https://peoples-protocol.vercel.app — comprobado: `/` redirige según el idioma, `/en` y `/es/verify` responden 200 y `/es/no-existe` da 404.
- El conector de Vercel de Claude no tiene permiso para crear proyectos (403) y no ve este proyecto; se usa la CLI de Vercel (`npx vercel`), que tiene sesión iniciada en el Mac de Renato.
- Helius: cuenta creada y cambiada a devnet. La clave aún no está en Vercel; mientras, el piloto usa el RPC público de devnet.

**Notas para la Fase 2.**

- El botón «Conectar wallet» aún no está: llega con el flujo que lo usa.
- Los textos de los pasos 2 y 3 del inicio vienen de DESIGN.md y hablan de «login dirigido» (zkTLS) y de «wallet». Hay que revisarlos cuando se cierre la decisión sobre el titular.

**Pruebas manuales hechas.**

- `/` redirige a `/es` con un navegador en español.
- `/en/verify` → «Español» → `/es/verify`: cambia de idioma en la misma pantalla.
- A 390 px: sin desplazamiento horizontal; el menú se abre y se cierra, y marca la página activa.
- `/es/no-existe` muestra la 404 propia en español.
- `typecheck`, `lint` y `build` sin errores.

## 30 de septiembre de 2026 (noche) — Fase 1: núcleo del protocolo

**Hecho** (código en `src/protocol/`, que es el embrión del SDK):

- `verifactu.ts`: lee y valida el enlace del QR (solo VeriFactu, solo hosts de la AEAT, fecha e importe válidos).
- `aeat.ts`: consulta la página pública de la AEAT desde el servidor e interpreta la respuesta (encontrada / no encontrada / datos rechazados / página desconocida).
- `evidence.ts` y `link.ts`: compromiso SHA-256(sal ‖ factura) para la cadena, nonce HMAC con clave del emisor para el antiduplicado, y enlace para compartir con la evidencia detrás de `#`.
- `schema.ts`: esquema de SAS (`event_type`, `period`, `evidence_source`, `evidence_commitment`, `payment_confirmed`, `holder`, `issued_at`). Sustituye al del documento: ver comentarios del fichero y decisión 5 del plan.
- `issuer.ts`: el emisor de demostración firma atestaciones. `read.ts`: lee una atestación y distingue encontrada, no existe, retirada (cerrada) y de otro emisor; una cuenta que no es una atestación se trata como «no encontrada».
- API: `POST /api/verifactu/check`, `POST /api/proofs` (vuelve a consultar a la AEAT antes de registrar), `GET /api/proofs/[address]`.
- `vercel.json`: funciones en París (`cdg1`), más cerca de la AEAT.
- 33 tests automáticos (`npm test`) con respuestas reales de la AEAT en `src/protocol/__fixtures__/`.

**Devnet** (`npm run setup:devnet`):

- Emisor: `FchZy9B2jfLwQb1mgT34BpUr7gCyYKMABNr6HpB3nH6G`. Clave privada en `.env.local` (Mac de Renato) y en Vercel como variable *sensitive* (no se puede volver a leer). Si se pierde, se crea otro emisor con el mismo script.
- Credencial: `6r6CdmF1iCpgADRBpqwjVWRTweALVtCjXN4b3oBsSBhZ`
- Esquema: `BtNyhYMdMWFhETYdto28XYMRw4iKmHqs3nxDmrQd12QU`
- El grifo público de devnet estaba agotado; Renato consiguió 5 SOL de prueba en faucet.solana.com.

**Prueba de punta a punta** (`npm run demo:attest`), 30-09-2026: factura de ejemplo de la AEAT (NIF de pruebas 89890001K, 241,40 €, 01-09-2024) → AEAT «encontrada» → atestación `HmD3Qv7bvL6Y3wtDZ6KZ5LpYGnJAkH8sg98yEHqy9hwM` publicada → leída de la cadena → el enlace cuadra con la huella → segundo intento rechazado como duplicado.

**Pendiente detectado.** Solo conocemos una factura de la AEAT que dé «encontrada», y ya está registrada. Para la demo en vivo hará falta un script que cierre esa atestación antes de presentar (así se ve registrarla de cero y, después, el antiduplicado). Además, el cierre enseña la decisión 4 («la retirada queda a la vista»). Se hace en la Fase 3.

**Riesgo conocido.** `POST /api/proofs` está abierto: cualquiera puede hacer que el emisor registre una factura que la AEAT dé por buena. En devnet solo cuesta SOL de prueba, y el antiduplicado impide repetir. Se revisa antes de la demo.
