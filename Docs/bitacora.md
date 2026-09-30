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

**Pendiente de la Fase 0.** Publicar en Vercel (necesita el repositorio en GitHub).

**Notas para la Fase 2.**

- El botón «Conectar wallet» aún no está: llega con el flujo que lo usa.
- Los textos de los pasos 2 y 3 del inicio vienen de DESIGN.md y hablan de «login dirigido» (zkTLS) y de «wallet». Hay que revisarlos cuando se cierre la decisión sobre el titular.

**Pruebas manuales hechas.**

- `/` redirige a `/es` con un navegador en español.
- `/en/verify` → «Español» → `/es/verify`: cambia de idioma en la misma pantalla.
- A 390 px: sin desplazamiento horizontal; el menú se abre y se cierra, y marca la página activa.
- `/es/no-existe` muestra la 404 propia en español.
- `typecheck`, `lint` y `build` sin errores.
