# People's Protocol — Documento del Proyecto

*Colosseum Crypto World's Fair 2026 · Heavy Duty Builders*

Sep 30, 2026 · @Ren3 · *actualizado el 1 de octubre de 2026 con lo aprendido al construir el piloto (detalle en `Docs/plan.md`)*

## Resumen ejecutivo

**People's Protocol no es una app: es infraestructura.** Es un protocolo abierto que vive en Solana (un esquema público de atestaciones en Solana Attestation Service) más un SDK público para consultarlo. La página web con la que interactúa una persona es solo el *cliente de demostración* que construimos para el hackathon — la prueba de que el protocolo funciona, no el activo en sí.

El valor no está en esa interfaz, sino en tres capas que se acumulan detrás de ella:

1. **Las reglas on-chain (Solana Attestation Service).** Las reglas — qué cuenta como una atestación válida, cómo se evita duplicar una misma factura — quedan fijadas en código público, no en el servidor de una empresa. En el piloto no hace falta un programa Anchor propio: la dirección de cada atestación se calcula a partir de la propia factura, así que registrarla dos veces es imposible.
2. **El registro de evidencia que se va acumulando.** Cada atestación nueva aumenta el valor del conjunto: cuantas más personas registren su historial, más útil es el protocolo para quien verifica.
3. **El SDK abierto.** Cualquier plataforma — un banco, una agencia inmobiliaria, otro proyecto — puede integrarlo para emitir o consultar atestaciones sin pedirnos permiso ni pasar por nuestra app.

Para el piloto sí construimos una app — una página donde alguien genera su prueba (VeriFactu; zkTLS queda para más adelante), otra donde cualquiera la comprueba y otra con el histórico de una persona —, pero es deliberadamente fina: existe para que los jueces "vean la cosa funcionar" de extremo a extremo, no para ser el producto final.

## El problema

Un inquilino paga a tiempo durante años. Un empleado nunca falta. Pero ese historial vive solo en la cuenta del banco o en los registros del casero anterior: no es portable ni verificable por nadie más. Si esa persona quiere alquilar en otra ciudad o pedir un crédito, tiene que empezar de cero, sin poder demostrar nada de lo anterior.

Del otro lado, un fondo, un banco o una agencia inmobiliaria que recibe a un cliente nuevo no puede confiar en su historial sin pedir documentación manual, lenta, y que de todas formas no puede verificar de forma independiente (un justificante de pago se puede editar; una carta de recomendación no se puede comprobar).

**El dato existe. El problema es que nadie más puede verificarlo sin confiar a ciegas en quien lo guarda primero.**

## Para quién

**Aclaración de términos:** en este documento "institucional" significa negocio o institución financiera — un banco, un fondo, una aseguradora, una agencia inmobiliaria, una administradora de fincas — nunca administración pública (ayuntamiento, Seguridad Social, Hacienda). El protocolo no está diseñado hoy para verificar frente a organismos públicos; eso sería una extensión distinta, no necesaria para el piloto.

| Rol | Ejemplo | Evidencia que aporta | Quién la verifica |
| --- | --- | --- | --- |
| Particular | Inquilino, empleado, autónomo | Pagos de alquiler, nómina, facturas | Un casero privado, un banco, un prestamista |
| Institucional (negocio) | Agencia inmobiliaria, administradora de fincas, pyme, fondo, banco | Historial de pagos a proveedores o inquilinos, facturación recurrente | Otro banco, un fondo, una aseguradora |

Sobre el ejemplo de demo: una **agencia inmobiliaria o administradora de fincas** es mejor ejemplo que un casero individual. Gestiona muchos inquilinos a la vez, ya es una entidad profesional (más fácil de dar de alta como "emisor" verificado en el protocolo) y genera muchas atestaciones desde un solo emisor — justo lo que hace falta para una demo con volumen real en el hackathon. Sigue siendo el mismo lado "institucional" del cuadro de arriba: no hace falta reclasificar nada, solo cambiar el ejemplo concreto.

