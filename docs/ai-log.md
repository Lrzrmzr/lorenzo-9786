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
- **Mi aportación:** revisión de las reglas de congruencia contra el enunciado, verificación manual de la respuesta del endpoint (victorias por caracol, resultado de cada apuesta contra el ganador de su carrera y totales) y revisión del comportamiento de fechas en UTC.
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
- **Validación:** `typecheck` y `test` en verde; flujo mínimo del enunciado en el navegador (registro, saldo inicial de $0, persistencia al recargar, cierre de sesión, redirección sin sesión e inicio de sesión de nuevo); bloqueo tras 5 intentos fallidos; correo duplicado; revisión en localStorage de que solo se guarda el hash; prueba de mutación en la expiración de la sesión, que hizo fallar la prueba de las 24 horas.

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