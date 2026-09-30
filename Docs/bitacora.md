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

## 1 de octubre de 2026 (madrugada) — Fase 2: pantallas

**Hecho.**

- **Comprobar una prueba** (`/[lang]/verify` y `/[lang]/verify/[dirección]`): acepta el identificador o un enlace completo de la web. Estados: cargando, certificado, no encontrada, retirada (con enlace a la transacción de retirada), de otro emisor y error de red con «Reintentar».
- **Certificado** (`components/Certificate.tsx`): marco doble, importe, concepto, fecha y emisor, «Qué se demuestra» (factura comprobada por Hacienda + pago confirmado por el emisor, decisión 7), recorrido, nivel de confianza (DESIGN.md §8), aviso de evidencia y detalles técnicos plegados. La huella se recalcula **en el navegador** con los datos de detrás de `#`. El importe y la fecha solo se muestran si cuadran: con un enlace manipulado se avisa y no se enseña el importe falso.
- **Generar prueba** (`components/generate/GenerateWizard.tsx`): asistente de 4 pasos. «Portal con sesión» aparece como «Próximamente» (decisión 2). Botón «Usar la factura de ejemplo de Hacienda». Consulta a Hacienda, resumen de la factura, titular (wallet) y registro. Contempla duplicado, error de la cadena y la pantalla final con el enlace y el aviso «Guarda este enlace ahora». El foco pasa al título de cada paso.
- **Conectar wallet** (Wallet Standard: Phantom, Solflare, Backpack…): solo lee la dirección, nunca pide firmar. Si hay wallet conectada, la prueba queda ligada a ella (`holder`). Reconexión silenciosa si ya se conectó antes.
- **Inicio completo**: titular con certificado de ejemplo que abre la prueba real, cuatro pasos (textos adaptados a VeriFactu: ya no hablan de «login dirigido»), Para instituciones, Niveles de confianza (incluye que una retirada queda a la vista, decisión 4) y Ayuda.
- Todos los textos en inglés y español (`src/i18n/dictionaries/`).
- `npm run withdraw -- <dirección|example> --yes`: retira una atestación del emisor (adelantado de la Fase 3).

**Prueba de ejemplo.** Se retiró `HmD3…9hwM` con `npm run withdraw` (la página la mostró como «Prueba retirada») y se volvió a registrar **desde el asistente de la web**. Misma dirección, sal nueva. La evidencia nueva está en `EXAMPLE_PROOF` de `src/protocol/config.ts`.

**Fallo encontrado y corregido.** El paso «Registrando en Solana…» no se mostraba: el estado nuevo quedaba sobrescrito por el anterior al copiarlo.

**Pruebas manuales hechas (local).**

- Certificado con enlace completo (importe visible, aviso verde), sin evidencia (importe «Oculto») y con el importe manipulado en el enlace (aviso de que no coincide, sin importe).
- Identificador inexistente → «Prueba no encontrada». Prueba retirada → «Prueba retirada».
- Asistente: enlace no válido → error; factura de ejemplo → Hacienda la encuentra → registro → «Tu prueba está lista»; repetir → «Esta factura ya estaba registrada».
- Pegar un enlace completo en «Comprobar» abre el certificado con la evidencia.
- 390 px: inicio, generar y certificado sin desplazamiento horizontal; menú móvil con botón de wallet; sin wallet instalada aparece el aviso para instalar una.

**Pendiente de probar (Renato).** Conectar una wallet real (Phantom u otra) en su navegador y registrar una prueba ligada a ella.

## 1 de octubre de 2026 — Historial por titular (mejora de producto, decisión 10)

**Hecho.**

- `src/protocol/history.ts` + `GET /api/holders/[wallet]`: pide a Solana todas las atestaciones de nuestra credencial y esquema (filtro por posiciones fijas de la cuenta: tipo, credencial, esquema) y se queda con las que tienen esa wallet como `holder`. Comprobado en devnet: responde en ~0,15 s.
- Pantallas `/[lang]/history` (formulario) y `/[lang]/history/[wallet]`: resumen («N pagos de alquiler confirmados por el emisor, de … a …», con aviso de que todos están respaldados por Hacienda), lista de pruebas con enlace a cada certificado (sin importe: el importe solo va en el enlace de cada prueba), estados vacío, dirección no válida y error de red.
- Accesos: «Mi historial» junto a la wallet conectada; «Ver el historial de pagos del titular» en el certificado si la prueba tiene titular; «Ver tu historial de pagos» al terminar el asistente si había wallet; pista en «Comprobar».
- `npm run demo:attest -- --holder <wallet>`: registra ligada a un titular.
- Prueba de ejemplo retirada y registrada de nuevo, ligada a la **titular ficticia** `8ZaNpA6oyqQwtupMqse9Br37ZRrBdRcC6DaM2R1gLKCi` (`DEMO_HOLDER` en config.ts; nadie tiene su clave). Evidencia nueva en `EXAMPLE_PROOF`.

