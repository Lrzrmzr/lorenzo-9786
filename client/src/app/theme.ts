import {
  Badge,
  Button,
  Card,
  createTheme,
  Paper,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core'

/*
 * Paletas de 10 tonos (0 = más claro, 9 = más oscuro), como las espera Mantine.
 * El tono 6 es el que Mantine usa por defecto en botones y elementos rellenos.
 */

/** Verde musgo, color de marca. moss[6] (#3F6B3A) con texto blanco: 6.2:1. */
const moss: MantineColorsTuple = [
  '#EFF5ED',
  '#DDEAD8',
  '#BCD5B3',
  '#99BF8C',
  '#7AAA6B',
  '#5E8F52',
  '#3F6B3A',
  '#355C31',
  '#2C4A29',
  '#1F361D',
]

/** Ámbar, acento. Solo para la acción de recarga y detalles; texto oscuro encima (6.5:1). */
const amber: MantineColorsTuple = [
  '#FDF6E6',
  '#FAEBC6',
  '#F5D98F',
  '#EFC65A',
  '#E8B53A',
  '#E0A526',
  '#C48A14',
  '#9E6E0E',
  '#7A550B',
  '#563C07',
]

/** Terracota. Reemplaza el rojo de Mantine para errores y pagos rechazados. */
const terracotta: MantineColorsTuple = [
  '#FCEFEA',
  '#F8DDD3',
  '#F0B9A6',
  '#E69478',
  '#DB7353',
  '#CF5F3D',
  '#C2502E',
  '#A8401F',
  '#8A3419',
  '#6B2713',
]

/** Verde hoja. Reemplaza el verde de Mantine para éxito y apuestas ganadas. */
const leaf: MantineColorsTuple = [
  '#EAF5EE',
  '#D2EADB',
  '#A6D4B7',
  '#78BD92',
  '#52A673',
  '#3A9060',
  '#2F7D4F',
  '#266741',
  '#1D5233',
  '#143A24',
]

/** Colores fuera de las paletas, reutilizados por los estilos globales y la ilustración. */
export const BRAND = {
  cream: '#FAF6EC',
  ink: '#2B2A26',
  inkMuted: '#6B6658',
  border: '#E6DFCC',
  /** Borde de controles: 3.6:1 sobre blanco, el mínimo para que se distingan. */
  borderStrong: '#8C8574',
} as const

export const theme = createTheme({
  primaryColor: 'moss',
  primaryShade: 6,
  colors: { moss, amber, red: terracotta, green: leaf },
  black: BRAND.ink,
  fontFamily: '"Nunito Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
  headings: {
    fontFamily: 'Fredoka, "Nunito Sans", system-ui, sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  radius: { xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px' },
  cursorType: 'pointer',
  components: {
    Button: Button.extend({ defaultProps: { radius: 'md' } }),
    Card: Card.extend({ defaultProps: { radius: 'lg', withBorder: true, padding: 'lg' } }),
    Paper: Paper.extend({ defaultProps: { radius: 'lg', withBorder: true } }),
    // Mantine pone los Badge en mayúsculas; el diseño usa mayúscula solo al inicio.
    Badge: Badge.extend({ styles: { root: { textTransform: 'none' } } }),
  },
})

/** Sobrescribe variables CSS de Mantine que no se configuran desde el tema. */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': BRAND.cream,
    '--mantine-color-text': BRAND.ink,
    '--mantine-color-dimmed': BRAND.inkMuted,
    '--mantine-color-default-border': BRAND.border,
  },
  dark: {},
})
