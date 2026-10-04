import type { LoginData, RegisterData } from '@snailbet/shared'
import { createContext } from 'react'
import type { AuthResult } from '../services/auth.service'
import type { AuthState } from '../types'

export type AuthContextValue = {
  state: AuthState
  register: (data: RegisterData) => Promise<AuthResult>
  login: (data: LoginData) => Promise<AuthResult>
  logout: () => void
  /** Refleja en la interfaz un saldo que ya se guardó (p. ej. tras una recarga aprobada). */
  updateBalance: (balanceCents: number) => void
}

/** `null` por defecto: usarlo fuera de AuthProvider es un error que useAuth detecta. */
export const AuthContext = createContext<AuthContextValue | null>(null)
