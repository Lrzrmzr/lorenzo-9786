type LogContext = Record<string, unknown>

/**
 * Logger mínimo e inyectable. Escribe una línea JSON por evento (logs estructurados),
 * que es el formato que leen las plataformas de despliegue y agregadores de logs.
 */
export interface Logger {
  info(event: string, context?: LogContext): void
  error(event: string, context?: LogContext): void
}

function formatEntry(level: 'info' | 'error', event: string, context: LogContext = {}): string {
  return JSON.stringify({ level, time: new Date().toISOString(), event, ...context })
}

export const consoleLogger: Logger = {
  info: (event, context) => console.info(formatEntry('info', event, context)),
  error: (event, context) => console.error(formatEntry('error', event, context)),
}

/** Logger que descarta todo; evita ruido en la salida de las pruebas. */
export const silentLogger: Logger = {
  info: () => {},
  error: () => {},
}
