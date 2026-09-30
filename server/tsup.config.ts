import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // `@snailbet/shared` exporta TypeScript sin compilar, así que debe incluirse en el bundle.
  // El resto de dependencias se quedan como imports normales de node_modules.
  noExternal: ['@snailbet/shared'],
})
