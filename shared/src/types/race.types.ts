export type Snail = {
  id: string
  name: string
  /** Color hexadecimal; se reutiliza en la gráfica y en la leyenda. */
  color: string
}

export type Race = {
  id: string
  /** Número de carrera dentro del día, del 1 al 6. */
  race_number: number
  /** Hora programada en ISO 8601. */
  scheduled_at: string
  winner_id: string
}

export type BetResult = 'won' | 'lost'

/** Apuesta simulada: se gana solo si el caracol elegido ganó esa carrera. */
export type Bet = {
  id: string
  race_id: string
  snail_id: string
  result: BetResult
}

export type SnailWins = {
  snail_id: string
  wins: number
}

export type BetsSummary = {
  won: number
  lost: number
  total: number
}

/** Datos simulados de un día completo; es lo que devuelve la ruta de carreras. */
export type DailyRaceSummary = {
  /** Día simulado en formato AAAA-MM-DD. */
  date: string
  snails: Snail[]
  races: Race[]
  bets: Bet[]
  wins_by_snail: SnailWins[]
  bets_summary: BetsSummary
}
