import { describe, expect, it } from 'vitest'
import { evaluatePassword } from './password-strength'

describe('evaluatePassword', () => {
  it('no muestra nivel con la contraseña vacía', () => {
    expect(evaluatePassword('').level).toBe(0)
  })

  it.each([
    ['a', 1],
    ['abcdefgh', 1],
    ['Abcdefgh', 2],
    ['Abcdefg1', 3],
    ['Abcdefghij12', 4],
  ])('"%s" tiene nivel %i', (password, level) => {
    expect(evaluatePassword(password).level).toBe(level)
  })

  it('marca cada requisito cumplido', () => {
    const { requirements } = evaluatePassword('abc1')
    const met = Object.fromEntries(requirements.map((r) => [r.id, r.met]))

    expect(met).toEqual({ length: false, uppercase: false, lowercase: true, number: true })
  })
})
