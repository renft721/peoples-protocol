# DESIGN.md — People's Protocol (dirección C · "Cívica")

Guía visual y de interfaz para el cliente de demostración del piloto. Léela antes de construir cualquier pantalla y respeta estos valores: no inventes colores, tamaños ni textos nuevos.

## 1. Contexto

- People's Protocol es **infraestructura** (programa Anchor en Solana + Solana Attestation Service + SDK abierto). La web es solo el **cliente de demostración** del hackathon: fina, clara y honesta.
- Alcance de desarrollo del piloto: generar una prueba (zkTLS con Reclaim o QR de VeriFactu), registrarla en Solana **devnet** y consultarla. Todo lo de "fase 2" y "escenario ideal en producción" del documento del proyecto **no se construye**.
- Público: particulares (inquilino, empleado, autónomo) que generan pruebas, y verificadores (banco, agencia inmobiliaria, fondo) que las consultan. "Institucional" significa negocio, nunca administración pública.
- Tono: profesional, cálido y directo. Sin jerga cripto en la interfaz (di "prueba", "verificado", "identificador"; evita "PDA", "attestor", "on-chain" salvo en detalles técnicos).

## 2. Principios

1. **Confianza explícita.** Nunca prometas autenticidad perfecta. Cada atestación muestra su nivel de confianza (ver §8).
2. **Privacidad visible.** Donde se genera una prueba, explica siempre qué se comparte y qué no (contraseña, resto de la cuenta).
3. **Sin permiso de nadie.** El lenguaje nunca sugiere que el banco o Hacienda colaboran.
4. **Sobriedad.** Una sola acción principal por pantalla. Sin degradados, sin emojis, sin ilustraciones decorativas.
5. **Datos reales o marcadores.** Sin cifras inventadas: usa marcadores como `[Emisor]` o `[PDA de ejemplo]` hasta tener datos reales.

## 3. Tokens de diseño

```css
:root {
  /* Color */
  --fondo: #FAF7F2;
  --superficie: #FFFDF9;
  --superficie-input: #FFFFFF;
  --borde: #E6DFD2;
  --borde-fuerte: #D9CFBC;
  --texto: #1F2A1F;
  --texto-suave: #4A5243;
  --texto-tenue: #5E6655;
  --primario: #1E5B3A;
  --primario-texto: #FFFFFF;
  --acento: #8A5A12;            /* etiquetas y sobretítulos */
  --verificado-fondo: #E3EFE7;
  --verificado-texto: #154429;
  --aviso-fondo: #F6EAD2;       /* nivel de confianza / avisos */
  --aviso-titulo: #6B430B;
  --devnet: #B7791F;

  /* Tipografía */
  --fuente-titulo: 'Source Serif 4', Georgia, serif;
  --fuente-texto: 'Source Sans 3', system-ui, sans-serif;

  /* Forma */
  --radio: 10px;
  --radio-boton: 12px;
  --radio-pildora: 999px;
  --sombra: none;               /* el estilo C no usa sombras */
}
```

Fuentes (Google Fonts): `Source Serif 4` pesos 500, 600, 700 · `Source Sans 3` pesos 400, 500, 600, 700.

### Escala tipográfica (escritorio)

| Uso | Fuente | Tamaño | Peso |
| --- | --- | --- | --- |
| Titular de inicio (h1) | Serif | 60 px / 1.08 | 600 |
| Titular de pantalla (h1) | Serif | 34–38 px | 600 |
| Subtítulo de sección (h2) | Serif | 26 px | 600 |
| Título de tarjeta | Sans | 18 px | 700 |
| Texto de cuerpo | Sans | 16–20 px / 1.55–1.6 | 400 |
| Sobretítulo | Sans | 13–14 px, mayúsculas, espaciado 0.1em | 700 |
| Etiqueta de dato | Sans | 13 px | 600 |

### Espaciado

Base de 8 px. Márgenes laterales de página: 64 px en escritorio, 16 px en móvil. Separación entre bloques: 16–24 px. Secciones: 88–96 px de aire vertical.

## 4. Componentes

- **Botón primario:** fondo `--primario`, texto blanco, 17 px / 700, alto mínimo 54 px, radio 12 px.
- **Botón secundario:** transparente, borde 1.5 px `--texto`, texto `--texto`, mismo alto y radio.
- **Botón de la barra superior ("Conectar wallet"):** como el primario pero 16 px y alto mínimo 44 px.
- **Tarjeta:** fondo `--superficie`, borde 1 px `--borde`, radio 10 px, relleno 22–36 px. Sin sombra.
- **Certificado (resultado de verificación):** marco doble: contenedor con borde `--borde-fuerte` y radio 6 px, relleno 10 px, y dentro otro recuadro con el mismo borde. Es el elemento visual distintivo del producto.
- **Insignia "Verificado en Solana":** píldora, fondo `--verificado-fondo`, texto `--verificado-texto`, icono de check.
- **Aviso de confianza:** fondo `--aviso-fondo`, título en serif `--aviso-titulo`, texto `--texto`.
- **Etiqueta Devnet:** píldora con borde `--borde` y punto `--devnet`. Visible en todas las pantallas mientras el piloto corra en devnet.
- **Campo de texto / selector:** alto mínimo 50–54 px, borde 1 px `--borde-fuerte`, radio 10 px, fondo blanco. Siempre con `<label>` visible.
- **Selector de origen (tarjeta pulsable):** botón con borde de 2 px; `--primario` si está elegido, `--borde` si no.
- **Pasos (asistente):** círculo de 32 px. Activo: relleno `--primario`. Pendiente: borde 2 px `--borde-fuerte` y texto `--texto-tenue`.

