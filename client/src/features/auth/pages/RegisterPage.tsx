import { Anchor, Text } from '@mantine/core'
import { Link } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Empiezas con saldo de $0.00 y recargas cuando quieras."
      footer={
        <Text ta="center" c="dimmed">
          ¿Ya tienes cuenta?{' '}
          <Anchor component={Link} to="/login" fw={700}>
            Inicia sesión
          </Anchor>
        </Text>
      }
    >
      <RegisterForm />
    </AuthLayout>
  )
}
