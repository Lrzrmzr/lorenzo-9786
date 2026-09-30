# Bitácora de uso de IA

## -Preparación y monorepo
- **Herramienta:** Claude Code
- **Uso:** Se hizo la revisión del plan; borrador del README; generación de los archivos de configuración del monorepo (package.json, pnpm-workspace.yaml, tsconfig, .gitignore, .gitattributes, .editorconfig, Prettier).
- **Mi aportación:** ejecución de comandos, scaffolding con Vite, decisiones de nombres y revisión de cada archivo.
- **Validación:** `pnpm typecheck` sin errores y la app de Vite levantada en localhost:5173.

## -Paquete compartido
- **Herramienta:** Claude Code
- **Uso:** escritura de esquemas Zod, tipos del contrato, constantes y pruebas unitarias a partir de las reglas definidas en el plan.
- **Mi aportación:** definición de las reglas de validación, revisión del código, ejecución de pruebas y verificación rompiendo reglas a propósito.
- **Validación:** `typecheck` y `test` en verde; prueba de mutación manual cambiando la longitud mínima de contraseña.
