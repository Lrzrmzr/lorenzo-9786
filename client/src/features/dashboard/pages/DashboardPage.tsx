import { AppShell, Container, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { formatLongDate } from '../../../lib/dates'
import { useAuth } from '../../auth/hooks/useAuth'
import { BalanceCard } from '../components/BalanceCard'
import { BetsDonutChart, BetsDonutChartSkeleton } from '../components/BetsDonutChart'
import { ChartsError } from '../components/ChartCard'
import { DashboardHeader } from '../components/DashboardHeader'
import { RaceWinsBarChart, RaceWinsBarChartSkeleton } from '../components/RaceWinsBarChart'
import { useDailyRaces, type DailyRacesState } from '../hooks/useDailyRaces'
import { findFavorite, toBetsChartData, toSnailWinsData } from '../utils/race-stats'

/** Las gráficas según el estado de la carga. Un error aquí no afecta al saldo. */
function RaceCharts({ state, onRetry }: { state: DailyRacesState; onRetry: () => void }) {
  switch (state.status) {
    case 'loading':
      return (
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <BetsDonutChartSkeleton />
          <RaceWinsBarChartSkeleton />
        </SimpleGrid>
      )
    case 'error':
      return <ChartsError onRetry={onRetry} />
    case 'success': {
      const { data } = state
      const winsData = toSnailWinsData(data.snails, data.wins_by_snail)
      return (
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <BetsDonutChart data={toBetsChartData(data.bets_summary)} />
          <RaceWinsBarChart
            data={winsData}
            date={data.date}
            raceCount={data.races.length}
            favorite={findFavorite(winsData)}
          />
        </SimpleGrid>
      )
    }
    default: {
      // Si se agrega un estado nuevo y no se maneja aquí, TypeScript marca error.
      const unhandled: never = state
      return unhandled
    }
  }
}

export function DashboardPage() {
  const { state, logout } = useAuth()
  const races = useDailyRaces()

  // ProtectedRoute garantiza la sesión; la comprobación es para que TypeScript lo sepa.
  if (state.status !== 'authenticated') {
    return null
  }

  const { user } = state
  const firstName = user.name.split(' ')[0]

  return (
    <AppShell header={{ height: 68 }} padding={0}>
      <AppShell.Header>
        <DashboardHeader userName={user.name} onLogout={logout} />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" py="xl">
          <Stack gap="lg">
            <Stack gap={2}>
              <Title order={1} fz={{ base: 28, sm: 34 }}>
                Hola, {firstName}
              </Title>
              <Text c="dimmed">{formatLongDate(new Date())}</Text>
            </Stack>
            <BalanceCard balanceCents={user.balanceCents} />
            <RaceCharts state={races.state} onRetry={races.retry} />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