El valor para particulares va más allá del alquiler: un historial centralizado y verificable sirve para pedir una hipoteca, alquilar el siguiente piso, o incluso para seguros que fijan el precio según la confianza y el perfil de riesgo — un seguro de vida sube con la edad por el riesgo de mortalidad, uno de coche baja con la experiencia al volante. Hoy esa confianza hay que reconstruirla desde cero cada vez; con un historial portátil, se lleva consigo.

## Cómo funciona

&#91;embedded content: flujo de People's Protocol · 4 pasos\]

Cada flecha es una transacción o una llamada de API — ninguna requiere permiso de la plataforma donde ocurrió el hecho original.

- **Evidencia real**: el pago de alquiler, la nómina o la factura ocurre en el banco, en HR o en el sistema de facturación.
- **Prueba de origen**: Reclaim Protocol (zkTLS) para portales con sesión, o el QR de VeriFactu para facturas españolas.
- **Registro on-chain**: la atestación se publica en Solana Attestation Service (SAS) en una dirección única derivada de la evidencia (sin programa propio), así que la misma evidencia no se registra dos veces.
- **Verificación**: cualquiera con el identificador puede comprobar la atestación en Solana, sin pedir permiso a nadie.

**Para el piloto (v1):** la evidencia se consigue con VeriFactu, no con zkTLS. La explicación de zkTLS de la sección siguiente ("En detalle") describe el mecanismo para más adelante, cuando no hay una factura de por medio — ver "Especificación funcional mínima" y "El escenario ideal en producción".

### En detalle: ¿cómo "lee" el protocolo la información de un usuario?

&#91;embedded content: el viaje de Ana, usuaria final · 7 pasos\]

No la lee: nuestro programa en Solana nunca entra en la web del banco. Lo que recibe es una prueba ya hecha, generada en el propio dispositivo del usuario, durante una sesión que él mismo abre con su contraseña normal. Ejemplo con Ana, la inquilina:

1. Ana abre la app y pulsa "verificar mi pago de alquiler".
2. Eso abre la página real de su banco, dentro de esa misma herramienta. Ana mete su usuario y contraseña de siempre — nunca pasan por nosotros, es una conexión directa entre Ana y su banco.
3. Mientras la página muestra "Pago recibido: 800€, concepto Alquiler, 3 de marzo", el software de Reclaim, que corre en el dispositivo de Ana (no en un servidor nuestro), genera una prueba criptográfica de una sola cosa: *esta conexión cifrada con el banco, en este momento, mostró exactamente este texto* — sin revelar su contraseña ni el resto de la cuenta.
4. Esa prueba —no la pantalla completa, no el dato en bruto— es lo que Ana envía a nuestro programa en Solana para registrarla.

La analogía más simple: un notario que certifica la fotocopia de **una sola línea** de tu extracto bancario, sin ver el resto y sin pedirle permiso al banco — solo necesita que tú le enseñes tu pantalla un momento.

### Un matiz importante: esto no es "conecta una vez y listo"

**Hay que decirlo con la misma honestidad que el resto del documento: generar una prueba zkTLS no es automático ni continuo.** Cada vez que alguien quiere añadir una prueba nueva (el pago de este mes, la nómina de este mes), tiene que completar ese pequeño flujo de nuevo — no es "conecta tu banco una vez y a partir de ahí todo se sincroniza solo".

Esto no es un descuido de diseño: es la consecuencia directa de no depender del permiso de nadie. Un sistema que sincronizara automáticamente cada mes necesitaría una de estas dos cosas, y ambas rompen la premisa del protocolo:

- Que el banco nos diera una API propia — justo lo que dijimos que no vamos a pedir, porque nadie nos la va a dar.
- Que guardáramos la contraseña del usuario para entrar en su nombre automáticamente — el tipo exacto de riesgo de seguridad que zkTLS existe para evitar.

