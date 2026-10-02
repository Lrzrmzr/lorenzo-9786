import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'

/**
 * Devuelve la ruta a la que se quería ir antes del login, solo si es interna.
 * `//dominio.com` empieza con `/` pero el navegador lo trata como otro sitio, por eso se descarta.
 */
function getRedirectPath(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    const { from } = state
    if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')) {
      return from
    }
  }
  return '/dashboard'
}

/**
 * Login y registro: con sesión activa no tiene sentido verlos, así que redirige.
 * También es lo que lleva al dashboard justo después de iniciar sesión o registrarse.
 */
export function PublicOnlyRoute() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'authenticated') {
    return <Navigate to={getRedirectPath(location.state)} replace />
  }

  return <Outlet />
}
