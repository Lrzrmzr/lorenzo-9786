import { describe, expect, it } from 'vitest'
import { createSeededRandom, hashSeed, pickOne, randomInt } from './seeded-random'

function take(random: () => number, count: number): number[] {
  return Array.from({ length: count }, () => random())
}

describe('hashSeed', () => {
  it('devuelve el mismo número para el mismo texto', () => {
    expect(hashSeed('2026-09-29')).toBe(hashSeed('2026-09-29'))
  })

  it('devuelve números distintos para textos distintos', () => {
    expect(hashSeed('2026-09-29')).not.toBe(hashSeed('2026-09-30'))
  })
})

describe('createSeededRandom', () => {
  it('produce la misma secuencia con la misma semilla', () => {
    expect(take(createSeededRandom(42), 10)).toEqual(take(createSeededRandom(42), 10))
  })

  it('produce secuencias distintas con semillas distintas', () => {
    expect(take(createSeededRandom(42), 10)).not.toEqual(take(createSeededRandom(43), 10))
  })

  it('devuelve valores en el rango [0, 1)', () => {
    for (const value of take(createSeededRandom(7), 1_000)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('randomInt', () => {
  it('genera enteros entre los límites, incluyendo ambos', () => {
    const random = createSeededRandom(1)
    const values = new Set(Array.from({ length: 500 }, () => randomInt(random, 1, 4)))

    expect([...values].sort()).toEqual([1, 2, 3, 4])
  })
})

describe('pickOne', () => {
  it('elige un elemento de la lista', () => {
    const items = ['a', 'b', 'c']
    expect(items).toContain(pickOne(createSeededRandom(3), items))
  })

  it('lanza un error si la lista está vacía', () => {
    expect(() => pickOne(createSeededRandom(3), [])).toThrow()
  })
})
