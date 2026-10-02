import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { NotFoundPage } from './NotFoundPage'
import { cssVariablesResolver, theme } from './theme'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
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
      <RouterProvider router={router} />
    </MantineProvider>
  )
}
