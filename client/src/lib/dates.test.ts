import { describe, expect, it } from 'vitest'
import { formatDayMonth, formatLongDate } from './dates'

describe('formatLongDate', () => {
  it('formats weekday, day, month and year without comma and capitalized', () => {
    // Mes 9 = octubre (los meses de Date empiezan en 0); hora local a mediodía.
    expect(formatLongDate(new Date(2026, 9, 2, 12))).toBe('Viernes 2 de octubre de 2026')
  })

  it('handles the first day of the year', () => {
    expect(formatLongDate(new Date(2027, 0, 1, 12))).toBe('Viernes 1 de enero de 2027')
  })
})

describe('formatDayMonth', () => {
  it('formats an ISO day as day and month', () => {
    expect(formatDayMonth('2026-09-30')).toBe('30 de septiembre')
  })

  it('does not shift the day across time zones', () => {
    expect(formatDayMonth('2026-01-01')).toBe('1 de enero')
    expect(formatDayMonth('2026-12-31')).toBe('31 de diciembre')
  })

  it('rejects malformed dates', () => {
    expect(() => formatDayMonth('30/09/2026')).toThrow(RangeError)
    expect(() => formatDayMonth('')).toThrow(RangeError)
  })
})
