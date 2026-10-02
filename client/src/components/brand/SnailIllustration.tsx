type SnailIllustrationProps = {
  /** `lost` agrega el rastro punteado y los signos de interrogación (página 404). */
  variant?: 'default' | 'lost'
  width?: number
}

const COLORS = {
  halo: '#FAEBC6',
  body: '#BCD5B3',
  shell: '#E0A526',
  line: '#2C4A29',
  leaf: '#99BF8C',
  leafVein: '#3F6B3A',
  trail: '#7AAA6B',
  ground: '#E6DFCC',
} as const

/** Ilustración decorativa del caracol, con el mismo trazo que el logotipo. */
export function SnailIllustration({ variant = 'default', width = 420 }: SnailIllustrationProps) {
  const isLost = variant === 'lost'

  return (
    <svg
      viewBox="-50 0 320 150"
      width={width}
      style={{ maxWidth: '100%', height: 'auto' }}
      aria-hidden="true"
    >
      <ellipse cx="110" cy="84" rx="170" ry="80" fill={COLORS.halo} opacity={0.7} />

      {isLost && (
        <path
          d="M-40 128 C 0 100, 20 150, 60 130 S 120 150, 150 128"
          fill="none"
          stroke={COLORS.trail}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="2 9"
        />
      )}

      <path d="M232 128c-4-22 8-38 30-44c2 22-8 38-30 44z" fill={COLORS.leaf} />
      <path d="M234 126c6-12 14-22 26-38" fill="none" stroke={COLORS.leafVein} strokeWidth={2} />

      <g transform="translate(20 4) scale(4.2)">
        <path
          d="M4 28.5Q5 31 8.5 31H35C39.5 31 41.5 27.5 40.5 23L39.6 21.5L38 22.5Z"
          fill={COLORS.body}
        />
        <circle cx="20" cy="21.5" r="9.6" fill={COLORS.shell} />
        <g
          fill="none"
          stroke={COLORS.line}
          strokeWidth={0.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 28.5Q5 31 8.5 31H35C39.5 31 41.5 27.5 40.5 23" />
          <path d="M39.6 23.5L37.5 13.5" />
          <path d="M41.2 23.2L44 14.5" />
          <path d="M20 21.5A2.1 2.1 0 0 1 24.2 21.5A4.2 4.2 0 0 1 15.8 21.5A6.3 6.3 0 0 1 28.4 21.5A8.4 8.4 0 0 1 11.6 21.5" />
        </g>
        <circle cx="37.3" cy="12.3" r="1.25" fill={COLORS.line} />
        <circle cx="44.3" cy="13.3" r="1.25" fill={COLORS.line} />
      </g>

      <path d="M-40 142H262" stroke={COLORS.ground} strokeWidth={2} strokeLinecap="round" />

      {isLost && (
        <g fill={COLORS.leafVein} fontFamily="Fredoka, sans-serif" fontWeight={700}>
          <text x="232" y="54" fontSize="34">
            ?
          </text>
          <text x="252" y="80" fontSize="22">
            ?
          </text>
        </g>
      )}
    </svg>
  )
}