La fricción es el precio de no necesitar el permiso de nadie. Dicho esto, no es tan mala como "copiar y pegar datos a mano": es un login dirigido que dura bajo un minuto, y dependiendo de cómo se integre el SDK de Reclaim (una extensión de navegador que aprovecha una sesión que el usuario ya tiene abierta, en vez de un navegador embebido que pide loguearse de cero) puede ser bastante más ligero de lo que suena. Ese detalle de integración exacto es uno de los puntos técnicos a comprobar el primer día (ver "Próximos pasos").

**Matiz técnico pendiente de comprobar:** además, cada banco o plataforma necesita una "plantilla" preconfigurada. Reclaim ya tiene plantillas para algunos sitios; para otros hay que crear una propia con su herramienta de desarrollo.

Para VeriFactu es distinto y más simple: no hace falta sesión ni contraseña, porque la página de verificación de Hacienda es pública — cualquiera, incluido nuestro propio servidor, puede consultar los datos del QR y recibir "factura encontrada / no encontrada", como una búsqueda web normal, sin fricción de usuario en absoluto.

**Para el piloto del hackathon esto no bloquea nada:** solo hace falta demostrar UNA verificación funcionando de principio a fin en la demo, no un sistema recurrente automático. Reducir esta fricción para el uso real (verificaciones mensuales, por ejemplo) es trabajo de fase 2.

## Por qué esto necesita blockchain de verdad

Antes de tocar una cadena, aplicamos un test de cuatro propiedades: si ninguna aplica de verdad, no hace falta blockchain. Aquí sí aplican, y así es como cada una se cumple:

| Propiedad | Qué significa aquí |
| --- | --- |
| Código como ley | Nadie — ni el equipo, ni un emisor — puede alterar una atestación ya emitida. El emisor puede retirarla, pero la retirada queda registrada públicamente: no se puede hacer a escondidas |
| Inmutabilidad | El historial no puede reescribirse retroactivamente para inflar o borrar una reputación: hasta una retirada deja rastro público |
| Trazabilidad pública | Cualquiera puede auditar cuándo y por quién se emitió cada atestación |
| Portabilidad neutral | Un casero y un banco competidores verifican el mismo dato sin que ninguno controle la plataforma del otro |

**Matiz honesto:** la propiedad 1 (código como ley) es parcial, no total. El registro y el verificador son un programa inmutable, pero la prueba de zkTLS todavía depende de los *attestors* de Reclaim — un punto de confianza que Reclaim documenta como algo que está descentralizando, no como algo ya resuelto. Hay que decirlo así de claro ante los jueces: no prometemos autenticidad perfecta, prometemos niveles de confianza explícitos.

## Glosario sin jerga

| Concepto | Qué es, en plano |
| --- | --- |
| Solana | La blockchain (red pública) sobre la que construimos: rápida y barata comparada con Ethereum. |
| Programa | El "contrato inteligente": código que vive en Solana y hace cumplir unas reglas para siempre (nadie lo puede editar a mitad de partido sin que se note). |
| Anchor | El framework que se usa para escribir programas de Solana más fácil — como Django para Python. No es una red distinta, es una herramienta de desarrollo. |
| PDA (Program Derived Address) | Una "casilla" única en la blockchain, generada automáticamente a partir de unos datos (ej. NIF + número de factura). Sirve para que la misma evidencia no se pueda registrar dos veces. |
| Atestación / SAS (Solana Attestation Service) | SAS es un servicio ya construido en Solana para "firmar" y publicar afirmaciones verificables. Una atestación es una de esas afirmaciones ya publicada (ej. "este pago fue real"). Lo usamos como la capa que publica el resultado; no hay que reinventarla. |
| zkTLS | Una técnica que permite demostrar que una web con sesión iniciada (banco, nómina, Airbnb…) te mostró un dato concreto, sin enseñar el resto de la cuenta ni pedirle permiso a esa web. Es como una captura de pantalla de tu propia sesión, pero verificable criptográficamente. |
| Reclaim Protocol | La empresa/protocolo concreto que ofrece zkTLS ya listo para usar, con SDK para Solana. |
| VeriFactu | Un sistema del Estado español (Hacienda / AEAT): a partir de 2027 cada factura llevará un QR que cualquiera puede escanear para comprobar en la web de Hacienda que esa factura es real. Es útil porque el "verificador público" ya lo construyó el Estado. |
| Devnet vs. mainnet | Solana tiene una red de pruebas (devnet), gratuita, para programar y probar sin gastar dinero real, y la red real (mainnet), donde ya se mueve valor. El piloto del hackathon corre en devnet: coste cero. |
| RPC / proveedor de RPC | La "puerta de entrada" técnica para que una app hable con Solana (consultar datos, enviar transacciones). No se monta un servidor propio: se usa un proveedor externo (Helius, QuickNode…), varios con plan gratuito. |
| HR | "Human Resources" (Recursos Humanos): el sistema de una empresa donde se gestionan nóminas y datos laborales. Es una posible fuente de evidencia para el caso de un empleado. |
| Wallet | La "cuenta" de Solana de una persona: una dirección pública más una clave privada que solo ella controla. Las atestaciones quedan ligadas a una wallet, no a un email o un DNI. |

