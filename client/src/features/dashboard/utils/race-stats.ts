import type { BetsSummary, Snail, SnailWins } from '@snailbet/shared'

/*
 * Transforma la respuesta del API al formato que esperan las gráficas.
 * Son funciones puras: los componentes solo pintan lo que reciben.
 */

export type BetsChartData = {
  won: number
  lost: number
  total: number
  /** Porcentajes enteros; siempre suman 100 (o 0 si no hubo apuestas). */
  wonPercent: number
  lostPercent: number
  /** Segmentos de la dona; los colores son del tema (verde hoja y terracota). */
  segments: { name: string; value: number; color: string }[]
}

export function toBetsChartData({ won, lost, total }: BetsSummary): BetsChartData {
  const wonPercent = total > 0 ? Math.round((won / total) * 100) : 0
  // Se calcula por diferencia: redondear ambos por separado podría sumar 99 o 101.
  const lostPercent = total > 0 ? 100 - wonPercent : 0

  return {
    won,
    lost,
    total,
    wonPercent,
    lostPercent,
    segments: [
      { name: 'Ganadas', value: won, color: 'green.6' },
      { name: 'Perdidas', value: lost, color: 'red.6' },
    ],
  }
}

export type SnailWinsDatum = {
  snail: string
  wins: number
  /** Color fijo del caracol; BarChart lo usa para pintar su barra. */
  color: string
}

/** Una barra por caracol, en el orden del catálogo, para que cada uno conserve su lugar. */
export function toSnailWinsData(
  snails: readonly Snail[],
  winsBySnail: readonly SnailWins[],
): SnailWinsDatum[] {
  const winsById = new Map(winsBySnail.map(({ snail_id, wins }) => [snail_id, wins]))
  return snails.map((snail) => ({
    snail: snail.name,
    wins: winsById.get(snail.id) ?? 0,
    color: snail.color,
  }))
}

/**
 * Caracol con más victorias. Devuelve `null` si nadie ganó o si hay empate en el
 * primer lugar: destacar a uno solo en un empate sería engañoso.
 */
export function findFavorite(data: readonly SnailWinsDatum[]): SnailWinsDatum | null {
  const maxWins = Math.max(0, ...data.map((datum) => datum.wins))
  if (maxWins === 0) {
    return null
  }
  const leaders = data.filter((datum) => datum.wins === maxWins)
  return leaders.length === 1 ? (leaders[0] ?? null) : null
}
