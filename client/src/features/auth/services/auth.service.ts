import type { LoginData, RegisterData } from '@snailbet/shared'
import { bytesToBase64 } from '../../../lib/encoding'
import { loginAttemptsRepository } from '../repositories/login-attempts.repository'
import { sessionRepository } from '../repositories/session.repository'
import { userRepository } from '../repositories/user.repository'
import type { AuthUser, StoredUser } from '../types'
import { hashPassword, PBKDF2_ITERATIONS, verifyPassword } from './password.service'

export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000
export const MAX_FAILED_ATTEMPTS = 5
export const LOCK_DURATION_MS = 60 * 1000

export type AuthError =
  | { code: 'email_taken' }
  | { code: 'invalid_credentials' }
  | { code: 'locked'; lockedUntil: Date }
  | { code: 'storage_unavailable' }

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: AuthError }

export type AuthServiceDeps = {
  now: () => Date
  /** Iteraciones de PBKDF2; las pruebas usan pocas para ser rápidas. */
  passwordIterations: number
}

const defaultDeps: AuthServiceDeps = {
  now: () => new Date(),
  passwordIterations: PBKDF2_ITERATIONS,
}

/**
 * Lo que la interfaz puede conocer del usuario. Se copian los campos permitidos uno por uno
 * (lista blanca): si en el futuro se agrega un dato sensible al usuario guardado,
 * no llega a la interfaz por accidente.
 */
function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    balanceCents: user.balanceCents,
    createdAt: user.createdAt,
  }
}

function createSessionToken(): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(32)))
}

/**
 * Registro, inicio y cierre de sesión simulados con localStorage.
 * Los errores esperados (correo repetido, credenciales incorrectas, bloqueo) se devuelven
 * como resultado en lugar de lanzarse, para que la interfaz los maneje con un `switch`.
 */
export function createAuthService(deps: AuthServiceDeps = defaultDeps) {
  function startSession(user: StoredUser): void {
    sessionRepository.save({
      userId: user.id,
      token: createSessionToken(),
      expiresAt: new Date(deps.now().getTime() + SESSION_DURATION_MS).toISOString(),
    })
  }

  function failedAttempt(email: string): AuthResult {
    const attempts = loginAttemptsRepository.get(email)
    const failures = attempts.failures + 1

    if (failures >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(deps.now().getTime() + LOCK_DURATION_MS)
      loginAttemptsRepository.save(email, { failures: 0, lockedUntil: lockedUntil.toISOString() })
      return { ok: false, error: { code: 'locked', lockedUntil } }
    }

    loginAttemptsRepository.save(email, { failures, lockedUntil: null })
    return { ok: false, error: { code: 'invalid_credentials' } }
  }

  return {
    async register(data: RegisterData): Promise<AuthResult> {
      if (userRepository.findByEmail(data.email)) {
        return { ok: false, error: { code: 'email_taken' } }
      }

      const user: StoredUser = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        password: await hashPassword(data.password, deps.passwordIterations),
        balanceCents: 0,
        createdAt: deps.now().toISOString(),
      }

      try {
        userRepository.save(user)
        startSession(user)
      } catch {
        return { ok: false, error: { code: 'storage_unavailable' } }
      }
      return { ok: true, user: toAuthUser(user) }
    },

    async login(data: LoginData): Promise<AuthResult> {
      const { lockedUntil } = loginAttemptsRepository.get(data.email)
      if (lockedUntil && new Date(lockedUntil) > deps.now()) {
        return { ok: false, error: { code: 'locked', lockedUntil: new Date(lockedUntil) } }
      }

      const user = userRepository.findByEmail(data.email)
      if (!user) {
        // Se calcula un hash aunque el correo no exista para que la respuesta tarde lo mismo:
        // así no se puede averiguar qué correos están registrados midiendo el tiempo.
        await hashPassword(data.password, deps.passwordIterations)
        return failedAttempt(data.email)
      }

      if (!(await verifyPassword(data.password, user.password))) {
        return failedAttempt(data.email)
      }

      try {
        loginAttemptsRepository.clear(data.email)
        startSession(user)
      } catch {
        return { ok: false, error: { code: 'storage_unavailable' } }
      }
      return { ok: true, user: toAuthUser(user) }
    },

    logout(): void {
      sessionRepository.clear()
    },

    /** Recupera la sesión al recargar la página; descarta la que expiró o es de un usuario inexistente. */
    restoreSession(): AuthUser | null {
      const session = sessionRepository.get()
      if (!session) {
        return null
      }

      const user = userRepository.findById(session.userId)
      if (!user || new Date(session.expiresAt) <= deps.now()) {
        sessionRepository.clear()
        return null
      }
      return toAuthUser(user)
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>
