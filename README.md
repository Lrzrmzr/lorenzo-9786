# SnailBet

Aplicación web con temática de apuestas en carreras de caracoles. Permite registrarse, iniciar sesión, consultar un dashboard con las estadísticas de la jornada y recargar saldo mediante **SnailPay**, una pasarela de pagos simulada.

> **Aviso:** SnailPay es un servicio simulado. No se conecta con pasarelas reales ni procesa información financiera real; todos los datos de tarjeta son ficticios.

## Contenido

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Variables de entorno](#variables-de-entorno)
- [Pruebas](#pruebas)
- [SnailPay](#snailpay)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Seguridad y limitaciones conocidas](#seguridad-y-limitaciones-conocidas)

## Funcionalidades

- **Registro e inicio de sesión simulados** con persistencia en el navegador: contraseñas derivadas con PBKDF2-SHA256, bloqueo temporal tras 5 intentos fallidos y sesión que expira a las 24 horas.
- **Dashboard** con el saldo, una gráfica de dona de apuestas ganadas y perdidas, y una gráfica de barras de victorias por caracol. Los datos de las carreras los genera el servidor de forma determinista por fecha.
- **Recarga de saldo con SnailPay:** formulario con máscaras de tarjeta, manejo de cada resultado de la pasarela (aprobado, rechazado, datos inválidos, error del sistema, timeout) e idempotencia para que un reintento nunca cobre dos veces.

## Stack

| Capa         | Tecnología                                                                           |
| ------------ | ------------------------------------------------------------------------------------ |
| Frontend     | React 19, Vite, TypeScript, Mantine 8 (UI y gráficas), React Router, React Hook Form |
| Backend      | Express 5, TypeScript                                                                |
| Validación   | Zod 4, con los esquemas compartidos entre frontend y backend                         |
| Persistencia | LocalStorage (simulación en el navegador)                                            |
| Pruebas      | Vitest, Supertest, Playwright                                                        |
| Monorepo     | pnpm workspaces                                                                      |

## Requisitos

- **Node.js 24** o superior.
- **pnpm 11.** Si no lo tienes, una opción es `npm install -g pnpm`.

## Instalación y ejecución

```bash
pnpm install
pnpm dev
```

`pnpm dev` levanta los dos servicios en paralelo:

| Servicio       | URL                                          |
| -------------- | -------------------------------------------- |
| Aplicación web | http://localhost:5173                        |
| API            | http://localhost:3001 (salud: `/api/health`) |

En desarrollo, Vite reenvía `/api` al servidor, así que el navegador solo habla con `localhost:5173`.

Para levantar cada servicio por separado:

```bash
pnpm --filter @snailbet/server dev
pnpm --filter @snailbet/client dev
```

Otros comandos (desde la raíz):

| Comando                             | Qué hace                              |
| ----------------------------------- | ------------------------------------- |
| `pnpm build`                        | Compila el cliente y el servidor      |
| `pnpm typecheck`                    | Revisa los tipos de los tres paquetes |
| `pnpm lint`                         | ESLint                                |
| `pnpm format` / `pnpm format:check` | Prettier                              |

## Variables de entorno

Todas tienen un valor por defecto: el servidor arranca sin configuración. Para cambiarlas, copia `server/.env.example` como `server/.env`.

| Variable                        | Por defecto             | Descripción                                                    |
| ------------------------------- | ----------------------- | -------------------------------------------------------------- |
| `PORT`                          | `3001`                  | Puerto del API                                                 |
| `CLIENT_ORIGIN`                 | `http://localhost:5173` | Orígenes permitidos por CORS, separados por coma               |
| `SNAILPAY_FORCE_OUTAGE`         | `false`                 | `true` simula una caída total de la pasarela                   |
| `SNAILPAY_TIMEOUT_DELAY_MS`     | `15000`                 | Retraso de la tarjeta de timeout (supera los 10 s del cliente) |
| `PAYMENT_RATE_LIMIT_PER_MINUTE` | `20`                    | Cobros permitidos por minuto y por IP                          |

Las variables se validan al arrancar: si alguna es inválida, el servidor no inicia y explica cuál.

## Pruebas

```bash
pnpm test        # unitarias y de API (Vitest + Supertest), en los tres paquetes
pnpm test:e2e    # flujos completos en el navegador (Playwright)
```

Antes de la primera ejecución E2E, instala el navegador:

```bash
pnpm --filter @snailbet/client exec playwright install chromium
```

Playwright levanta el servidor y el cliente automáticamente. Si ya tienes `pnpm dev` corriendo, los reutiliza; para la suite completa conviene detenerlo, porque Playwright inicia el servidor con un límite de cobros más alto.

| Nivel     | Qué cubre                                                                                                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unitarias | Esquemas de validación, cada regla de SnailPay y su orden, la fábrica de respuestas, el almacén de idempotencia, la simulación de carreras, el hash de contraseñas, el estado de la sesión, el adapter de pagos y la acreditación del saldo |
| API       | Cada escenario de SnailPay por HTTP: códigos, forma completa de la respuesta, validación, caída forzada, idempotencia, rate limit y que la tarjeta nunca llegue a los logs                                                                  |
| E2E       | Registro, inicio y cierre de sesión, redirecciones, recarga aprobada, rechazada y con error, timeout con reintento usando la misma llave de idempotencia y doble clic                                                                       |

El workflow de GitHub Actions (`.github/workflows/ci.yml`) ejecuta formato, tipos, lint y todas las pruebas en cada push y pull request.

## SnailPay

El contrato completo (campos, códigos HTTP, orden de evaluación y ejemplos con curl) está en [`docs/snailpay-api.md`](docs/snailpay-api.md).

```
POST /api/snailpay/payments
Content-Type: application/json
Idempotency-Key: <UUID v4>
```

Todas las respuestas incluyen los mismos campos. `status` es `approved`, `rejected` o `error`, y **el saldo solo cambia si es `approved`**.

### Escenarios

La interfaz incluye una sección "Tarjetas de prueba" para llenar estos datos con un clic.

| Escenario                         | Tarjeta               | Vencimiento            | CVV        | HTTP | `status_detail`            |
| --------------------------------- | --------------------- | ---------------------- | ---------- | ---- | -------------------------- |
| Cobro exitoso                     | `1234 1234 1234 1234` | `12/26`                | `543`      | 201  | `accredited`               |
| CVV incorrecto                    | `1234 1234 1234 1234` | `12/26`                | otro       | 201  | `invalid_security_code`    |
| Fecha incorrecta                  | `1234 1234 1234 1234` | otra futura            | `543`      | 201  | `invalid_expiration_date`  |
| Tarjeta vencida                   | cualquiera            | pasada, p. ej. `01/25` | cualquiera | 201  | `card_expired`             |
| Fondos insuficientes              | `4000 0000 0000 0002` | futura                 | cualquiera | 201  | `insufficient_funds`       |
| Tarjeta extraviada                | `4000 0000 0000 0119` | futura                 | cualquiera | 201  | `card_reported_lost`       |
| Alto riesgo                       | `4000 0000 0000 0259` | futura                 | cualquiera | 201  | `high_risk_blocked`        |
| Tarjeta no reconocida             | otra de 16 dígitos    | futura                 | cualquiera | 201  | `card_not_recognized`      |
| Datos inválidos                   | formato incorrecto    |                        |            | 400  | `invalid_request`          |
| Llave reutilizada con otros datos |                       |                        |            | 422  | `idempotency_key_mismatch` |
| Error del sistema                 | `4000 0000 0000 0500` |                        |            | 503  | `service_unavailable`      |
| Timeout                           | `4000 0000 0000 0408` |                        |            | 503  | `gateway_timeout`          |

La tarjeta de éxito se aprueba con sus datos exactos aunque la fecha actual sea posterior a 12/26: esa regla se evalúa antes que la de vencimiento.

### Simular el error del sistema

1. **Desde la interfaz:** usa la tarjeta `4000 0000 0000 0500`. No requiere tocar el servidor.
2. **Caída total:** con `SNAILPAY_FORCE_OUTAGE=true`, toda petición responde 503, incluida la tarjeta de éxito.
   - En `server/.env`: `SNAILPAY_FORCE_OUTAGE=true` y reinicia el servidor.
   - En bash: `SNAILPAY_FORCE_OUTAGE=true pnpm --filter @snailbet/server dev`
   - En PowerShell: `$env:SNAILPAY_FORCE_OUTAGE='true'; pnpm --filter @snailbet/server dev`

### Idempotencia

Cada intento de pago envía un `Idempotency-Key` (UUID). El servidor recuerda el resultado de cada llave durante 24 horas:

- **Misma llave y mismos datos:** devuelve la respuesta original sin cobrar de nuevo (encabezado `Idempotent-Replayed: true`).
- **Misma llave con datos distintos:** 422.
- **Los 503 no se guardan:** un reintento con la misma llave se procesa cuando el servicio se recupera.

El cliente **reutiliza la llave** cuando no hay resultado definitivo (timeout, 503, sin red o 429) y **genera una nueva** después de un resultado definitivo. Además, acredita cada operación una sola vez por su `id`, como segunda protección contra el cobro doble.

El cliente aborta la petición a los **10 segundos** y muestra "No pudimos procesar tu recarga. Tu saldo no fue modificado." con la opción de reintentar.

## Arquitectura

| Capa       | Enfoque                                                          | Por qué                                                                                              |
| ---------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Backend    | Capas: rutas → controladores → servicios                         | La lógica de negocio son funciones puras que no conocen Express; se prueban sin levantar el servidor |
| Frontend   | Organización por funcionalidad (`auth`, `dashboard`, `payments`) | Todo lo de una funcionalidad vive junto                                                              |
| Compartido | Paquete `shared` con esquemas Zod y tipos                        | Frontend y backend validan con las mismas reglas y comparten el contrato de SnailPay                 |

### Patrones aplicados

| Patrón                                      | Dónde                                                                                           | Problema que resuelve                                                                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Strategy (tabla de reglas)                  | `server/src/services/snailpay/payment-rules.ts`                                                 | Cada escenario es una regla con condición y resultado; agregar uno no toca las demás. Se evalúan en orden y gana la primera que aplica |
| Factory                                     | `server/src/services/snailpay/payment-response.factory.ts`                                      | Un solo lugar construye las respuestas, así todas tienen los mismos campos                                                             |
| Repository                                  | Usuarios, sesión, pagos e intentos de inicio de sesión (cliente); `IdempotencyStore` (servidor) | Aísla el almacenamiento: con una base de datos solo cambiaría el repositorio                                                           |
| Adapter                                     | `client/src/features/payments/api/snailpay.client.ts`                                           | Traduce HTTP a un resultado de dominio tipado; el resto de la app no conoce códigos de estado                                          |
| Uniones discriminadas + `switch` exhaustivo | Contrato de pagos, sesión, estados de carga y de recarga                                        | Si se agrega un caso y no se maneja, TypeScript marca error al compilar                                                                |
| Inyección de dependencias                   | `createApp({ config, clock, idempotencyStore, logger })`                                        | Las pruebas usan una fecha fija y un almacén limpio                                                                                    |
| Provider + Reducer                          | `AuthProvider` con `useReducer`                                                                 | La sesión es una máquina de estados con transiciones explícitas                                                                        |
| Custom hooks                                | `useAuth`, `useDailyRaces`, `useTopUp`                                                          | La lógica vive en hooks y los componentes solo presentan                                                                               |
| Cadena de middlewares                       | Express                                                                                         | Seguridad (helmet, CORS, rate limit), registro y errores como pasos independientes                                                     |

Se evitó a propósito una arquitectura hexagonal completa, Redux y contenedores de inyección de dependencias: para el tamaño del proyecto multiplicarían archivos sin beneficio.

### Decisiones relevantes

- **Dinero en centavos enteros.** Los decimales de JavaScript no son exactos (`0.1 + 0.2 ≠ 0.3`).
- **Validación en dos capas.** El formulario valida formato para la experiencia de usuario; el servidor valida de nuevo porque nunca se confía en el cliente. Las reglas de negocio (vencimiento, rechazos) las decide la pasarela, para que cada escenario sea reproducible desde la interfaz.
- **La tarjeta no se valida con el algoritmo de Luhn**, porque la tarjeta de éxito requerida no lo cumple.
- **Fecha inyectada.** El vencimiento se calcula con un reloj que se pasa como parámetro, así las pruebas no dependen del día en que se ejecutan.
- **Carreras deterministas.** Los datos se generan con una semilla basada en la fecha: son estables durante el día y siempre congruentes (las victorias suman 6 y cada apuesta se gana solo si su caracol ganó). Se muestra la jornada del día anterior, ya terminada.

## Estructura del proyecto

```
client/                     Aplicación web (React)
  src/app/                  Router, tema y página 404
  src/features/auth/        Registro, inicio de sesión, sesión y rutas protegidas
  src/features/dashboard/   Saldo y gráficas
  src/features/payments/    Recarga con SnailPay: adapter, idempotencia y modal
  src/lib/                  Utilidades: dinero, fechas, HTTP con timeout, almacenamiento
  e2e/                      Pruebas E2E (Playwright)
server/                     API (Express)
  src/routes/               Definición de rutas
  src/controllers/          HTTP: leer la petición y responder
  src/services/snailpay/    Reglas, fábrica de respuestas y servicio de la pasarela
  src/services/races/       Simulación determinista de carreras
  src/repositories/         Almacén de idempotencia
  src/middleware/           Rate limit, registro de peticiones y errores
shared/                     Esquemas Zod, tipos y constantes compartidos
docs/                       Contrato de SnailPay y bitácora de uso de IA
```

## Seguridad y limitaciones conocidas

**Medidas implementadas:** contraseñas con PBKDF2-SHA256 (600,000 iteraciones y sal aleatoria) y comparación en tiempo constante; el mismo mensaje para correo inexistente y contraseña incorrecta; bloqueo tras intentos fallidos; datos de localStorage validados al leer; encabezados de seguridad con helmet; CORS restringido; rate limit en los cobros; y los logs nunca incluyen el cuerpo de las peticiones de pago.

**Limitaciones propias de una simulación:**

- **Autenticación en el navegador.** Todo lo que está en localStorage, incluido el saldo, lo puede ver y modificar el usuario. En producción, la autenticación y el saldo vivirían en el servidor, con la sesión en una cookie `httpOnly`.
- **Tarjeta y CVV en el historial.** Se guardan por requisito del proyecto y en la interfaz siempre se enmascaran. En una integración real lo prohíbe PCI DSS: el CVV nunca se almacena y la tarjeta se reemplaza por un token de la pasarela.
- **Almacén de idempotencia en memoria.** Se pierde al reiniciar el servidor y no se comparte entre instancias. En producción se usaría Redis o una restricción única en base de datos.
- **Acreditación en dos escrituras.** El saldo y la marca de pago acreditado se guardan por separado en localStorage; con una base de datos irían en una sola transacción.

La documentación del uso de herramientas de IA durante el desarrollo está en [`docs/ai-log.md`](docs/ai-log.md).
