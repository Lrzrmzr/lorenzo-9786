import type { Snail } from '@snailbet/shared'
import { describe, expect, it } from 'vitest'
import { findFavorite, toBetsChartData, toSnailWinsData, type SnailWinsDatum } from './race-stats'

const SNAILS: Snail[] = [
  { id: 'turbo-baba', name: 'Turbo Baba', color: '#E69F00' },
  { id: 'dona-concha', name: 'Doña Concha', color: '#56B4E9' },
  { id: 'rayo-espiral', name: 'Rayo Espiral', color: '#009E73' },
]

function datum(snail: string, wins: number): SnailWinsDatum {
  return { snail, wins, color: '#000000' }
}

describe('toBetsChartData', () => {
  it('computes percentages for the design example (4 won of 15)', () => {
    const data = toBetsChartData({ won: 4, lost: 11, total: 15 })

    expect(data.wonPercent).toBe(27)
    expect(data.lostPercent).toBe(73)
    expect(data.segments).toEqual([
      { name: 'Ganadas', value: 4, color: 'green.6' },
      { name: 'Perdidas', value: 11, color: 'red.6' },
    ])
  })

  it('keeps percentages adding up to 100 when both would round up', () => {
    // 1/8 = 12.5 % y 7/8 = 87.5 %: redondeados por separado sumarían 101.
    const data = toBetsChartData({ won: 1, lost: 7, total: 8 })

    expect(data.wonPercent + data.lostPercent).toBe(100)
  })

  it('returns zero percentages when there were no bets', () => {
    const data = toBetsChartData({ won: 0, lost: 0, total: 0 })

    expect(data.wonPercent).toBe(0)
    expect(data.lostPercent).toBe(0)
  })
})

describe('toSnailWinsData', () => {
  it('returns one bar per snail in catalog order with its fixed color', () => {
    const data = toSnailWinsData(SNAILS, [
      { snail_id: 'rayo-espiral', wins: 3 },
      { snail_id: 'turbo-baba', wins: 1 },
      { snail_id: 'dona-concha', wins: 2 },
    ])

    expect(data).toEqual([
      { snail: 'Turbo Baba', wins: 1, color: '#E69F00' },
      { snail: 'Doña Concha', wins: 2, color: '#56B4E9' },
      { snail: 'Rayo Espiral', wins: 3, color: '#009E73' },
    ])
  })

  it('uses 0 for snails without an entry and ignores unknown snails', () => {
    const data = toSnailWinsData(SNAILS, [
      { snail_id: 'rayo-espiral', wins: 2 },
      { snail_id: 'unknown', wins: 4 },
    ])

    expect(data.map((d) => d.wins)).toEqual([0, 0, 2])
  })
})

describe('findFavorite', () => {
  it('returns the snail with the most wins', () => {
    const favorite = findFavorite([datum('A', 1), datum('B', 3), datum('C', 2)])

    expect(favorite?.snail).toBe('B')
  })

  it('returns null when there is a tie for first place', () => {
    expect(findFavorite([datum('A', 2), datum('B', 2), datum('C', 1)])).toBeNull()
  })

  it('returns null when nobody won or there is no data', () => {
    expect(findFavorite([datum('A', 0), datum('B', 0)])).toBeNull()
    expect(findFavorite([])).toBeNull()
  })
})
