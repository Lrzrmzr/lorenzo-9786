import { Container, Stack, Text, Title } from '@mantine/core'
import { Logo } from '../../../components/brand/Logo'

/** Temporal: el dashboard se implementa en su propia fase. */
export function DashboardPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Logo />
        <Title order={1}>Hola</Title>
        <Text c="dimmed">Dashboard próximamente.</Text>
      </Stack>
    </Container>
  )
}
