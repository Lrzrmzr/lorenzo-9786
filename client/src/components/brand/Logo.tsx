import { Group, Text } from '@mantine/core'

type LogoSize = 'sm' | 'md' | 'lg'

type LogoProps = {
  size?: LogoSize
  /** `inverse` para fondos verde musgo (panel de marca). */
  variant?: 'default' | 'inverse'
}

const SIZES: Record<LogoSize, { markWidth: number; fontSize: number }> = {
  sm: { markWidth: 34, fontSize: 20 },
  md: { markWidth: 40, fontSize: 22 },
  lg: { markWidth: 52, fontSize: 30 },
}

/** Símbolo del caracol en trazo; usa `currentColor` para heredar el color del contenedor. */
function SnailMark({ width }: { width: number }) {
  return (
    <svg
      width={width}
      height={(width * 40) / 48}
      viewBox="0 0 48 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 28.5Q5 31 8.5 31H35C39.5 31 41.5 27.5 40.5 23" />
      <path d="M39.6 23.5L37.5 13.5" />
      <path d="M41.2 23.2L44 14.5" />
      <circle cx="37.3" cy="12.3" r="1.2" fill="currentColor" />
      <circle cx="44.3" cy="13.3" r="1.2" fill="currentColor" />
      <path d="M20 21.5A2.1 2.1 0 0 1 24.2 21.5A4.2 4.2 0 0 1 15.8 21.5A6.3 6.3 0 0 1 28.4 21.5A8.4 8.4 0 0 1 11.6 21.5" />
    </svg>
  )
}

export function Logo({ size = 'md', variant = 'default' }: LogoProps) {
  const { markWidth, fontSize } = SIZES[size]
  const isInverse = variant === 'inverse'

  return (
    <Group gap={8} wrap="nowrap" c={isInverse ? 'amber.2' : 'moss.6'}>
      <SnailMark width={markWidth} />
      <Text component="span" ff="heading" fw={700} fz={fontSize} c={isInverse ? 'white' : 'moss.8'}>
        SnailBet
      </Text>
    </Group>
  )
}
