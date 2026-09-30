import type { RequestHandler } from 'express'
import type { ApiErrorBody } from './error-handler'

/** Responde JSON en lugar del HTML por defecto de Express para rutas inexistentes. */
export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ApiErrorBody = {
    error: { code: 'not_found', message: `Ruta no encontrada: ${req.method} ${req.path}` },
  }
  res.status(404).json(body)
}
