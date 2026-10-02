/** Resultado de derivar una contraseña. Nunca se guarda la contraseña, solo esto. */
export type PasswordHash = {
  algorithm: 'PBKDF2-SHA256'
  /** Se guarda para poder subir las iteraciones en el futuro sin invalidar contraseñas existentes. */
  iterations: number
  /** Sal aleatoria en base64. */
  salt: string
  /** Hash derivado en base64. */
  hash: string
}

/** Usuario tal como se guarda en localStorage. */
export type StoredUser = {
  id: string
  name: string
  email: string
  password: PasswordHash
  /** Saldo en centavos enteros (ver lib/money.ts). */
  balanceCents: number
  createdAt: string
}

/** Lo que la interfaz conoce del usuario: nunca incluye el hash de la contraseña. */
export type AuthUser = Omit<StoredUser, 'password'>

export type Session = {
  userId: string
  /** Valor aleatorio que identifica la sesión. */
  token: string
  expiresAt: string
}

/**
 * Estado de la sesión como unión discriminada: cada estado solo tiene los datos que le
 * corresponden (no existe un "autenticado sin usuario" ni un "anónimo con usuario").
 */
export type AuthState =
  { status: 'loading' } | { status: 'anonymous' } | { status: 'authenticated'; user: AuthUser }

/** Eventos que cambian el estado de la sesión. */
export type AuthAction =
  | { type: 'session_restored'; user: AuthUser }
  | { type: 'session_not_found' }
  | { type: 'logged_in'; user: AuthUser }
  | { type: 'logged_out' }
  | { type: 'balance_updated'; balanceCents: number }
