import { Group, Progress, Stack, Text, VisuallyHidden } from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import {
  evaluatePassword,
  STRENGTH_LABELS,
  type StrengthLevel,
} from '../services/password-strength'

const SEGMENTS = [1, 2, 3, 4] as const

const LEVEL_COLORS: Record<StrengthLevel, string> = {
  0: 'gray',
  1: 'red',
  2: 'amber',
  3: 'moss',
  4: 'green',
}

/** Indicador de fuerza y lista de requisitos, debajo del campo de contraseña del registro. */
export function PasswordStrength({ password }: { password: string }) {
  const { level, requirements } = evaluatePassword(password)

  return (
    <Stack gap={8}>
      <Group gap={4} grow aria-hidden="true">
        {SEGMENTS.map((segment) => (
          <Progress
            key={segment}
            value={level >= segment ? 100 : 0}
            color={LEVEL_COLORS[level]}
            size={6}
          />
        ))}
      </Group>

      {level !== 0 && (
        <Text size="xs" fw={700} c="dimmed">
          Seguridad: {STRENGTH_LABELS[level]}
        </Text>
      )}

      <Stack gap={4} component="ul" m={0} p={0} style={{ listStyle: 'none' }}>
        {requirements.map((requirement) => (
          <Group key={requirement.id} gap={6} component="li" wrap="nowrap">
            {requirement.met ? (
              <IconCheck size={14} color="var(--mantine-color-green-7)" aria-hidden="true" />
            ) : (
              <IconX size={14} color="var(--mantine-color-dimmed)" aria-hidden="true" />
            )}
            <Text
              size="xs"
              fw={requirement.met ? 700 : 400}
              c={requirement.met ? 'green.8' : 'dimmed'}
            >
              {requirement.label}
              <VisuallyHidden>{requirement.met ? ' (cumplido)' : ' (pendiente)'}</VisuallyHidden>
            </Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  )
}
