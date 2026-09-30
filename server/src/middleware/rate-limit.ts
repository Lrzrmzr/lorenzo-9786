import type { RequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import type { ApiErrorBody } from './error-handler'

const ONE_MINUTE_MS = 60_000

/**
 * Limita los cobros por IP. Protege contra abusos (probar tarjetas en masa)
 * y contra un cliente con un error que reintente en bucle.
 */
export function createPaymentRateLimiter(limitPerMinute: number): RequestHandler {
  return rateLimit({
    windowMs: ONE_MINUTE_MS,
    limit: limitPerMinute,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      const body: ApiErrorBody = {
        error: {
          code: 'too_many_requests',
          message: 'Demasiadas solicitudes de cobro; intenta de nuevo en un minuto',
        },
      }
      res.status(429).json(body)
    },
  })
}
