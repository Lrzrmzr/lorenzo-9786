import type { LoginData, RegisterData } from '@snailbet/shared'
import { useCallback, useMemo, useReducer, type ReactNode } from 'react'
import { createAuthService, type AuthService } from '../services/auth.service'
import { AuthContext, type AuthContextValue } from './auth-context'
import { authReducer, initialAuthState } from './auth-reducer'

const defaultAuthService = createAuthService()

type AuthProviderProps = {
  children: ReactNode
  /** Inyectable para pruebas; en la app se usa el servicio real. */
  service?: AuthService
}

/**
 * Patrón Provider + Reducer: guarda el estado de la sesión y lo comparte con toda la app.
 * Los componentes lo leen con `useAuth()` en lugar de recibirlo prop por prop.
 */
export function AuthProvider({ children, service = defaultAuthService }: AuthProviderProps) {
  // El tercer argumento inicializa el estado una sola vez, leyendo la sesión guardada
  // antes del primer render: al recargar la página no hay un parpadeo de "sin sesión".
  const [state, dispatch] = useReducer(authReducer, service, (authService) => {
    const user = authService.restoreSession()
    return authReducer(
      initialAuthState,
      user ? { type: 'session_restored', user } : { type: 'session_not_found' },
    )
  })

  const register = useCallback(
    async (data: RegisterData) => {
      const result = await service.register(data)
      if (result.ok) dispatch({ type: 'logged_in', user: result.user })
      return result
    },
    [service],
  )

  const login = useCallback(
    async (data: LoginData) => {
      const result = await service.login(data)
      if (result.ok) dispatch({ type: 'logged_in', user: result.user })
      return result
    },
    [service],
  )

  const logout = useCallback(() => {
    service.logout()
    dispatch({ type: 'logged_out' })
  }, [service])

  const updateBalance = useCallback((balanceCents: number) => {
    dispatch({ type: 'balance_updated', balanceCents })
  }, [])

  // useMemo evita crear un objeto nuevo en cada render, lo que haría
  // volver a renderizar a todos los componentes que usan el contexto.
  const value = useMemo<AuthContextValue>(
    () => ({ state, register, login, logout, updateBalance }),
    [state, register, login, logout, updateBalance],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
