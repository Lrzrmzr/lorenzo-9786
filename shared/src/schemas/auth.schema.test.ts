import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema, type RegisterFormValues } from './auth.schema'

const validRegistration: RegisterFormValues = {
  name: 'Ana López',
  email: 'ana.lopez@example.com',
  password: 'Caracol-Veloz7',
  confirmPassword: 'Caracol-Veloz7',
}

/** Devuelve los mensajes de error del campo indicado. */
function errorsFor(input: unknown, field: string): string[] {
  const result = registerSchema.safeParse(input)
  if (result.success) return []
  return result.error.issues
    .filter((issue) => issue.path.join('.') === field)
    .map((issue) => issue.message)
}

describe('registerSchema', () => {
  it('acepta un registro válido y normaliza nombre y correo', () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      name: '  Ana    López  ',
      email: '  Ana.Lopez@Example.COM ',
    })

    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Ana López')
    expect(result.data?.email).toBe('ana.lopez@example.com')
  })

  describe('nombre', () => {
    it.each([
      ['una sola palabra', 'Ana'],
      ['números', 'Ana L0pez'],
      ['símbolos', 'Ana <script>'],
      ['vacío', '   '],
    ])('rechaza un nombre con %s', (_case, name) => {
      expect(errorsFor({ ...validRegistration, name }, 'name')).not.toHaveLength(0)
    })

    it.each([
      ['acentos y ñ', 'José Peña'],
      ['apóstrofe', "Liam O'Connor"],
      ['guion', 'María-José Ruiz'],
    ])('acepta un nombre con %s', (_case, name) => {
      expect(errorsFor({ ...validRegistration, name }, 'name')).toHaveLength(0)
    })
  })

  describe('correo', () => {
    it.each(['sin-arroba.com', 'ana@', '@example.com', 'ana lopez@example.com'])(
      'rechaza "%s"',
      (email) => {
        expect(errorsFor({ ...validRegistration, email }, 'email')).not.toHaveLength(0)
      },
    )
  })

  describe('contraseña', () => {
    it.each([
      ['menos de 8 caracteres', 'Ab1cdef'],
      ['más de 64 caracteres', `Ab1${'x'.repeat(62)}`],
      ['sin mayúscula', 'caracolveloz7'],
      ['sin minúscula', 'CARACOLVELOZ7'],
      ['sin número', 'CaracolVeloz'],
      ['una contraseña común', 'Password123'],
    ])('rechaza una contraseña con %s', (_case, password) => {
      const errors = errorsFor(
        { ...validRegistration, password, confirmPassword: password },
        'password',
      )
      expect(errors).not.toHaveLength(0)
    })

    it('rechaza una contraseña que contiene el usuario del correo', () => {
      const password = 'Xana.lopez9'
      const errors = errorsFor(
        { ...validRegistration, password, confirmPassword: password },
        'password',
      )
      expect(errors).toContain('La contraseña no debe contener tu nombre ni tu correo')
    })

    it('rechaza una contraseña que contiene el apellido, aunque se escriba sin acento', () => {
      const password = 'Lopez2026x'
      const errors = errorsFor(
        { ...validRegistration, password, confirmPassword: password },
        'password',
      )
      expect(errors).toContain('La contraseña no debe contener tu nombre ni tu correo')
    })

    it('no recorta espacios: son caracteres válidos de la contraseña', () => {
      const password = ' Caracol Veloz7 '
      const result = registerSchema.safeParse({
        ...validRegistration,
        password,
        confirmPassword: password,
      })
      expect(result.data?.password).toBe(password)
    })
  })

  it('marca el error en confirmPassword cuando no coincide', () => {
    const errors = errorsFor(
      { ...validRegistration, confirmPassword: 'Caracol-Veloz8' },
      'confirmPassword',
    )
    expect(errors).toEqual(['Las contraseñas no coinciden'])
  })
})

describe('loginSchema', () => {
  it('acepta correo y contraseña, y normaliza el correo', () => {
    const result = loginSchema.safeParse({ email: ' ANA@example.com', password: 'cualquiera' })
    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('ana@example.com')
  })

  it('no aplica reglas de fuerza a la contraseña', () => {
    const result = loginSchema.safeParse({ email: 'ana@example.com', password: 'a' })
    expect(result.success).toBe(true)
  })

  it('rechaza una contraseña vacía', () => {
    const result = loginSchema.safeParse({ email: 'ana@example.com', password: '' })
    expect(result.success).toBe(false)
  })
})
