import type { RequestHandler } from 'express'
import type { Clock } from '../config/clock'
import { generateDailyRaceSummary, getSummaryDate } from '../services/races/races.service'

/** Los datos de un día no cambian, así que el navegador puede reutilizarlos unos minutos. */
const CACHE_CONTROL = 'public, max-age=300'

/** GET /api/races/daily-summary */
export function createDailySummaryController(clock: Clock): RequestHandler {
  return (_req, res) => {
    const summary = generateDailyRaceSummary(getSummaryDate(clock.now()))
    res.set('Cache-Control', CACHE_CONTROL).json(summary)
  }
}
