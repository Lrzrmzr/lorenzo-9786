import type { ErrorRequestHandler } from 'express'
import type { Logger } from '../lib/logger'

/** Forma de los errores generales del API (fuera del contrato de la pasarela). */
export type ApiErrorBody = {
  error: {
    code: string
    message: string
  }
}

/** Errores que lanza `express.json()` traen un `type` que identifica el problema. */
function hasBodyParserType(error: unknown, type: string): boolean {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === type
}

/**
 * Manejador de errores central; debe registrarse al final de la cadena de middlewares.
 * Traduce errores conocidos a respuestas claras y, para los inesperados, responde un mensaje
 * genérico: el detalle (mensaje y stack) solo va al log, nunca al cliente, porque puede
 * revelar rutas internas, versiones o datos.
 */
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, _req, res, next) => {
    // Si la respuesta ya empezó a enviarse no se puede cambiar; Express cierra la conexión.
    if (res.headersSent) {
      next(error)
      return
    }

    if (hasBodyParserType(error, 'entity.parse.failed')) {
      const body: ApiErrorBody = {
        error: { code: 'invalid_json', message: 'El cuerpo de la petición no es JSON válido' },
      }
      res.status(400).json(body)
      return
    }

    if (hasBodyParserType(error, 'entity.too.large')) {
      const body: ApiErrorBody = {
        error: { code: 'payload_too_large', message: 'El cuerpo de la petición es demasiado grande' },
      }
      res.status(413).json(body)
      return
    }

    logger.error('unhandled_error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    const body: ApiErrorBody = {
      error: { code: 'internal_error', message: 'Ocurrió un error inesperado' },
    }
    res.status(500).json(body)
  }
}
