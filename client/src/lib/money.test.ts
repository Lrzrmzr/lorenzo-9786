import { describe, expect, it } from 'vitest'
import { formatMoney, fromCents, toCents } from './money'

describe('toCents', () => {
  it.each([
    [250, 25_000],
    [0.01, 1],
    [10.1, 1_010],
    [1_250.5, 125_050],
  ])('convierte %s pesos en %s centavos', (amount, cents) => {
    expect(toCents(amount)).toBe(cents)
  })

  it('corrige el error de punto flotante al sumar decimales', () => {
    expect(toCents(0.1 + 0.2)).toBe(30)
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY])('rechaza %s', (amount) => {
    expect(() => toCents(amount)).toThrow(RangeError)
  })
})

describe('fromCents', () => {
  it('convierte centavos en pesos', () => {
    expect(fromCents(125_050)).toBe(1_250.5)
  })
})

describe('formatMoney', () => {
  it.each([
    [0, '$0.00'],
    [1, '$0.01'],
    [125_000, '$1,250.00'],
    [5_000_000, '$50,000.00'],
  ])('formatea %s centavos como "%s"', (cents, expected) => {
    expect(formatMoney(cents)).toBe(expected)
  })

  it('suma saldos en centavos sin errores de redondeo', () => {
    const balance = toCents(0.1) + toCents(0.2)
    expect(formatMoney(balance)).toBe('$0.30')
  })
})
