import { Button, Group, Paper, Stack, Text } from '@mantine/core'
import { IconCreditCard } from '@tabler/icons-react'
import { BRAND } from '../../../app/theme'
import { formatMoney } from '../../../lib/money'

type BalanceCardProps = {
  balanceCents: number
  /** Sin esta función el botón aparece deshabilitado. */
  onTopUp?: () => void
}

/** Saldo disponible: el elemento protagonista del dashboard. */
export function BalanceCard({ balanceCents, onTopUp }: BalanceCardProps) {
  const isEmpty = balanceCents === 0

  return (
    <Paper
      component="section"
      aria-label="Saldo disponible"
      bg="moss.7"
      p={{ base: 'lg', sm: 'xl' }}
      withBorder={false}
    >
      <Group justify="space-between" align="flex-end" gap="lg">
        <Stack gap={4}>
          <Text className="sb-overline" c="moss.1">
            Saldo disponible
          </Text>
          <Group gap={8} align="baseline" wrap="nowrap">
            <Text
              ff="heading"
              fw={700}
              fz={{ base: 36, sm: 48 }}
              lh={1.1}
              c="white"
              className="sb-tabular"
            >
              {formatMoney(balanceCents)}
            </Text>
            <Text fw={700} c="amber.3">
              MXN
            </Text>
          </Group>
          {isEmpty && (
            <Text c="moss.1" fz="sm">
              Tu saldo está en cero. Haz tu primera recarga para empezar.
            </Text>
          )}
        </Stack>

        <Button
          size="md"
          color="amber.5"
          c={BRAND.ink}
          leftSection={<IconCreditCard size={20} />}
          onClick={onTopUp}
          disabled={!onTopUp}
        >
          Recargar con SnailPay
        </Button>
      </Group>
    </Paper>
  )
}
