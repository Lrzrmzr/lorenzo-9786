import type { RequestHandler } from 'express'
import type { Logger } from '../lib/logger'

/**
 * Registra método, ruta, código de respuesta y duración de cada petición.
 * Nunca registra el cuerpo: así los datos de tarjeta y el CVV no pueden terminar en los logs.
 */
export function requestLogger(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const startedAt = performance.now()

    res.on('finish', () => {
      logger.info('http_request', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Math.round(performance.now() - startedAt),
      })
    })

    next()
  }
}
