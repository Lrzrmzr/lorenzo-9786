import type { LoginData, RegisterData } from '@snailbet/shared'
import { createContext } from 'react'
import type { AuthResult } from '../services/auth.service'
import type { AuthState } from '../types'

export type AuthContextValue = {
  state: AuthState
  register: (data: RegisterData) => Promise<AuthResult>
  login: (data: LoginData) => Promise<AuthResult>
  logout: () => void
}

/** `null` por defecto: usarlo fuera de AuthProvider es un error que useAuth detecta. */
export const AuthContext = createContext<AuthContextValue | null>(null)
