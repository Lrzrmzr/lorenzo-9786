import { Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'
import { Logo } from '../../../components/brand/Logo'
import { formatMoney } from '../../../lib/money'
import { useAuth } from '../../auth/hooks/useAuth'

/** Temporal: muestra la sesión activa; el dashboard completo se implementa en su propia fase. */
export function DashboardPage() {
  const { state, logout } = useAuth()

  // ProtectedRoute garantiza la sesión; la comprobación es para que TypeScript lo sepa.
  if (state.status !== 'authenticated') {
    return null
  }

  const firstName = state.user.name.split(' ')[0]

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <Logo />
          <Button variant="default" leftSection={<IconLogout size={18} />} onClick={logout}>
            Cerrar sesión
          </Button>
        </Group>
        <Title order={1}>Hola, {firstName}</Title>
        <Paper p="xl">
          <Text className="sb-overline" c="dimmed">
            Saldo disponible
          </Text>
          <Text ff="heading" fz={48} fw={700} className="sb-tabular">
            {formatMoney(state.user.balanceCents)}
          </Text>
        </Paper>
      </Stack>
    </Container>
  )
}
