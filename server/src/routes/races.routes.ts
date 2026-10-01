import { Router } from 'express'
import type { Clock } from '../config/clock'
import { createDailySummaryController } from '../controllers/races.controller'

export function createRacesRouter(clock: Clock): Router {
  const router = Router()

  router.get('/daily-summary', createDailySummaryController(clock))

  return router
}
