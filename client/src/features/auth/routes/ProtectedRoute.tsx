import { Center, Loader } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'

/** Solo deja pasar con sesión activa; sin ella, envía al login recordando a dónde se quería ir. */
export function ProtectedRoute() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') {
    return (
      <Center mih="100vh">
        <Loader aria-label="Cargando sesión" />
      </Center>
    )
  }

  if (state.status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
