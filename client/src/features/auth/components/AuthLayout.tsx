import { Box, Center, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { Logo } from '../../../components/brand/Logo'
import { SnailIllustration } from '../../../components/brand/SnailIllustration'

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
  /** Enlace a la otra pantalla de acceso (registro ↔ inicio de sesión). */
  footer: ReactNode
}

/** Panel de marca: solo en escritorio; en móvil el logotipo va arriba del formulario. */
function BrandPanel() {
  return (
    <Box visibleFrom="md" bg="moss.7" p={48} style={{ borderRadius: 'var(--mantine-radius-xl)' }}>
      <Stack justify="space-between" h="100%" gap="xl">
        <Logo size="lg" variant="inverse" />
        <Stack gap="md">
          <Title order={2} fz={40} lh={1.15} c="white">
            Sin prisa, pero con{' '}
            <Text span inherit c="amber.3">
              estrategia
            </Text>
            .
          </Title>
          <Text c="moss.1" fz="lg" maw={380}>
            Revisa tu saldo y los resultados de cada jornada de carreras.
          </Text>
        </Stack>
        <SnailIllustration width={440} />
      </Stack>
    </Box>
  )
}

/** Distribución común de las pantallas de inicio de sesión y registro. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <Box mih="100vh" p={{ base: 'md', md: 'xl' }}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48} mih={{ md: 'calc(100vh - 64px)' }}>
        <BrandPanel />
        <Center py={{ base: 'xl', md: 0 }}>
          <Stack w="100%" maw={400} gap="lg">
            <Box hiddenFrom="md">
              <Logo />
            </Box>
            <Stack gap={4}>
              <Title order={1} fz={30}>
                {title}
              </Title>
              <Text c="dimmed">{subtitle}</Text>
            </Stack>
            {children}
            {footer}
          </Stack>
        </Center>
      </SimpleGrid>
    </Box>
  )
}