## 5. Navegación

Barra superior, alto 76 px, borde inferior `--borde`:

- Izquierda: logotipo + **Inicio · Generar prueba · Verificar · Para instituciones · Ayuda**. El enlace activo va en `--primario` con subrayado de 2 px.
- Derecha: etiqueta **Devnet** + botón **Conectar wallet**.
- En móvil: menú colapsado (botón de hamburguesa) y el botón de wallet dentro del menú.

"Para instituciones" y "Ayuda" son secciones de la página de inicio en el piloto; no son páginas propias todavía.

## 6. Pantallas

### 6.1 Inicio
- **Hero** a dos columnas: sobretítulo "Para inquilinos, empleados y autónomos", h1 "Lo que has pagado a tiempo, por fin demostrable.", párrafo, botones "Generar mi prueba" (primario) y "Comprobar una prueba" (secundario). A la derecha, un **certificado de ejemplo** con la insignia "Verificado en Solana".
- **Cuatro pasos** en tarjetas: Pagas como siempre → Generas la prueba → Se registra en Solana → Quien quieras la comprueba.
- Después del diseño actual faltan las secciones "Para instituciones" (las tres capas: programa, registro, SDK) y "Niveles de confianza"; usa los mismos componentes.

### 6.2 Generar prueba
- Columna izquierda: título y asistente de 4 pasos (Elegir origen, Generar la prueba, Registrar en Solana, Prueba lista).
- Centro: tarjeta con dos opciones pulsables, **Portal con sesión** (zkTLS con Reclaim) y **Factura con QR VeriFactu**.
  - Portal: selector del portal (banco, nómina, otra plataforma) y nota "Tu contraseña no pasa por nosotros".
  - VeriFactu: campo para pegar el enlace del QR.
  - Botón "Continuar".
- Columna derecha: tres paneles, **Qué se comparte**, **Qué no se comparte**, **Antes de empezar** (cada prueba se genera por separado, menos de un minuto).
- Los pasos 2–4 (generación, registro, resultado) usan la misma estructura y acaban mostrando el certificado de §6.3.

### 6.3 Comprobar una prueba
- Título, campo "Identificador" y botón "Comprobar".
- Resultado como **certificado**: cabecera con sobretítulo "Certificado de pago", título, insignia de estado; fila de cuatro datos (importe, concepto, fecha, emisor); recorrido de la prueba en cuatro puntos; aviso de nivel de confianza; acciones "Copiar enlace" y "Ver en el explorador de Solana".
- Estados a diseñar además del resultado válido: **no encontrada**, **cargando** y **error de red**. Usa el aviso (`--aviso-fondo`) para no encontrada y un mensaje claro para el error, nunca un fallo silencioso.

## 7. Reglas de contenido (copy)

- Español de España, tuteo.
- Preferir: "prueba", "comprobar", "verificado", "identificador". Evitar: "attestor", "PDA", "zkTLS" en textos principales (permitido en detalles y en el selector de origen).
- No afirmar que algo es "100% seguro" ni "infalible".
- Los importes en euros con el símbolo detrás: `800 €`.
- Fechas en formato largo: "3 de marzo".

## 8. Niveles de confianza (obligatorio en cada atestación)

| Origen | Texto del aviso |
| --- | --- |
| zkTLS (Reclaim) | "Esta prueba depende de los validadores de Reclaim, que están en proceso de descentralización." |
| VeriFactu (AEAT) | "Comprobada contra el servicio público de verificación de Hacienda." |

Mostrar siempre el nivel correspondiente al origen de la prueba.

## 9. Accesibilidad

- Contraste mínimo de texto 4.5:1 (ya validado con esta paleta; no uses `--texto-tenue` por debajo de 13 px).
- Objetivos táctiles de al menos 44 px.
- Elementos interactivos reales (`<button>`, `<a href>`, `<input>` con `<label>`); nunca `div` con `onClick`.
- Foco de teclado visible en todos los controles.
- El estado no se comunica solo con color: acompáñalo de icono o texto.
- Toda la interfaz debe funcionar a 390 px de ancho.

## 10. Técnico

- Solana **devnet** únicamente. Nada de mainnet en el piloto.
- Proveedor de RPC gratuito (Helius o RPC Fast), configurado por variable de entorno; nunca claves en el repositorio.
- Logotipo: actualmente un marcador (dos círculos enlazados) hasta definir el definitivo; manténlo como SVG para poder cambiarlo en un solo sitio.

## 11. Referencia visual

Lienzo de diseño con las tres propuestas (la C es la elegida): https://claude.ai/artifact/RahjQhcXF453NQtnY2YPkh

Si no puedes abrir el enlace, este documento es la fuente de verdad.
