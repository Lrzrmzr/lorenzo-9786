import { Button, Divider, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import type { ApprovedPaymentResponse } from '@snailbet/shared'
import { IconCheck } from '@tabler/icons-react'
import { formatMoney, toCents } from '../../../lib/money'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text c="dimmed" fz="sm">
        {label}
      </Text>
      <Text fw={700} className="sb-tabular">
        {value}
      </Text>
    </Group>
  )
}

type TopUpSuccessProps = {
  payment: ApprovedPaymentResponse
  balanceCents: number
  onDone: () => void
}

/** Confirmación de una recarga aprobada. */
export function TopUpSuccess({ payment, balanceCents, onDone }: TopUpSuccessProps) {
  return (
    <Stack gap="lg" align="stretch">
      <Stack gap="xs" align="center" role="status">
        <ThemeIcon color="green.6" size={56} radius="xl">
          <IconCheck size={32} />
        </ThemeIcon>
        <Title order={3}>Recarga aprobada</Title>
        <Text ff="heading" fw={700} fz={32} className="sb-tabular">
          {formatMoney(toCents(payment.transaction_amount))}
        </Text>
      </Stack>

      <Stack gap="xs">
        <DetailRow label="Código de autorización" value={payment.authorization_code} />
        <DetailRow label="Referencia" value={payment.reference} />
        <Divider my={4} />
        <DetailRow label="Nuevo saldo" value={formatMoney(balanceCents)} />
      </Stack>

      <Button size="md" onClick={onDone} data-autofocus>
        Listo
      </Button>
    </Stack>
  )
}
