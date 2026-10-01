import type { Bet, DailyRaceSummary, Race, Snail } from '@snailbet/shared'
import {
  createSeededRandom,
  hashSeed,
  pickOne,
  randomInt,
  type RandomSource,
} from './seeded-random'
import { SNAILS } from './snails'

/** Horas de inicio en UTC: de 10:00 a 15:00 en la hora del centro de México (UTC-6). */
const RACE_START_HOURS_UTC = [16, 17, 18, 19, 20, 21] as const
const MIN_BETS_PER_RACE = 1
const MAX_BETS_PER_RACE = 4

/**
 * Día que se muestra: el anterior a `now`, en UTC.
 * Se usa un día ya terminado para que las 6 carreras tengan ganador de forma congruente;
 * con el día en curso habría carreras futuras con resultado.
 */
export function getSummaryDate(now: Date): string {
  const previousDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
  )
  return previousDay.toISOString().slice(0, 10)
}

function generateRaces(date: string, snails: readonly Snail[], random: RandomSource): Race[] {
  return RACE_START_HOURS_UTC.map((hour, index) => {
    const raceNumber = index + 1
    return {
      id: `${date}-race-${raceNumber}`,
      race_number: raceNumber,
      scheduled_at: `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`,
      winner_id: pickOne(random, snails).id,
    }
  })
}

/** Cada apuesta elige un caracol; se gana solo si ese caracol ganó la carrera. */
function generateBets(races: Race[], snails: readonly Snail[], random: RandomSource): Bet[] {
  return races.flatMap((race) => {
    const betCount = randomInt(random, MIN_BETS_PER_RACE, MAX_BETS_PER_RACE)
    return Array.from({ length: betCount }, (_, index): Bet => {
      const snailId = pickOne(random, snails).id
      return {
        id: `${race.id}-bet-${index + 1}`,
        race_id: race.id,
        snail_id: snailId,
        result: snailId === race.winner_id ? 'won' : 'lost',
      }
    })
  })
}

/**
 * Genera los datos simulados de un día: 6 carreras con un ganador cada una y apuestas simuladas.
 *
 * No es un motor de carreras (no hay tiempos, posiciones ni apuestas del usuario):
 * solo produce datos de ejemplo congruentes para las gráficas del dashboard.
 * Los totales se calculan a partir de las carreras y apuestas generadas, nunca por separado,
 * para que no puedan contradecirse.
 *
 * @param date Día en formato AAAA-MM-DD; también es la semilla, así que el resultado es estable.
 */
export function generateDailyRaceSummary(
  date: string,
  snails: readonly Snail[] = SNAILS,
): DailyRaceSummary {
  const random = createSeededRandom(hashSeed(`races:${date}`))
  const races = generateRaces(date, snails, random)
  const bets = generateBets(races, snails, random)

  const won = bets.filter((bet) => bet.result === 'won').length

  return {
    date,
    snails: [...snails],
    races,
    bets,
    wins_by_snail: snails.map((snail) => ({
      snail_id: snail.id,
      wins: races.filter((race) => race.winner_id === snail.id).length,
    })),
    bets_summary: { won, lost: bets.length - won, total: bets.length },
  }
}