## Arquitectura técnica del piloto

&#91;embedded content: arquitectura del piloto · 4 componentes\]

Cada flecha es un límite de confianza: nadie del otro lado necesita darnos permiso para que la información la cruce. La "App + SDK" es la única capa que construimos a medida; todo lo demás (SAS, los RPC, Solana en sí) ya existe y es gratuito en devnet.

**Proveedor de RPC (gratis):** para hablar con Solana no se monta un nodo propio, se usa un proveedor externo. La propia página de recursos de Colosseum lista varias opciones con plan gratuito de sobra para un piloto: **Helius** (1 millón de créditos al mes, 10 peticiones/segundo, sin tarjeta) o **RPC Fast** (1,5 millones de unidades de cómputo al mes, sin tarjeta) son los dos planes gratuitos más generosos para desarrollar en devnet.

**Recursos de Colosseum a aprovechar:** en la sección "Resources" de la plataforma del hackathon hay, además de RPC providers, pestañas de "Sponsored tools and offers", "Wallets and onboarding", "Development setup" y "Learn Solana" — vale la pena revisarlas antes de escribir la primera línea de código. Si quien programa usa un agente de código, Colosseum ofrece un skill instalable (`npx skills add Colosseum`) que da recomendaciones de documentación y herramientas directamente en el entorno de desarrollo.

### En producción: ¿nos integramos con el Estado?

No, y esa es la clave: **no necesitamos que Hacienda ni ningún banco nos den acceso.** El protocolo está diseñado justo para no depender de esa cooperación. Hay tres roles distintos, y solo uno implica "integrarse" con algo:

1. **Quien aporta la evidencia** (el inquilino, el autónomo) usa el acceso que YA tiene — su sesión bancaria, el QR de su propia factura — y genera la prueba desde ahí. No hace falta que nadie externo apruebe nada.
2. **El sistema de origen** (el banco, la AEAT, la plataforma de alquiler) no se entera de que existimos ni tiene que cooperar. Con VeriFactu en concreto, no nos integramos EN Hacienda: Hacienda ya publica un servicio público de verificación de facturas (el QR) abierto a cualquiera, y nosotros simplemente lo consultamos — igual que lo haría un ciudadano a mano. Es leer algo ya público, no una integración con el Estado.
3. **Quien verifica** (el casero, el banco, la aseguradora) es la única parte que, en producción madura, podría llegar a integrarse de verdad — añadiendo un botón de "comprobar en People's Protocol" a su propio software con nuestro SDK abierto. Eso es opcional y lo decide cada verificador a su ritmo; no depende de que nosotros lo negociemos caso por caso.

