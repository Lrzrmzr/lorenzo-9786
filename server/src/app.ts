import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import type { Clock } from './config/clock'
import type { Config } from './config/env'
import type { Logger } from './lib/logger'
import { errorHandler } from './middleware/error-handler'
import { notFoundHandler } from './middleware/not-found'
import { requestLogger } from './middleware/request-logger'
import { createHealthRouter } from './routes/health.routes'

/** Todo lo que la app necesita del exterior. Las pruebas pasan versiones controladas. */
export type AppDependencies = {
  config: Config
  clock: Clock
  logger: Logger
}

/**
 * Construye la aplicación sin abrir ningún puerto; `server.ts` se encarga de `listen()`.
 * Así las pruebas pueden usar la app en memoria con un reloj fijo y un logger silencioso.
 *
 * El orden de los middlewares importa: cada petición los recorre de arriba hacia abajo.
 */
export function createApp({ config, clock, logger }: AppDependencies): Express {
  const app = express()

  // 1. Encabezados de seguridad (y oculta `X-Powered-By: Express`).
  app.use(helmet())
  // 2. Solo los orígenes configurados pueden llamar al API desde un navegador.
  app.use(cors({ origin: config.clientOrigins }))
  // 3. Antes del parser de JSON, para registrar también las peticiones con cuerpo inválido.
  app.use(requestLogger(logger))
  // 4. Límite pequeño: ninguna petición legítima de este API se acerca a 10 KB.
  app.use(express.json({ limit: '10kb' }))

  // 5. Rutas.
  app.use('/api/health', createHealthRouter(clock))

  // 6. Nada coincidió: 404 en JSON.
  app.use(notFoundHandler)
  // 7. Errores de cualquier paso anterior.
  app.use(errorHandler(logger))

  return app
}
