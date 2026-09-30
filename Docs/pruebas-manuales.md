# Pruebas manuales — People's Protocol

Lista para repasar antes de cada publicación importante y antes de la demo. Los tests automáticos (`npm test`) cubren la lógica del protocolo: lectura del QR, huellas, antiduplicado y respuestas de la AEAT. Esto cubre lo que ve una persona.

Formato: **qué hacer → qué debe pasar**. Última pasada completa: ver la tabla del final.

## Salud

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| S1 | Abrir `/api/health?aeat=1` en producción | `ok: true`, `rpcHost: devnet.helius-rpc.com`, `issuerKeyConfigured: true`, `aeat: found`, saldo > 0,1 SOL |

## Navegación e idiomas

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| N1 | Abrir `/` con el navegador en español | Redirige a `/es` |
| N2 | En `/en/verify`, pulsar «Español» | Va a `/es/verify` (misma pantalla, otro idioma) |
| N3 | Abrir `/es/no-existe` | Página 404 propia, en español, con barra superior |
| N4 | A 390 px de ancho: inicio, generar, certificado, historial | Sin desplazamiento horizontal; menú colapsado que abre y cierra |
| N5 | Recorrer inicio, generar y comprobar solo con el teclado (Tab) | Foco visible en todos los controles |

## Wallet

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| W1 | Sin ninguna wallet instalada, pulsar «Conectar wallet» | Aviso para instalar Phantom, Solflare o Backpack |
| W2 | Con Phantom, pulsar «Conectar wallet» y aceptar | Aparece «Wallet XXXX…XXXX», «Mi historial» y «Desconectar» *(probado por Renato en Chrome, 01-10-2026)* |
| W3 | Recargar la página | Sigue conectada sin volver a preguntar |

## Generar prueba

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| G1 | Escribir «hola» y pulsar «Continuar» | Error: no es un enlace web |
| G2 | Pegar un QR de VeriFactu de otro NIF | Si Hacienda la encuentra: «Hacienda la confirma, pero no la emitió esta agencia» y sin botón de registrar |
| G3 | «Usar la factura de ejemplo» → «Continuar» | «Consultando a Hacienda…» y luego «Hacienda confirma que esta factura existe» con 241,40 €, 1 de septiembre de 2024 |
| G4 | «Registrar en Solana» (con la de ejemplo retirada) | «Registrando en Solana…» y luego «Tu prueba está lista» con el enlace y el aviso de guardarlo |
| G5 | Repetir G3 y G4 | «Esta factura ya estaba registrada» y botón a la prueba existente |
| G6 | «Portal con sesión» | Aparece como «Próximamente» y no se puede elegir |

## Comprobar una prueba

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| C1 | Abrir el certificado de ejemplo desde el inicio | Importe 241,40 €, fecha, aviso verde «coinciden con la huella» |
| C2 | Mismo identificador sin la parte `#e=…` | Importe y fecha «Ocultos», aviso de que el enlace no incluye los datos |
| C3 | Cambiar el importe dentro del enlace | Aviso «NO coinciden», sin mostrar el importe falso |
| C4 | Un identificador inventado (`11111111111111111111111111111111`) | «Prueba no encontrada» |
| C5 | Una prueba retirada (`npm run withdraw`) | «Prueba retirada» con enlace a la transacción |
| C6 | Pegar en el formulario un enlace completo de la web | Abre el certificado con la evidencia |
| C7 | Certificado de un mes «afirmado por el emisor» | Importe «No incluido», solo «Pago confirmado por…», aviso de que no hay comprobación externa |

## Historial

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| H1 | Desde un certificado con titular, «Ver el historial de pagos del titular» | 12 pruebas, resumen «1 con factura… · 11 solo afirmados…», etiqueta en cada una |
| H2 | Una wallet sin pruebas | «Esta wallet aún no tiene pruebas ligadas» |
| H3 | Texto que no es una wallet | Aviso de dirección no válida |

## Registro de pasadas

| Fecha | Dónde | Resultado |
|---|---|---|
| 01-10-2026 | Local y producción | Todas en verde salvo W2/W3, probadas por Renato (W2 ok). G2 comprobado por API (`not_issuer_invoice`). |
