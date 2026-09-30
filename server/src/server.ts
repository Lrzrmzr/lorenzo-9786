import { existsSync } from 'node:fs'
import { createApp } from './app'
import { systemClock } from './config/clock'
import { loadConfig, type Config } from './config/env'
import { consoleLogger } from './lib/logger'
import { InMemoryIdempotencyStore } from './repositories/idempotency.store'

const logger = consoleLogger

// Carga `.env` si existe. No sobrescribe variables ya definidas por la plataforma de despliegue.
if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

function loadConfigOrExit(): Config {
  try {
    return loadConfig(process.env)
  } catch (error) {
    logger.error('invalid_config', {
      message: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  }
}

const config = loadConfigOrExit()
const app = createApp({
  config,
  clock: systemClock,
  logger,
  idempotencyStore: new InMemoryIdempotencyStore(systemClock),
})

const server = app.listen(config.port, (error) => {
  if (error) {
    logger.error('server_start_failed', { message: error.message })
    process.exit(1)
  }
  logger.info('server_started', { port: config.port, env: config.nodeEnv })
})

// Cierre ordenado: deja terminar las peticiones en curso antes de salir.
// Las plataformas de despliegue envían SIGTERM al reiniciar o redesplegar.
function shutdown(signal: NodeJS.Signals): void {
  logger.info('server_stopping', { signal })
  server.close(() => process.exit(0))
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
