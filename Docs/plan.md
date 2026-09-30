# Plan de desarrollo del piloto

Redactado el 30 de septiembre de 2026. Entrega en Colosseum: **12 de octubre de 2026**.

## Decisiones (precisan o corrigen el documento del proyecto y DESIGN.md)

1. **Idioma: inglés y español.** El documento pedía inglés y DESIGN.md español. Se hacen los dos; inglés por defecto (`/en`) y español en `/es`. Aprobado por Renato el 30-09-2026.
2. **Portal con sesión (zkTLS) visible pero «Próximamente».** El piloto solo implementa VeriFactu (así lo dice el documento). La opción aparece en «Generar prueba» sin funcionar, para enseñar la visión sin prometer lo que no existe.
3. **Sin programa Anchor propio.** SAS calcula la dirección de cada atestación a partir de `[credencial, esquema, nonce]` (comprobado en su código). Si el `nonce` sale de la huella de la factura, **la misma factura no se puede registrar dos veces**. Cubre el antiduplicado sin escribir ni desplegar un programa. El deck y el resumen del documento todavía hablan de «programa Anchor»: hay que alinearlos.
4. **«Nadie puede revocar una atestación» es falso con SAS.** Su instrucción `CloseAttestation` permite al firmante autorizado del emisor cerrarla. Lo cierto: el emisor puede retirar una prueba, pero la retirada queda registrada públicamente en la cadena. Hay que corregirlo en la tabla «Código como ley» del documento y del deck.
5. **Privacidad.**
   - Un hash (huella) de un DNI no protege nada: solo hay ~100 millones de DNI posibles y se prueban todos en minutos.
   - Guardar el código de la factura en claro publicaría el NIF y el importe, cuando el documento promete «nada de importes on-chain».
   - Por eso en la cadena solo va la **huella de los datos de la factura**. Los datos viajan en el enlace que comparte la persona, detrás del `#` (esa parte nunca llega a ningún servidor). La página de verificación recalcula la huella y confirma que coincide con la registrada. Quien tiene el enlace ve el importe; quien solo mira la cadena, no.
   - El «concepto» no está en el QR de VeriFactu: sale del tipo de evento del esquema.
6. **Next.js + TypeScript en Vercel en vez de «una página HTML sin framework».** La consulta a Hacienda tiene que hacerse desde un servidor (el navegador no deja que una web consulte otra de distinto dominio) y la clave con la que firma el emisor tiene que quedar oculta. Vercel da las dos cosas gratis.
7. **Una factura no demuestra un pago.** VeriFactu prueba que la factura existe y se declaró, no que se pagara. El certificado muestra dos niveles: «Factura comprobada por Hacienda» y «Pago confirmado por [Emisor]».
8. **VeriFactu no es obligatorio hasta 2027** (RDL 15/2025: 1 de enero para sociedades, 1 de julio para el resto). El documento dice «obligatorio desde 2026»: hay que corregirlo.
9. **Datos ficticios.** Se usan facturas de prueba de la AEAT. Comprobado el 30-09-2026: la página pública de validación del QR responde «Encontrada» y «No encontrada» a una petición directa desde un servidor, sin captcha ni sesión, tanto en producción (`www2.agenciatributaria.gob.es`) como en pruebas (`prewww2.aeat.es`).
10. **Mejora de producto: historial por titular.** «María lleva 12 meses pagando a tiempo» transmite el valor mejor que una prueba suelta. Hecho el 01-10-2026 (`/[lang]/history/[wallet]`).
11. **Tercer nivel de confianza: «afirmado por el emisor».** Solo hay una factura de ejemplo de la AEAT que responda «Encontrada», así que el historial de ejemplo tendría una sola prueba. Se añade el origen `issuer-statement`: la agencia publica el pago desde su propio sistema, sin factura ni comprobación externa. Es el escenario 1 del documento: la institución publica en lote. Reglas:
    - Solo se publica desde el lado del emisor (`npm run issuer:statements`), nunca desde la web pública.
    - Una prueba por titular, mes y tipo (antiduplicado).
    - El certificado no muestra importe ni factura, solo «pago confirmado por el emisor», y el aviso de confianza dice que no hay comprobación externa.
    
    Aprobado por Renato el 01-10-2026.

## Fases

| Fase | Días | Qué | Terminado cuando… |
|---|---|---|---|
| 0 · Cimientos | 30 sep – 1 oct | Repositorio, Next.js + TS, tokens de DESIGN.md, dos idiomas, barra superior, publicación en Vercel, CLAUDE.md y bitácora | Web publicada con barra superior en `/en` y `/es` |
| 1 · Núcleo del protocolo | 2–4 oct | Lectura del QR VeriFactu, consulta a Hacienda desde el servidor, alta única de credencial y esquema en devnet, publicar y leer atestaciones. Tests automáticos de huellas, antiduplicado y lectura de la respuesta de Hacienda | Un script publica una atestación real en devnet, visible en el explorador de Solana |
| 2 · Pantallas | 4–8 oct | Comprobar (válida, no encontrada, cargando, error), Generar prueba (asistente de 4 pasos), Inicio completo (certificado de ejemplo, Para instituciones, Niveles de confianza, Ayuda) | Flujo completo desde la web, sin tocar la cadena a mano |
| 3 · Demo real | 8–10 oct | Recorrido completo con factura de prueba, revisión de textos en inglés, pruebas manuales documentadas, corrección del documento y del deck | Criterios de aceptación del MVP cumplidos |
| 4 · Entrega | 10–12 oct | README del SDK, vídeo, envío a Colosseum, margen | Envío hecho |

## Criterios de aceptación del MVP (del documento, ajustados)

- [ ] Al menos una factura de prueba verificada contra la AEAT
- [ ] Atestación publicada en SAS (devnet), visible en el explorador de Solana
- [ ] Página de verificación en vivo, con caso positivo y negativo
- [ ] Todo el flujo sin tocar la cadena a mano durante la demo
- [ ] Interfaz completa en inglés (y en español)
- [ ] Coste total: 0 €
