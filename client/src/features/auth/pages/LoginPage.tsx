import { Anchor, Text } from '@mantine/core'
import { Link } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Revisa tu saldo y los resultados de la jornada."
      footer={
        <Text ta="center" c="dimmed">
          ¿No tienes cuenta?{' '}
          <Anchor component={Link} to="/register" fw={700}>
            Regístrate
          </Anchor>
        </Text>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
