import { Badge, Group, Modal, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useTopUp } from '../hooks/useTopUp'
import { TopUpForm } from './TopUpForm'
import { TopUpSuccess } from './TopUpSuccess'

type TopUpModalProps = {
  opened: boolean
  onClose: () => void
}

/** Modal de recarga: formulario y, si se aprueba, la confirmación. */
export function TopUpModal({ opened, onClose }: TopUpModalProps) {
  const { state, submit, reset } = useTopUp()
  const isMobile = useMediaQuery('(max-width: 36em)')
  const isProcessing = state.status === 'processing'

  function handleClose() {
    // Mientras se procesa no se puede cerrar: el usuario se quedaría sin ver el resultado.
    if (isProcessing) return
    reset()
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      fullScreen={isMobile}
      size="md"
      centered
      closeOnClickOutside={!isProcessing}
      closeOnEscape={!isProcessing}
      withCloseButton={!isProcessing}
      title={
        <Group gap="sm">
          <Text ff="heading" fw={600} fz="xl">
            Recargar saldo
          </Text>
          <Badge color="amber.8" variant="light" size="sm">
            SnailPay · pasarela simulada
          </Badge>
        </Group>
      }
    >
      {state.status === 'approved' ? (
        <TopUpSuccess
          payment={state.payment}
          balanceCents={state.balanceCents}
          onDone={handleClose}
        />
      ) : (
        <TopUpForm state={state} onSubmit={submit} />
      )}
    </Modal>
  )
}
