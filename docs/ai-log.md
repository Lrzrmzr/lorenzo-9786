# Bitácora de uso de IA

## 1 - Preparación y monorepo

- **Herramienta:** Claude Code
- **Uso:** Se hizo la revisión del plan; borrador del README; generación de los archivos de configuración del monorepo (package.json, pnpm-workspace.yaml, tsconfig, .gitignore, .gitattributes, .editorconfig, Prettier).
- **Mi aportación:** ejecución de comandos, scaffolding con Vite, decisiones de nombres y revisión de cada archivo.
- **Validación:** `pnpm typecheck` sin errores y la app de Vite levantada en localhost:5173.

## 2 - Paquete compartido

- **Herramienta:** Claude Code
- **Uso:** escritura de esquemas Zod, tipos del contrato, constantes y pruebas unitarias a partir de las reglas definidas en el plan.
- **Mi aportación:** definición de las reglas de validación, revisión del código, ejecución de pruebas y verificación rompiendo reglas a propósito.
- **Validación:** `typecheck` y `test` en verde; prueba de mutación manual cambiando la longitud mínima de contraseña.

## 3 - Configuración del backend

- **Herramienta:** Claude Code
- **Uso:** generación del servidor Express (`createApp` con inyección de dependencias, middlewares de seguridad, logger estructurado, manejador de errores central, validación de variables de entorno con Zod y configuración de build con tsup) y de sus pruebas con Vitest y Supertest.
- **Mi aportación:** instalación de dependencias y aprobación de scripts de build (esbuild), creación de la estructura de carpetas, revisión del orden de la cadena de middlewares y de las decisiones de seguridad (no registrar el cuerpo de las peticiones, no exponer el detalle de errores al cliente).
- **Ajuste conforme al avance del desarrollo:** se descartó un middleware genérico `validate(schema)` porque las respuestas de la pasarela deben incluir todos los campos del contrato incluso con datos inválidos; esa validación se hará en el controlador de pagos.
- **Validación:** `typecheck` y `test` en verde; prueba manual con `curl` a `/api/health` y a una ruta inexistente; build de producción ejecutado con `pnpm start`; prueba de mutación desactivando Helmet, que hizo fallar la prueba de encabezados de seguridad.

## 4 - Pasarela de pagos simulada

- **Herramienta:** Claude Code
- **Uso:** escritura de la especificación en pruebas de la tabla de escenarios (TDD), la factory de respuestas, el servicio de pagos, el almacén de idempotencia, el controlador con rate limit, las pruebas de API y la documentación del contrato.
- **Mi aportación:** implementación de la tabla de reglas de la pasarela (`payment-rules.ts`) guiada por las pruebas; la primera versión tenía cuatro reglas faltantes y un error al usar la fecha en la regla de vencimiento, ambos detectados por las pruebas y corregidos. Revisión del flujo del controlador y pruebas manuales con curl.
- **Ajuste conforme al avance del desarrollo:** el límite de $50,000 pasó de ser un rechazo de negocio a una validación del esquema, porque la descipción en el documento exige que la tarjeta de éxito apruebe cualquier cantidad válida.
- **Validación:** `typecheck` y `test` en verde; pruebas manuales con curl del cobro exitoso, la repetición con la misma llave (mismo `id` y `Idempotent-Replayed`) y el conflicto 422; prueba de mutación desactivando el guardado de la llave de idempotencia, que hizo fallar las pruebas de repetición y conflicto.

## 5 - Datos simulados de carreras

- **Herramienta:** Claude Code
- **Uso:** generación del generador pseudoaleatorio con semilla, el catálogo de caracoles, el servicio que produce las 6 carreras y las apuestas simuladas, el endpoint `GET /api/races/daily-summary` y sus pruebas.
- **Mi aportación:** revisión de las reglas de congruencia contra los requisitos, verificación manual de la respuesta del endpoint (victorias por caracol, resultado de cada apuesta contra el ganador de su carrera y totales) y revisión del comportamiento de fechas en UTC.
- **Ajuste conforme al avance del desarrollo:** el endpoint devuelve la jornada del día anterior en lugar del día en curso, para que las 6 carreras ya hayan ocurrido; por eso la ruta se llama `daily-summary` en lugar de `today`.
- **Validación:** `typecheck` y `test` en verde (congruencia verificada en 30 fechas distintas); dos llamadas al endpoint con resultados idénticos; prueba de mutación forzando todas las apuestas como ganadas, que hizo fallar las pruebas de congruencia en las 30 fechas.

## 6 - Frontend y sistema de diseño

- **Herramientas:** Claude Code y Claude Design
- **Uso:**
  - Claude Code: redacción del brief de diseño (identidad, pantallas, estados, mensajes y restricciones) y traducción del diseño final a Mantine (tema, logotipo, ilustración, página 404, router, proxy de Vite y utilidades de dinero con sus pruebas).
  - Claude Design: generación del sistema de diseño a partir del brief (tokens, especificación de componentes y maquetas de escritorio y móvil).