**El techo real, con honestidad:** VeriFactu será obligatorio en 2027 — para sociedades desde el 1 de enero, para autónomos y el resto desde el 1 de julio (el Real Decreto-ley 15/2025 lo aplazó un año) —; hasta entonces su uso es voluntario. Genera evidencia real para cualquiera que ya facture con él, y en 2027 será la norma. Y si algún día quisiéramos emitir nosotros mismos atestaciones de "sin incidencias" (no solo "esta factura existe"), ahí sí necesitaríamos convertirnos en un emisor con credencial SAS propia — lo que implica pasar nuestro propio KYC. Eso es un paso de fase 2, no algo necesario para el piloto.

## El piloto del hackathon

Es un piloto: todo lo que construimos para el hackathon corre a coste cero, sobre infraestructura que ya existe.

### MVP gratuito

| Componente | Qué hace | Coste |
| --- | --- | --- |
| Solana Attestation Service (SAS) | Credencial, schema y atestaciones — sin programa propio; se usa directamente con su SDK oficial | Gratis |
| Pagos afirmados por el emisor | Tercer nivel de confianza: la agencia publica pagos desde su propio sistema, sin comprobación externa, y así se etiqueta | Gratis |
| VeriFactu (AEAT) | Verifica públicamente que una factura real existe y fue declarada a Hacienda | Gratis (servicio público) |
| Emisor propio de demo | El equipo simula el rol de agencia inmobiliaria / administradora de fincas para la demo de extremo a extremo | Gratis (dato propio) |
| Página de verificación | Introduces un identificador y ves la atestación on-chain | Gratis (Vercel) |
| Historial por titular | Todas las pruebas ligadas a una wallet, con su nivel de confianza | Gratis (Vercel) |
| Proveedor de RPC | Helius o RPC Fast, plan gratuito | Gratis |

El piloto demuestra el mecanismo completo con datos ficticios pero comprobables — la factura de ejemplo que publica la propia AEAT — sin gastar un euro.

### Fase 2: qué se deja para después

Necesario para escalar el protocolo, no para demostrar que el concepto funciona:

- Red abierta de múltiples emisores (bancos, plataformas de alquiler, HR de terceros)
- Automatizar la ingesta de facturas VeriFactu para todos los inquilinos de la agencia, no solo el caso de ejemplo de la demo
- Integración con ACE (Application Controlled Execution) de Solana
- Gobernanza anti-colusión entre emisores
- Scoring con IA sobre el historial agregado
- Apps móviles nativas para particulares
- Añadir zkTLS (u Open Banking) como mecanismo alternativo para particulares sin agencia de por medio — ver "El escenario ideal en producción"

## Especificación funcional mínima (para desarrollo)

Con esto cerrado, el documento ya tiene lo mínimo que hace falta para pasarlo a desarrollo sin preguntas a medias.

### Flujo de la demo, paso a paso

1. La agencia (emisor demo) emite una factura real bajo VeriFactu — por ejemplo, del alquiler de María — que ya lleva su código de verificación.
2. El backend de la agencia toma ese código y lo consulta contra la Sede Electrónica de la AEAT.
3. La AEAT confirma que la factura es real y fue declarada.
4. El backend llama al SDK de Solana Attestation Service (SAS) y publica una atestación: "esta factura existe y está verificada", bajo la credencial de la agencia y el schema definido más abajo.
5. La atestación queda publicada en devnet con un identificador público.
6. En la página de verificación, cualquiera introduce ese identificador y ve: emisor, tipo de evento, periodo y un enlace a Solana Explorer (devnet).
7. Si el identificador no existe, la página muestra "no encontrado", sin fallar.

### Fuente de la evidencia: factura de ejemplo de la AEAT (decidido: todo ficticio)

**Decisión final (30-09-2026):** todo ficticio. Se usa la factura de ejemplo que publica la propia AEAT (NIF de pruebas 89890001K, 241,40 €), que la página pública de validación responde como «Encontrada»: cualquier juez puede comprobarla. La agencia ficticia usa ese NIF y solo registra sus propias facturas.

