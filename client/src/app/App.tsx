import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { AuthProvider } from '../features/auth/context/AuthProvider'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ProtectedRoute } from '../features/auth/routes/ProtectedRoute'
import { PublicOnlyRoute } from '../features/auth/routes/PublicOnlyRoute'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { NotFoundPage } from './NotFoundPage'
import { cssVariablesResolver, theme } from './theme'

/**
 * Las rutas sin `path` son "layouts": no agregan nada a la URL, solo envuelven a sus hijas.
 * Así la protección se declara una vez por grupo y no en cada página.
 */
const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [{ path: '/dashboard', element: <DashboardPage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
])

export function App() {
  return (
    // Un solo tema (claro): forceColorScheme evita que Mantine siga la preferencia del sistema.
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="light"
    >
      <Notifications position="top-right" />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </MantineProvider>
  )
}