**Limitación de datos (pendiente de decisión de Renato).** Con una sola factura de la AEAT que responda «Encontrada», el historial de ejemplo tiene 1 prueba. Opción propuesta: un tercer nivel de confianza, «afirmado por el emisor, sin comprobación de Hacienda». Encaja con el escenario 1 del documento (la agencia publica en lote) y permitiría enseñar un historial de 12 meses con niveles de confianza mezclados, siempre etiquetados.

**Pruebas manuales hechas (local).** Certificado de ejemplo → «Ver el historial de pagos del titular» → historial con 1 prueba y resumen correcto. Wallet sin pruebas → estado vacío. Dirección no válida → aviso.

## 1 de octubre de 2026 — Tercer nivel de confianza: «afirmado por el emisor» (decisión 11)

**Hecho.**

- Origen `issuer-statement` en el esquema (es un texto, así que el esquema de SAS no cambia). Nonce `HMAC(clave, "issuer-statement|v1|titular|mes|tipo")`: un pago por titular y mes. Compromiso con sal que guarda el emisor. 3 tests nuevos (36 en total).
- `attestIssuerStatement()` en `issuer.ts` (comparte el envío con las facturas) y `npm run issuer:statements -- --holder <wallet> --from AAAA-MM --to AAAA-MM --yes`. Sin ruta de API pública.
- Certificado hecho a partir de datos: el modelo (`lib/certificate-model.ts`) decide campos, «Qué se demuestra», recorrido y nivel de confianza según el origen. Para `issuer-statement`: importe «No incluido», mes en vez de fecha de factura, solo «Pago confirmado por…», aviso «vale lo que valga la confianza en ese emisor».
- Historial: resumen mixto («1 con factura comprobada por Hacienda · 11 solo afirmados por el emisor») y etiqueta de confianza en cada prueba.
- Inicio: «Niveles de confianza» con tres orígenes (VeriFactu, Afirmado por el emisor, zkTLS próximamente) y pregunta frecuente nueva.

**Devnet.** Publicados de octubre de 2024 a agosto de 2025 para la titular ficticia `8ZaN…LKCi`. Junto con septiembre de 2024 (factura de la AEAT), su historial tiene 12 meses.

**Aviso operativo.** El RPC público de devnet devolvió «429 Too Many Requests» a mitad del lote. El script ahora pausa 3 s entre meses y, al relanzarlo, salta lo ya publicado (el mes que se quedó a medias sí se había registrado). **Hay que poner el RPC de Helius en Vercel antes de la demo** para no depender del límite público.

**Pruebas manuales hechas (local).** Historial de la titular: 12 pruebas, resumen mixto, etiquetas correctas. Certificado de octubre de 2024 (emisor): sin importe, aviso correcto, botón al historial. Certificado de septiembre de 2024 (AEAT) sin cambios.

## 1 de octubre de 2026 — Fase 3: preparación de la demo

**Hecho.**