~~**Opción preferida:** un miembro del equipo que sea autónomo emite una factura real (por un importe simbólico, por un servicio cualquiera entre el equipo) bajo el sistema VeriFactu. Al ser una factura, está pensada por ley para ser pública — no expone nada sensible, a diferencia de un extracto bancario.~~

**Alternativa 100% de pruebas:** si no es posible conseguir una factura real a tiempo, la AEAT ofrece un entorno de pruebas (sandbox) para desarrolladores. Es completamente ficticio y sin ningún riesgo, con una salvedad: los datos de prueba no aparecen en la consulta pública real, así que un verificador externo no podría comprobarlo por su cuenta durante la demo.

### Esquema de datos de la atestación

*Actualizado: el esquema original guardaba el hash del identificador del usuario y el código de la factura en claro. El primero se revierte en minutos (solo hay ~100 millones de DNI posibles) y el segundo publicaba el NIF y el importe. Detalle en `Docs/plan.md`, decisión 5.*

| Campo | Qué contiene |
| --- | --- |
| `event_type` | Tipo de evento, por ejemplo "rent\_payment" |
| `period` | Mes al que corresponde el evento (AAAA-MM) |
| `evidence_source` | De dónde sale la prueba: factura VeriFactu comprobada por la AEAT, o pago afirmado por el emisor (nivel de confianza) |
| `evidence_commitment` | Huella SHA-256 de los datos de la factura más una «sal» aleatoria. Los datos y la sal solo viajan en el enlace que comparte el titular |
| `payment_confirmed` | Que el emisor afirma el pago (Hacienda solo confirma que la factura existe) |
| `holder` | Wallet del titular, si decidió ligarla; vacío si no |
| `issued_at` | Fecha y hora de emisión |

El emisor no va como campo: la credencial SAS del emisor ya forma parte de la atestación. Nada de importes, NIF ni datos personales en claro queda on-chain.

### Programa on-chain: ninguno propio

No hace falta escribir, auditar ni desplegar un programa Anchor. Se usa directamente el SDK oficial de Solana Attestation Service: `create_credential` (una vez, para registrar a la agencia demo como emisor), `create_schema` (una vez, para el esquema de arriba) y `create_attestation` (una vez por cada evento publicado). El antiduplicado sale de la dirección de cada atestación, que SAS calcula a partir de un valor derivado de la propia factura.

### Stack del front de la demo

*Actualizado:* Next.js con TypeScript, alojado gratis en Vercel. Una página HTML suelta no basta: la consulta a Hacienda tiene que hacerse desde un servidor (el navegador bloquea las peticiones a otra web) y la clave con la que firma el emisor tiene que quedar oculta. Interfaz en inglés y en español. Vistas: inicio, generar prueba (asistente de 4 pasos), comprobar una prueba (certificado) e historial por titular.

### Criterios de aceptación del MVP

- [x] Al menos una factura verificada contra la Sede Electrónica de la AEAT (la de ejemplo de la AEAT)
- [x] Atestación publicada en SAS (devnet), visible en Solana Explorer
- [x] Página de verificación funcionando en vivo, con caso positivo y caso negativo
- [x] Todo el flujo se ejecuta sin tocar la cadena a mano durante la demo
- [x] Toda la interfaz (textos, botones, mensajes) en inglés — y también en español
- [x] Coste total: 0 €

## El escenario ideal en producción (visión a futuro — no aplica al desarrollo del piloto)

**Nota de alcance — no es parte del desarrollo del piloto:** todo lo descrito en esta sección es la visión de producto a largo plazo, no funcionalidad a construir para el hackathon. Si este documento se usa como especificación funcional (por ejemplo, en Claude Code), el alcance de desarrollo real es únicamente el descrito en "El piloto del hackathon" (MVP gratuito). Esta sección es contexto estratégico, no un requisito de implementación.

