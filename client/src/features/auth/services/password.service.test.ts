// @vitest-environment node
// Node trae Web Crypto completo (crypto.subtle); el entorno jsdom no lo incluye.
import { describe, expect, it } from 'vitest'
import { base64ToBytes } from '../../../lib/encoding'
import { hashPassword, PBKDF2_ITERATIONS, verifyPassword } from './password.service'

/** Pocas iteraciones para que las pruebas sean rápidas; el valor real se prueba aparte. */
const FAST_ITERATIONS = 1_000
const PASSWORD = 'Caracol-Veloz7'

describe('hashPassword', () => {
  it('usa por defecto al menos 600,000 iteraciones (recomendación de OWASP para PBKDF2-SHA256)', () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600_000)
  })

  it('aplica las iteraciones por defecto cuando no se indican', async () => {
    const result = await hashPassword(PASSWORD)
    expect(result.iterations).toBe(PBKDF2_ITERATIONS)
  }, 10_000)

  it('devuelve el algoritmo, las iteraciones, una sal de 16 bytes y un hash de 32 bytes', async () => {
    const result = await hashPassword(PASSWORD, FAST_ITERATIONS)

    expect(result.algorithm).toBe('PBKDF2-SHA256')
    expect(result.iterations).toBe(FAST_ITERATIONS)
    expect(base64ToBytes(result.salt)).toHaveLength(16)
    expect(base64ToBytes(result.hash)).toHaveLength(32)
  })

  it('nunca incluye la contraseña en el resultado', async () => {
    const result = await hashPassword(PASSWORD, FAST_ITERATIONS)

    expect(JSON.stringify(result)).not.toContain(PASSWORD)
  })

  it('genera una sal distinta cada vez, así que la misma contraseña produce hashes distintos', async () => {
    const first = await hashPassword(PASSWORD, FAST_ITERATIONS)
    const second = await hashPassword(PASSWORD, FAST_ITERATIONS)

    expect(first.salt).not.toBe(second.salt)
    expect(first.hash).not.toBe(second.hash)
  })
})

describe('verifyPassword', () => {
  it('acepta la contraseña correcta', async () => {
    const stored = await hashPassword(PASSWORD, FAST_ITERATIONS)

    expect(await verifyPassword(PASSWORD, stored)).toBe(true)
  })

  it.each([
    ['otra contraseña', 'Caracol-Lento7'],
    ['distinta en mayúsculas', 'caracol-veloz7'],
    ['con un espacio extra', ` ${PASSWORD}`],
    ['vacía', ''],
  ])('rechaza una contraseña %s', async (_case, attempt) => {
    const stored = await hashPassword(PASSWORD, FAST_ITERATIONS)

    expect(await verifyPassword(attempt, stored)).toBe(false)
  })

  it('funciona con acentos y ñ', async () => {
    const stored = await hashPassword('Contraseña-Añeja9', FAST_ITERATIONS)

    expect(await verifyPassword('Contraseña-Añeja9', stored)).toBe(true)
    expect(await verifyPassword('Contrasena-Aneja9', stored)).toBe(false)
  })

  // Si se verificara con PBKDF2_ITERATIONS en lugar de las guardadas, el hash no coincidiría.
  it('verifica con las iteraciones guardadas, no con las actuales', async () => {
    const stored = await hashPassword(PASSWORD, FAST_ITERATIONS)

    expect(stored.iterations).not.toBe(PBKDF2_ITERATIONS)
    expect(await verifyPassword(PASSWORD, stored)).toBe(true)
  })

  it('rechaza un hash con un algoritmo desconocido', async () => {
    const stored = await hashPassword(PASSWORD, FAST_ITERATIONS)
    const tampered = { ...stored, algorithm: 'MD5' } as unknown as typeof stored

    expect(await verifyPassword(PASSWORD, tampered)).toBe(false)
  })
})
