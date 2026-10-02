import { PASSWORD_MIN_LENGTH } from '@snailbet/shared'

export type StrengthLevel = 0 | 1 | 2 | 3 | 4

export type PasswordRequirement = {
  id: 'length' | 'uppercase' | 'lowercase' | 'number'
  label: string
  met: boolean
}

export const STRENGTH_LABELS: Record<Exclude<StrengthLevel, 0>, string> = {
  1: 'Débil',
  2: 'Regular',
  3: 'Buena',
  4: 'Fuerte',
}

/** A partir de esta longitud, una contraseña que cumple todo se considera fuerte. */
const STRONG_LENGTH = 12

/**
 * Evalúa la contraseña para el indicador del registro. Los requisitos son los mismos
 * que valida el esquema de `shared`; la longitud extra solo sube el nivel.
 */
export function evaluatePassword(password: string): {
  level: StrengthLevel
  requirements: PasswordRequirement[]
} {
  const requirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: `${PASSWORD_MIN_LENGTH} caracteres o más`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    { id: 'uppercase', label: 'Una mayúscula', met: /[A-Z]/.test(password) },
    { id: 'lowercase', label: 'Una minúscula', met: /[a-z]/.test(password) },
    { id: 'number', label: 'Un número', met: /\d/.test(password) },
  ]

  if (password.length === 0) {
    return { level: 0, requirements }
  }

  const metCount = requirements.filter((requirement) => requirement.met).length
  const lengthPenalty = password.length >= STRONG_LENGTH ? 0 : 1
  const level = Math.min(4, Math.max(1, metCount - lengthPenalty)) as StrengthLevel

  return { level, requirements }
}