zkTLS es la vía de **arranque**: no necesita que nadie coopere, así que sirve para demostrar el concepto desde el día uno. Pero no es el estado final. En producción madura, la fricción descrita en "Cómo funciona" solo persiste en uno de tres caminos posibles.

### 1. El emisor institucional automatiza — el camino real a la escala

Cuando una agencia inmobiliaria o una administradora de fincas se registra como emisor verificado (con su propia credencial SAS, pasando KYC una vez), deja de depender de que cada inquilino pruebe nada con zkTLS. La agencia integra nuestro SDK directamente en su propio software de gestión, y publica automáticamente, en un solo lote periódico, atestaciones para todas las relaciones que ya gestiona ("estos 200 inquilinos pagaron a tiempo este mes") — sin que el inquilino tenga que hacer nada. Esto es lo que "conecta una vez y ya" parece en la práctica: ocurre en el lado de la institución, no en el del individuo. Es la razón de fondo por la que usar una agencia inmobiliaria o administradora de fincas como emisor de demo no es solo un mejor ejemplo — es el modelo que de verdad escala, y hacia el que empuja el diseño del protocolo.

### 2. Open Banking (PSD2) para quien no tiene un emisor institucional detrás

Para un inquilino con un casero particular sin gestión profesional, existe una vía de mucha menos fricción para evidencia bancaria en la UE, y ya está regulada: el usuario da su consentimiento **una vez**, con el mismo tipo de pantalla que ya usa para dar de alta Bizum u otras apps financieras, y ese acceso de solo lectura sirve de forma recurrente, renovándose periódicamente según la normativa (habitualmente en el entorno de los 90 días — plazo exacto a confirmar). A diferencia de zkTLS, aquí sí hay "cooperación" del banco — pero no es una que tengamos que negociar caso por caso: es obligación legal para todos los bancos de la UE por igual, así que sigue sin depender de que un banco concreto quiera colaborar con nosotros.

### 3. zkTLS como red de seguridad para el resto de los casos

Para todo lo que no tiene ni emisor institucional integrado ni pasa por un banco sujeto a Open Banking (reseñas de Airbnb, trabajo informal, un banco fuera de la UE), zkTLS sigue siendo la vía — con la fricción ya descrita, suavizada con mejores modos de integración (extensión de navegador, agrupar varios meses en una sola sesión).

**En una frase:** en producción madura, la mayoría de las atestaciones las publican instituciones verificadas de forma automática; zkTLS y Open Banking cubren, cada uno a su manera, los huecos donde no hay una institución integrada detrás. El piloto del hackathon demuestra el mecanismo con VeriFactu (zkTLS queda para más adelante) y enseña ya el camino institucional con los pagos afirmados por el emisor; el vector de crecimiento real es la adopción institucional, no que millones de individuos repitan un login cada mes.

## Próximos pasos

- [x] Emisor de demo: el equipo simula la agencia inmobiliaria/administradora de fincas (decidido; ver tabla del MVP).
- [x] Evidencia: todo ficticio, con la factura de ejemplo de la AEAT (decidido el 30-09-2026).
- [x] Alcance del día 1: solo VeriFactu (decidido) — zkTLS queda para más adelante (ver Escenario ideal).
- [x] Proveedor de RPC: Helius, configurado en Vercel (01-10-2026).
- [ ] Revisar la pestaña "Resources" de Colosseum (RPC providers, sponsored tools, wallets, development setup) antes de escribir código
- [ ] Decidir si se quiere añadir administración pública como una tercera audiencia (fuera del alcance del piloto actual)
- [x] Interfaz completa en inglés y español.

### Enlaces

- [Deck de la presentación — People's Protocol](https://claude.ai/artifact/A2yh3kR5CXYvoy3ukjdns2): portada, problema, para quién, cómo funciona, valor, MVP, fase 2 y anexo de arquitectura.

Este documento y el deck se complementan: el deck es para presentar en 3–5 minutos; este documento es la referencia completa — con el glosario y el detalle técnico — para quien vaya a escribir el código o quiera profundizar.
