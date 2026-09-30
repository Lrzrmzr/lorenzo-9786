import { Router } from 'express'
import type { Clock } from '../config/clock'

/** Permite comprobar que el servidor responde (útil también para la plataforma de despliegue). */
export function createHealthRouter(clock: Clock): Router {
  const router = Router()

  router.get('/', (_req, res) => {
    res.json({ status: 'ok', timestamp: clock.now().toISOString() })
  })

  return router
}
