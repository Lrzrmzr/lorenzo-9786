import { describe, expect, it } from 'vitest'
import { generateDailyRaceSummary, getSummaryDate } from './races.service'
import { SNAILS } from './snails'

/** Treinta días seguidos: las reglas de congruencia deben cumplirse con cualquier semilla. */
const DATES = Array.from({ length: 30 }, (_, index) =>
  new Date(Date.UTC(2026, 8, 1 + index)).toISOString().slice(0, 10),
)

describe('generateDailyRaceSummary: reglas de congruencia', () => {
  const summary = generateDailyRaceSummary('2026-09-29')

  it('tiene 6 caracoles con nombre y color', () => {
    expect(summary.snails).toHaveLength(6)
    for (const snail of summary.snails) {
      expect(snail.name).not.toBe('')
      expect(snail.color).toMatch(/^#[0-9A-F]{6}$/i)
    }
  })

  it('tiene 6 carreras numeradas del 1 al 6, todas en el día indicado', () => {
    expect(summary.races.map((race) => race.race_number)).toEqual([1, 2, 3, 4, 5, 6])
    for (const race of summary.races) {
      expect(race.scheduled_at.startsWith('2026-09-29T')).toBe(true)
    }
  })
})

describe.each(DATES)('generateDailyRaceSummary(%s): congruencia', (date) => {
  const summary = generateDailyRaceSummary(date)
  const snailIds = new Set(summary.snails.map((snail) => snail.id))
  const winnerByRace = new Map(summary.races.map((race) => [race.id, race.winner_id]))

  it('cada carrera tiene como ganador a uno de los 6 caracoles', () => {
    for (const race of summary.races) {
      expect(snailIds.has(race.winner_id)).toBe(true)
    }
  })

  it('las victorias por caracol suman exactamente 6 y coinciden con los ganadores', () => {
    const totalWins = summary.wins_by_snail.reduce((sum, entry) => sum + entry.wins, 0)
    expect(totalWins).toBe(6)

    for (const { snail_id, wins } of summary.wins_by_snail) {
      const racesWon = summary.races.filter((race) => race.winner_id === snail_id).length
      expect(wins).toBe(racesWon)
    }
  })

  it('cada apuesta se gana solo si su caracol ganó esa carrera', () => {
    for (const bet of summary.bets) {
      const winnerId = winnerByRace.get(bet.race_id)
      expect(winnerId).toBeDefined()
      expect(bet.result).toBe(bet.snail_id === winnerId ? 'won' : 'lost')
    }
  })

  it('el resumen de apuestas coincide con las apuestas generadas', () => {
    const won = summary.bets.filter((bet) => bet.result === 'won').length
    expect(summary.bets_summary).toEqual({
      won,
      lost: summary.bets.length - won,
      total: summary.bets.length,
    })
  })
})

describe('generateDailyRaceSummary: estabilidad', () => {
  it('devuelve los mismos datos para la misma fecha', () => {
    expect(generateDailyRaceSummary('2026-09-29')).toEqual(generateDailyRaceSummary('2026-09-29'))
  })

  it('devuelve datos distintos para otra fecha', () => {
    const first = generateDailyRaceSummary('2026-09-29')
    const second = generateDailyRaceSummary('2026-09-30')
    expect(first.races.map((race) => race.winner_id)).not.toEqual(
      second.races.map((race) => race.winner_id),
    )
  })

  it('usa el catálogo de caracoles por defecto', () => {
    expect(generateDailyRaceSummary('2026-09-29').snails).toEqual(SNAILS)
  })
})

describe('getSummaryDate', () => {
  it('devuelve el día anterior en UTC', () => {
    expect(getSummaryDate(new Date('2026-09-30T12:00:00Z'))).toBe('2026-09-29')
  })

  it('cruza correctamente el cambio de mes y de año', () => {
    expect(getSummaryDate(new Date('2026-03-01T00:30:00Z'))).toBe('2026-02-28')
    expect(getSummaryDate(new Date('2027-01-01T00:00:00Z'))).toBe('2026-12-31')
  })
})
