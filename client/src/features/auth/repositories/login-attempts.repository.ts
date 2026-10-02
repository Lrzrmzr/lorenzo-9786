import { z } from 'zod'
import { readItem, writeItem } from '../../../lib/storage'

export type LoginAttempts = {
  failures: number
  /** Fecha ISO hasta la que el correo está bloqueado, o `null` si no lo está. */
  lockedUntil: string | null
}

const attemptsSchema = z.record(
  z.string(),
  z.object({
    failures: z.number().int().nonnegative(),
    lockedUntil: z.iso.datetime().nullable(),
  }),
)

function readAll(): Record<string, LoginAttempts> {
  return readItem('login-attempts', attemptsSchema) ?? {}
}

/** Intentos fallidos por correo. La política (cuántos, cuánto tiempo) vive en auth.service. */
export const loginAttemptsRepository = {
  get(email: string): LoginAttempts {
    return readAll()[email] ?? { failures: 0, lockedUntil: null }
  },

  save(email: string, attempts: LoginAttempts): void {
    writeItem('login-attempts', { ...readAll(), [email]: attempts })
  },

  clear(email: string): void {
    // readAll devuelve un objeto nuevo (recién leído del JSON), así que modificarlo es seguro.
    const all = readAll()
    delete all[email]
    writeItem('login-attempts', all)
  },
}
