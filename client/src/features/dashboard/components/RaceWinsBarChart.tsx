import { BarChart } from '@mantine/charts'
import { Badge, Group, Skeleton, Stack, Text, VisuallyHidden, useMatches } from '@mantine/core'
import { IconTrophy } from '@tabler/icons-react'
import { formatDayMonth } from '../../../lib/dates'
import type { SnailWinsDatum } from '../utils/race-stats'
import { ChartCard } from './ChartCard'

const TITLE = 'Victorias por caracol'
const SKELETON_HEIGHTS = [30, 55, 90, 45, 20, 60]

function formatWins(wins: number): string {
  return `${wins} ${wins === 1 ? 'victoria' : 'victorias'}`
}

type RaceWinsBarChartProps = {
  data: SnailWinsDatum[]
  /** Día de la jornada en formato AAAA-MM-DD. */
  date: string
  raceCount: number
  favorite: SnailWinsDatum | null
}

export function RaceWinsBarChart({ data, date, raceCount, favorite }: RaceWinsBarChartProps) {
  // En pantallas angostas los 6 nombres no caben bajo las barras: se acuestan las barras
  // y los nombres pasan al eje vertical.
  const orientation = useMatches<'horizontal' | 'vertical'>({ base: 'vertical', sm: 'horizontal' })
  const isVertical = orientation === 'vertical'

  return (
    <ChartCard
      title={TITLE}
      subtitle={`Jornada del ${formatDayMonth(date)} · ${raceCount} carreras`}
      aside={
        favorite && (
          <Badge color="amber.6" variant="light" leftSection={<IconTrophy size={14} />}>
            Favorito: {favorite.snail}
          </Badge>
        )
      }
    >
      {/* Equivalente en texto de la gráfica para lectores de pantalla. */}
      <VisuallyHidden>
        <ul>
          {data.map((datum) => (
            <li key={datum.snail}>
              {datum.snail}: {formatWins(datum.wins)}
            </li>
          ))}
        </ul>
      </VisuallyHidden>
      <div aria-hidden="true">
        <BarChart
          h={isVertical ? 280 : 260}
          data={data}
          dataKey="snail"
          orientation={orientation}
          series={[{ name: 'wins', label: 'Victorias', color: 'moss.6' }]}
          valueFormatter={formatWins}
          gridAxis={isVertical ? 'x' : 'y'}
          tickLine="none"
          maxBarWidth={48}
          xAxisProps={isVertical ? { allowDecimals: false } : { interval: 0 }}
          yAxisProps={isVertical ? { width: 96 } : { allowDecimals: false }}
        />
      </div>
    </ChartCard>
  )
}

/** Esqueleto con la forma de las barras. */
export function RaceWinsBarChartSkeleton() {
  return (
    <ChartCard title={TITLE}>
      <Stack gap="md" aria-busy="true" aria-label="Cargando victorias">
        <Skeleton height={14} width="50%" />
        <Group align="flex-end" justify="space-around" h={230} wrap="nowrap">
          {SKELETON_HEIGHTS.map((height, index) => (
            <Skeleton key={index} width={32} height={`${height}%`} />
          ))}
        </Group>
        <Text c="dimmed" fz="sm" ta="center">
          Cargando carreras…
        </Text>
      </Stack>
    </ChartCard>
  )
}
