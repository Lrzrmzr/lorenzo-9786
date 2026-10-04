import { describe, expect, it } from 'vitest'
import { digitsOnly, formatCardNumber, formatExpiration, maskCardNumber } from './card-format'

describe('digitsOnly', () => {
  it('removes non-digits and truncates', () => {
    expect(digitsOnly('5a4-3 2', 3)).toBe('543')
  })
})

describe('formatCardNumber', () => {
  it('groups digits in blocks of 4', () => {
    expect(formatCardNumber('1234123412341234')).toBe('1234 1234 1234 1234')
  })

  it('formats partial input without a trailing space', () => {
    expect(formatCardNumber('12341')).toBe('1234 1')
    expect(formatCardNumber('1234')).toBe('1234')
  })

  it('ignores letters and stops at 16 digits', () => {
    expect(formatCardNumber('1234-abcd-1234 1234 1234 9999')).toBe('1234 1234 1234 1234')
  })
})

describe('formatExpiration', () => {
  it('adds the slash after the month', () => {
    expect(formatExpiration('1226')).toBe('12/26')
    expect(formatExpiration('122')).toBe('12/2')
  })

  it('leaves the month alone until the year starts', () => {
    expect(formatExpiration('1')).toBe('1')
    expect(formatExpiration('12')).toBe('12')
  })

  it('keeps an already formatted date and stops at 4 digits', () => {
    expect(formatExpiration('12/26')).toBe('12/26')
    expect(formatExpiration('12/2699')).toBe('12/26')
  })
})

describe('maskCardNumber', () => {
  it('shows only the last 4 digits', () => {
    expect(maskCardNumber('1234123412341234')).toBe('•••• 1234')
    expect(maskCardNumber('4000 0000 0000 0002')).toBe('•••• 0002')
  })
})
