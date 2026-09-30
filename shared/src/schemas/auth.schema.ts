import { z } from 'zod'
import { COMMON_PASSWORDS } from '../constants/common-passwords'

export const NAME_MIN_LENGTH = 3
export const NAME_MAX_LENGTH = 80
export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 64

/** Letras de cualquier idioma (incluye acentos y ñ) separadas por un espacio, apóstrofe o guion. */
const NAME_PATTERN = /^\p{L}+(?:[ '-]\p{L}+)*$/u

/**
 * Longitud mínima de un fragmento del correo o del nombre para considerarlo al revisar la contraseña.
 * Con 3, un nombre como "Ana" bloquearía contraseñas sin relación como "Bananas2026".
 */
const MIN_FRAGMENT_LENGTH = 4

const nameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, ' '))
  .pipe(
    z
      .string()
      .min(NAME_MIN_LENGTH, `El nombre debe tener al menos ${NAME_MIN_LENGTH} caracteres`)
      .max(NAME_MAX_LENGTH, `El nombre no puede tener más de ${NAME_MAX_LENGTH} caracteres`)
      .regex(NAME_PATTERN, 'El nombre solo puede contener letras, espacios, apóstrofes y guiones')
      .refine((value) => value.split(' ').length >= 2, 'Ingresa tu nombre y al menos un apellido'),
  )

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, 'El correo es demasiado largo')
  .pipe(z.email('Ingresa un correo electrónico válido'))

/** La contraseña no se recorta: los espacios son caracteres válidos. */
const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH, `La contraseña no puede tener más de ${PASSWORD_MAX_LENGTH} caracteres`)
  .regex(/[a-z]/, 'Incluye al menos una letra minúscula')
  .regex(/[A-Z]/, 'Incluye al menos una letra mayúscula')
  .regex(/\d/, 'Incluye al menos un número')
  .refine(
    (value) => !COMMON_PASSWORDS.has(value.toLowerCase()),
    'Esta contraseña es muy común; elige una más difícil de adivinar',
  )

/** Minúsculas y sin acentos, para que "López" y "lopez" se consideren iguales. */
function normalizeForComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Fragmentos personales que no deben aparecer dentro de la contraseña. */
function getPersonalFragments(name: string, email: string): string[] {
  const emailLocalPart = email.split('@')[0] ?? ''
  const nameWords = name.split(' ')
  return [emailLocalPart, ...nameWords]
    .map(normalizeForComparison)
    .filter((fragment) => fragment.length >= MIN_FRAGMENT_LENGTH)
}

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Las contraseñas no coinciden',
      })
    }

    const comparablePassword = normalizeForComparison(data.password)
    const containsPersonalData = getPersonalFragments(data.name, data.email).some((fragment) =>
      comparablePassword.includes(fragment),
    )
    if (containsPersonalData) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'La contraseña no debe contener tu nombre ni tu correo',
      })
    }
  })

/**
 * El login solo exige que los campos no estén vacíos y que el correo tenga formato válido.
 * No aplica las reglas de fuerza: revelarlas aquí daría pistas a un atacante
 * y bloquearía a usuarios cuya contraseña se creó con reglas anteriores.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

/** Datos tal como los captura el formulario (antes de normalizar). */
export type RegisterFormValues = z.input<typeof registerSchema>
/** Datos ya validados y normalizados (nombre sin espacios extra, correo en minúsculas). */
export type RegisterData = z.output<typeof registerSchema>

export type LoginFormValues = z.input<typeof loginSchema>
export type LoginData = z.output<typeof loginSchema>