- **Mi aportación:** revisión y ajuste del brief; iteración del diseño en Claude Design, incluido un rediseño propio ("Noche lima", oscuro con degradados); elección de la dirección final; revisión visual de la implementación en el navegador.
- **Ajuste conforme al avance del desarrollo:**
  - Se combinaron las dos versiones del diseño: la estructura, los estados, los textos y la accesibilidad de "Noche lima" con la identidad musgo y crema de la primera versión, en un solo tema claro. Motivo: se distingue más del estilo genérico de las herramientas de IA y reduce el alcance.
  - Se cambió Recharts de la versión 2 a la 3 porque la serie 2 está marcada como sin mantenimiento; la compatibilidad con Mantine se verificará al construir las gráficas.
- **Validación:** `typecheck` y `test` en verde; revisión en el navegador de la navegación entre páginas, la página 404 en escritorio y móvil, y el proxy `/api/health` a través de Vite.

## 7 - Autenticación

- **Herramientas:** Claude Code
- **Uso:**
  - especificación en pruebas del hash de contraseñas y del reducer de sesión (TDD); utilidades de almacenamiento validado y codificación; repositorios de usuarios, sesión e intentos de inicio de sesión; servicio de autenticación con sus pruebas; Provider, hook `useAuth`, rutas protegidas y pantallas de inicio de sesión y registro con indicador de fuerza de contraseña.
- **Mi aportación:**
  - Implementación de `password.service.ts` (PBKDF2-SHA256 con Web Crypto, sal aleatoria, iteraciones guardadas y comparación en tiempo constante) y de `auth-reducer.ts` (máquina de estados de la sesión, con `switch` exhaustivo mediante `never`), ambos guiados por las pruebas.
  - Las pruebas detectaron dos errores en mi primera versión, que corregí: lanzar un error (`throw false`) en lugar de devolver `false` ante un algoritmo desconocido, y el tipo de la sal, incompatible con Web Crypto.
  - Revisión del flujo completo en el navegador.
- **Ajuste conforme al avance del desarrollo:**
  - Los formularios pasaron a ser generados con IA para concentrar mi trabajo en las piezas de seguridad y estado, que son las que más requieren explicación.
  - Se agregó un setup de pruebas porque el entorno jsdom no incluye `crypto.subtle`.
- **Validación:** `typecheck` y `test` en verde; flujo mínimo requerido en el navegador (registro, saldo inicial de $0, persistencia al recargar, cierre de sesión, redirección sin sesión e inicio de sesión de nuevo); bloqueo tras 5 intentos fallidos; correo duplicado; revisión en localStorage de que solo se guarda el hash; prueba de mutación en la expiración de la sesión, que hizo fallar la prueba de las 24 horas.

## 8 - Dashboard

- **Herramientas:** Claude Code
- **Uso:**
  - `fetchWithTimeout` con AbortController (distingue la cancelación por tiempo de la cancelación de quien llama, para reutilizarlo en los pagos), utilidades de fechas en español y transformaciones puras de los datos de carreras a las gráficas, todo con pruebas.
  - Hook `useDailyRaces` con estados de carga, error y éxito como unión discriminada, cancelación al desmontar y reintento.
  - Componentes presentacionales: encabezado con confirmación de cierre de sesión, tarjeta de saldo, dona de apuestas y barras de victorias con el color fijo de cada caracol.
- **Mi aportación:**
  -revisión del diseño en el navegador en escritorio y móvil, comparación de las gráficas contra la respuesta del endpoint, revisión de los estados de saldo en cero, carga y error, y validación del UI definida conforme al brief.
- **Ajuste conforme al avance del desarrollo:**
  - Se confirmó que Recharts 3 funciona con las gráficas de Mantine: cada barra toma el color que trae su dato.
  - En móvil las barras se muestran horizontales, porque los nombres de los 6 caracoles no caben bajo barras verticales.
  - Si hay empate en el primer lugar no se muestra la insignia de favorito, porque destacar a uno solo sería engañoso.
  - Ante un error se muestra una sola tarjeta con "Reintentar" en lugar de una por gráfica; el saldo sigue visible.
  - El botón "Recargar con SnailPay" queda deshabilitado hasta la integración de pagos.
- **Validación:** `typecheck` y `test` en verde; Una prueba de `fetchWithTimeout` se quedó colgada porque el mock no rechazaba cuando la señal ya venía cancelada (un `fetch` real sí lo hace); se corrigió el mock, el código estaba bien. Revisión manual del estado de error deteniendo el servidor y del reintento al levantarlo. Prueba de mutación en el cálculo de porcentajes, que hizo fallar la prueba de suma 100.

## 9 - Integración con SnailPay

