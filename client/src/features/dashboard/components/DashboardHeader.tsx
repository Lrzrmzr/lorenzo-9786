import { Avatar, Button, Container, Group, Modal, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconLogout } from '@tabler/icons-react'
import { Logo } from '../../../components/brand/Logo'

type DashboardHeaderProps = {
  userName: string
  onLogout: () => void
}

/** Encabezado: logotipo, usuario y cierre de sesión con confirmación. */
export function DashboardHeader({ userName, onLogout }: DashboardHeaderProps) {
  const [confirmOpened, confirm] = useDisclosure(false)

  return (
    <>
      <Container size="lg" h="100%">
        <Group h="100%" justify="space-between" wrap="nowrap">
          <Logo />
          <Group gap="sm" wrap="nowrap">
            {/* `name` genera las iniciales ("Ana López" → "AL"). */}
            <Avatar name={userName} color="moss" radius="xl" aria-hidden="true" />
            <Text fw={700} visibleFrom="sm">
              {userName}
            </Text>
            <Button variant="default" leftSection={<IconLogout size={18} />} onClick={confirm.open}>
              Cerrar sesión
            </Button>
          </Group>
        </Group>
      </Container>

      <Modal
        opened={confirmOpened}
        onClose={confirm.close}
        title="¿Cerrar sesión?"
        size="sm"
        centered
      >
        <Text c="dimmed" mb="lg">
          Tendrás que iniciar sesión de nuevo para ver tu saldo.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={confirm.close}>
            Cancelar
          </Button>
          <Button onClick={onLogout}>Cerrar sesión</Button>
        </Group>
      </Modal>
    </>
  )
}
