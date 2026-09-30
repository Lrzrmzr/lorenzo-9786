import { z } from 'zod'

const DEFAULT_CLIENT_ORIGIN = 'http://localhost:5173'

/**
 * Variables de entorno esperadas. Se validan al arrancar: si alguna es inválida
 * el servidor no inicia, en lugar de fallar más tarde con un error difícil de rastrear.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  /** Uno o varios orígenes separados por coma. */
  CLIENT_ORIGIN: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url()).min(1))
    .default([DEFAULT_CLIENT_ORIGIN]),
  /** Simula una caída total de la pasarela. */
  SNAILPAY_FORCE_OUTAGE: z.stringbool().default(false),
  /** Retraso que aplica la tarjeta de timeout; debe superar el timeout del cliente. */
  SNAILPAY_TIMEOUT_DELAY_MS: z.coerce.number().int().min(0).max(60_000).default(15_000),
})

export type Config = {
  nodeEnv: 'development' | 'test' | 'production'
  port: number
  clientOrigins: string[]
  snailpay: {
    forceOutage: boolean
    timeoutDelayMs: number
  }
}

/**
 * Lee y valida la configuración. Recibe las variables como parámetro
 * para poder probarla sin modificar `process.env`.
 *
 * @throws {Error} con el detalle de cada variable inválida.
 */
export function loadConfig(env: Record<string, string | undefined>): Config {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`)
  }

  const vars = result.data
  return {
    nodeEnv: vars.NODE_ENV,
    port: vars.PORT,
    clientOrigins: vars.CLIENT_ORIGIN,
    snailpay: {
      forceOutage: vars.SNAILPAY_FORCE_OUTAGE,
      timeoutDelayMs: vars.SNAILPAY_TIMEOUT_DELAY_MS,
    },
  }
}