- **Helius en producción.** Renato añadió `SOLANA_RPC_URL` en Vercel. `/api/health` confirma `rpcHost: devnet.helius-rpc.com`.
- **`/api/health`** (`?aeat=1` para consultar también a Hacienda): RPC en uso (solo el nombre del servidor, nunca la clave), saldo del emisor, clave configurada y respuesta de Hacienda.
- **El emisor solo registra facturas propias** (`DEMO_AGENCY_NIF` = 89890001K, el NIF de pruebas de la AEAT). Antes, la agencia ficticia habría «confirmado el pago» de cualquier factura real que alguien pegara (un tique de restaurante, por ejemplo). Nunca pasó, pero era un fallo de lógica y además el riesgo abierto de la Fase 1: ahora desde la web solo se puede registrar la factura de la agencia. El asistente avisa antes de intentar registrar («Hacienda la confirma, pero no la emitió esta agencia»).
- **Sal de las facturas derivada de la clave del emisor** (`invoiceSalt`) en vez de aleatoria. Sigue sin poder calcularse desde fuera, pero es la misma para la misma factura: retirar y volver a registrar la de ejemplo da el mismo enlace. Comprobado dos veces en devnet. Así, después de una demo en directo, el certificado de ejemplo del inicio no se rompe. 2 tests nuevos (38 en total).
- **Textos en inglés revisados** (calcos: «Concept» → «Description», «What is proven» → «What this proves», etc.).
- **Documento del proyecto corregido**: sin programa Anchor, «código como ley» con la retirada visible, fechas de VeriFactu (2027), esquema de datos nuevo, stack (Next.js en Vercel), evidencia ficticia de la AEAT, tercer nivel de confianza, historial, criterios de aceptación cumplidos.
- **`Docs/guion-demo.md`**: 4 minutos en inglés, preparación, plan B. **`Docs/pruebas-manuales.md`**: lista completa. **`npm run demo:prepare`**: publica los 11 meses del emisor para la titular, retira la de ejemplo para registrarla en directo y comprueba Hacienda y el saldo.

**Pendiente.**

- Wallet «María (demo)» en el Phantom de Renato. Con su dirección: `DEMO_HOLDER` nuevo, `demo:prepare`, y retirar los 11 meses de la titular ficticia actual (`8ZaN…LKCi`) para dejar limpio.
- Deck: alinear con el documento corregido.
- Fase 4: vídeo, README del SDK, envío.

## 1 de octubre de 2026 — Fase 4: María (demo), deck y README

**Hecho.**

- **María (demo)**: cuenta de Phantom de Renato, `EspsKBKUwGkvTUUTzNDciHBV5PbfQ52azw3mms2hTTKq` (`DEMO_HOLDER`). Tiene 11 meses afirmados por la agencia (oct 2024 – ago 2025) y septiembre de 2024 con la factura de la AEAT (la prueba de ejemplo `HmD3…9hwM`, mismo enlace de siempre). Retiradas las 11 pruebas de la titular ficticia anterior (`8ZaN…LKCi`).
- **Estado normal de la web**: María con 12 meses. `demo:prepare` solo se ejecuta justo antes de presentar (retira septiembre para registrarlo en directo). Guion actualizado.
- `npm run withdraw -- --holder <wallet> --yes`: retira todas las pruebas de una wallet.
- **Deck** (https://claude.ai/artifact/A2yh3kR5CXYvoy3ukjdns2, versión 6): corregidas «Cómo funciona» (sin Anchor, VeriFactu ahora y zkTLS próximamente), «Por qué blockchain» (retirada visible), «El piloto» (componentes reales, datos ficticios pero comprobables), «Fase 2» (+ zkTLS/Open Banking y emisores con KYC), «Arquitectura» (cajas y stack) y «Cierre» (web y repositorio). Sigue en español.
- **`examples/verify-proof.ts`**: verificación independiente con `sas-lib` y `@solana/kit`, sin importar nada de la app (demuestra que cualquiera puede integrarlo). Probado con la prueba de ejemplo (huella ✔) y con un mes del emisor.
- **README en inglés** para los jueces: problema, capas, cómo se hace una prueba, niveles de confianza, privacidad, direcciones del protocolo, esquema, API, ejecución local, limitaciones.

**Pendiente (Renato).** Vídeo de la demo, licencia del repositorio y envío a Colosseum antes del 12 de octubre. Opcional: versión del deck en inglés.

## 1 de octubre de 2026 — Licencia y validación final

- Licencia **MIT** (`LICENSE`, © 2026 Heavy Duty Builders), aprobada por Renato.
- **Ensayo real en producción** del registro desde la web (la única ruta que solo se había probado en local): Hacienda 1,2 s, Solana 2 s, pantalla final correcta y el mismo enlace de ejemplo (sal fija confirmada también en producción). Septiembre devuelto a María después.
- **Prueba de teclado** (N5) en producción: en verde.
- **Deck en inglés** (copia aparte, 13 diapositivas, paleta y tipografías de DESIGN.md): https://claude.ai/artifact/7EiiRaCynzj3eAEGE9oFNj. Añade «Trust levels», «Privacy by design» y «Live today on devnet» (cifras medidas en producción). El deck en español queda como estaba (versión 6).
