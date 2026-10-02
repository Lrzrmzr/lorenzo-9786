import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../context/auth-context'

/** Acceso a la sesión desde cualquier componente dentro de AuthProvider. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
