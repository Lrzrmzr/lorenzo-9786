import { Anchor, Center, Paper, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'
import { Logo } from '../../../components/brand/Logo'

/** Temporal: el formulario de registro se implementa con la autenticación. */
export function RegisterPage() {
  return (
    <Center mih="100vh" p="md">
      <Paper p="xl" w={400} maw="100%">
        <Stack gap="md">
          <Logo />
          <Title order={2}>Crear cuenta</Title>
          <Text c="dimmed">Formulario próximamente.</Text>
          <Anchor component={Link} to="/login">
            ¿Ya tienes cuenta? Inicia sesión
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  )
}