- **Herramientas:** Claude Code
- **Uso:**
  - Adapter `snailpay.client.ts`, que traduce cada respuesta HTTP a una unión discriminada (`approved`, `rejected`, `invalid`, `idempotency_conflict`, `unavailable`, `rate_limited`, `timeout`, `network_error`), con validación Zod de la respuesta antes de acreditar saldo.
  - Repositorio del historial de pagos y servicio de acreditación (una sola vez por `id`, en centavos, leyendo el saldo del almacenamiento).
  - Máscaras de tarjeta, vencimiento y CVV; modal de recarga con sus estados, errores por campo del 400 y tarjetas de prueba.
  - Pruebas escritas antes que mis piezas (TDD).
- **Mi aportación:**
  - Implementación de `useTopUp` (llave de idempotencia en `useRef`, protección contra doble envío, registro en el historial, acreditación y `switch` exhaustivo), de `shouldReuseIdempotencyKey` y del diccionario de mensajes al usuario.
  - La revisión detectó errores en mi primera versión, que corregí: imports equivocados por errores de sintaxis, acceso a `user` sin revisar el estado de la sesión, `result.kind` en el caso `never` y dos mensajes que inducían a error (el conflicto de llave decía que el pago ya se había procesado, y el de pago aprobado sin saldo invitaba a reintentar, lo que habría generado un segundo cobro).
- **Ajuste conforme al avance del desarrollo:**
  - Se agregó el resultado `rate_limited` (429), que no estaba en el plan, para no mostrarlo como un error genérico.
  - Se agregó `retryable` al estado de error: un pago aprobado cuyo saldo no se pudo guardar no muestra "Reintentar".
  - Cerrar el modal termina el intento: la llave se descarta.
- **Validación:** `typecheck`, `lint` y `test` en verde. En el navegador: cobro exitoso con saldo actualizado al instante y persistente al recargar, cada rechazo con su mensaje y sin cambio de saldo, error del sistema, caída forzada por entorno, timeout con reintento usando la misma llave (verificado en Network), llave nueva tras una aprobación, doble clic con una sola petición, historial en localStorage y modal en móvil.

## 10 - Pruebas automatizadas

- **Herramienta:** Claude Code
- **Uso:**
  - Auditoría de la cobertura contra el plan: las pruebas unitarias y de API ya se habían escrito en cada fase, así que esta fase se concentró en el E2E y el CI.
  - Configuración de Playwright (levanta servidor y cliente con `webServer`, con el rate limit ampliado para la suite), `tsconfig` de las pruebas E2E, exclusión de `e2e/` en Vitest, scripts `test:e2e` y workflow de GitHub Actions (calidad y E2E).
  - Región accesible "Saldo disponible" en la tarjeta de saldo, que también sirve como selector estable para las pruebas.
  - Borrador de las pruebas E2E y corrección de selectores.
- **Mi aportación:**
  - Escritura de las pruebas E2E de autenticación y recarga, incluida la de timeout con reloj falso (`page.clock`) y `page.route()`, que verifica que el reintento reutiliza el mismo `Idempotency-Key`.
  - Diagnóstico con el modo UI y los snapshots de `error-context.md`. La primera ejecución falló por textos que no coincidían con la interfaz y por un selector sugerido por la IA que no funcionaba: `getByLabel` con `exact` compara contra el texto de la etiqueta, que incluye el asterisco de campo obligatorio. Se resolvió buscando por rol y nombre accesible.
- **Ajuste conforme al avance del desarrollo:**
  - Se instaló `@playwright/test` directamente en lugar del asistente `create playwright`, para no generar ejemplos que luego habría que borrar.
  - Se eliminó una referencia de tipos de Vitest en `vite.config.ts` que el lint marcaba como redundante.
- **Validación:** `typecheck`, `lint`, Vitest y las 11 pruebas E2E en verde. Pruebas de mutación: con la llave descartada siempre falló la prueba de timeout, y con la resta en lugar de la suma falló la de recarga aprobada.

## 11 - Documentación y revisión final

- **Herramienta:** Claude Code
- **Uso:**
  - Borrador del README: instalación, variables de entorno, pruebas, escenarios de SnailPay, idempotencia, arquitectura, patrones, estructura y limitaciones conocidas.
  - Búsqueda de referencias en archivos e historial; reemplazo de términos genéricos que delataban el contexto del proyecto.
  - Auditoría de los comentarios que explican decisiones y cálculo del contraste WCAG de las combinaciones de color principales.
- **Mi aportación:** verificación en limpio siguiendo el README paso a paso (instalación con lockfile congelado, build, pruebas unitarias, de API y E2E), revisión de navegación con teclado y revisión de la redacción del README.
- **Ajuste conforme al avance del desarrollo:**
  - Dos insignias en ámbar no cumplían el contraste AA para texto pequeño (2.72:1 y 3.94:1); se oscurecieron a 5.80:1.
  - El README documenta la variable de caída total con la sintaxis de bash y de PowerShell, además del archivo `.env`.
  - No se reescribió el historial de Git: solo contenía términos genéricos, sin referencias a la empresa.
- **Validación:** `typecheck`, `lint`, `test` y `test:e2e` en verde tras una instalación en limpio con `pnpm install --frozen-lockfile`; `pnpm build` sin errores; navegación con teclado revisada en las tres pantallas.
