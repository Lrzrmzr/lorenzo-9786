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