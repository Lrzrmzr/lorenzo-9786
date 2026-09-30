import { describe, expect, it } from 'vitest'
import { isCardExpired, parseExpiration } from './card-expiration'

describe('parseExpiration', () => {
  it('convierte MM/AA en mes y año completo', () => {
    expect(parseExpiration('12/26')).toEqual({ month: 12, year: 2026 })
    expect(parseExpiration('03/30')).toEqual({ month: 3, year: 2030 })
  })

  it.each(['13/26', '00/26', '1/26', '12-26', '1226', ''])('devuelve null para "%s"', (value) => {
    expect(parseExpiration(value)).toBeNull()
  })
})

describe('isCardExpired', () => {
  it('no está vencida antes del mes de vencimiento', () => {
    expect(isCardExpired('12/26', new Date('2026-09-29T12:00:00Z'))).toBe(false)
  })

  it('sigue vigente durante todo el mes de vencimiento', () => {
    expect(isCardExpired('12/26', new Date('2026-12-01T00:00:00Z'))).toBe(false)
    expect(isCardExpired('12/26', new Date('2026-12-31T23:59:59Z'))).toBe(false)
  })

  it('está vencida a partir del mes siguiente', () => {
    expect(isCardExpired('12/26', new Date('2027-01-01T00:00:00Z'))).toBe(true)
  })

  it('está vencida si el año ya pasó aunque el mes sea mayor', () => {
    expect(isCardExpired('12/25', new Date('2026-01-15T00:00:00Z'))).toBe(true)
  })

  it('lanza un error si recibe un formato inválido', () => {
    expect(() => isCardExpired('13/26', new Date())).toThrow(TypeError)
  })
})
