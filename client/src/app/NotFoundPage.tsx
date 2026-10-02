import { Box, Button, Container, Stack, Text, Title } from '@mantine/core'
import { IconHome } from '@tabler/icons-react'
import { Link } from 'react-router'
import { Logo } from '../components/brand/Logo'
import { SnailIllustration } from '../components/brand/SnailIllustration'

export function NotFoundPage() {
  return (
    <Box mih="100vh">
      <Container size="lg" py="md">
        <Logo />
      </Container>

      <Container size="sm" py={48}>
        <Stack align="center" gap="md" ta="center">
          <SnailIllustration variant="lost" width={380} />
          <Text className="sb-overline" c="dimmed">
            Error 404
          </Text>
          <Title order={1}>Esta página se fue a paso de caracol</Title>
          <Text c="dimmed" maw={420}>
            Buscamos por todo el jardín y no la encontramos. Quizá el enlace cambió o nunca existió.
          </Text>
          <Button component={Link} to="/" size="lg" mt="sm" leftSection={<IconHome size={18} />}>
            Volver al inicio
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}
