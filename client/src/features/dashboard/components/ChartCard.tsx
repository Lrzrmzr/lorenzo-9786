import { Button, Card, Group, Stack, Text, Title } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import type { ReactNode } from 'react'

type ChartCardProps = {
  title: string
  subtitle?: string
  /** Elemento opcional a la derecha del título (p. ej. la insignia de favorito). */
  aside?: ReactNode
  children: ReactNode
}

/** Marco común de las gráficas: título, subtítulo y contenido. */
export function ChartCard({ title, subtitle, aside, children }: ChartCardProps) {
  return (
    <Card h="100%">
      <Group justify="space-between" align="flex-start" mb="md" gap="sm">
        <Stack gap={2}>
          <Title order={2} fz="lg">
            {title}
          </Title>
          {subtitle && (
            <Text c="dimmed" fz="sm">
              {subtitle}
            </Text>
          )}
        </Stack>
        {aside}
      </Group>
      {children}
    </Card>
  )
}

type ChartsErrorProps = {
  onRetry: () => void
}

/** Error al cargar las carreras. Ocupa el lugar de las gráficas sin afectar al saldo. */
export function ChartsError({ onRetry }: ChartsErrorProps) {
  return (
    <Card>
      <Stack align="center" gap="sm" py="xl" role="alert">
        <Text fw={700}>No pudimos cargar las carreras</Text>
        <Text c="dimmed" fz="sm" ta="center">
          Revisa tu conexión e inténtalo de nuevo.
        </Text>
        <Button variant="light" leftSection={<IconRefresh size={18} />} onClick={onRetry}>
          Reintentar
        </Button>
      </Stack>
    </Card>
  )
}
