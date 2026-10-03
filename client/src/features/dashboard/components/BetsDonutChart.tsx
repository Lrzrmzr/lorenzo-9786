import { DonutChart } from '@mantine/charts'
import { Box, Center, Group, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import type { BetsChartData } from '../utils/race-stats'
import { ChartCard } from './ChartCard'

const TITLE = 'Tus apuestas de la jornada'

type LegendRowProps = {
  icon: ReactNode
  color: string
  label: string
  value: number
  percent: number
}

/** Fila de la leyenda. El ícono acompaña al color para no depender solo de él. */
function LegendRow({ icon, color, label, value, percent }: LegendRowProps) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap="xs" wrap="nowrap">
        <ThemeIcon color={color} size="sm" radius="xl">
          {icon}
        </ThemeIcon>
        <Text>{label}</Text>
      </Group>
      <Text fw={700} className="sb-tabular">
        {value} · {percent} %
      </Text>
    </Group>
  )
}

type BetsDonutChartProps = {
  data: BetsChartData
}

export function BetsDonutChart({ data }: BetsDonutChartProps) {
  const { won, lost, total, wonPercent, lostPercent, segments } = data

  return (
    <ChartCard title={TITLE} subtitle={`${total} apuestas simuladas`}>
      {total === 0 ? (
        <Center mih={200}>
          <Text c="dimmed">No hubo apuestas en esta jornada.</Text>
        </Center>
      ) : (
        <Stack gap="lg">
          {/* La gráfica es decorativa para lectores de pantalla: la leyenda tiene los mismos datos. */}
          <Center aria-hidden="true">
            <DonutChart
              data={segments}
              size={180}
              thickness={26}
              paddingAngle={2}
              chartLabel={`${total} apuestas`}
              tooltipDataSource="segment"
            />
          </Center>
          <Stack gap="xs">
            <LegendRow
              icon={<IconCheck size={14} />}
              color="green.6"
              label="Ganadas"
              value={won}
              percent={wonPercent}
            />
            <LegendRow
              icon={<IconX size={14} />}
              color="red.6"
              label="Perdidas"
              value={lost}
              percent={lostPercent}
            />
          </Stack>
          <Box pt="sm" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
            <Text c="dimmed" fz="sm">
              Porcentaje de acierto:{' '}
              <Text span fw={700} c="var(--mantine-color-text)" className="sb-tabular">
                {wonPercent} %
              </Text>
            </Text>
          </Box>
        </Stack>
      )}
    </ChartCard>
  )
}

/** Esqueleto con la forma de la dona y su leyenda. */
export function BetsDonutChartSkeleton() {
  return (
    <ChartCard title={TITLE}>
      <Stack gap="lg" aria-busy="true" aria-label="Cargando apuestas">
        <Center>
          <Skeleton circle height={180} />
        </Center>
        <Stack gap="xs">
          <Skeleton height={22} />
          <Skeleton height={22} />
        </Stack>
        <Skeleton height={16} width="60%" />
      </Stack>
    </ChartCard>
  )
}
