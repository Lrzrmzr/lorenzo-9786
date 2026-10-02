import { webcrypto } from 'node:crypto'

// jsdom simula el navegador pero no implementa `crypto.subtle`. En las pruebas se usa
// el de Node, que implementa el mismo estándar Web Crypto que los navegadores.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}
