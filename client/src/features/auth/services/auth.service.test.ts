import type { LoginData, RegisterData } from '@snailbet/shared'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createAuthService,
  LOCK_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  SESSION_DURATION_MS,
} from './auth.service'

const registration: RegisterData = {
  name: 'Ana López',
  email: 'ana.lopez@example.com',
  password: 'Caracol-Veloz7',
  confirmPassword: 'Caracol-Veloz7',
}

const credentials: LoginData = { email: registration.email, password: registration.password }

/** Todo el contenido de localStorage como un solo texto. */
function storageContents(): string {
  const values: (string | null)[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) values.push(localStorage.getItem(key))
  }
  return values.join('\n')
}

/** Reloj que las pruebas pueden adelantar. */
function createTestService() {
  let current = new Date('2026-10-02T12:00:00.000Z').getTime()
  const service = createAuthService({ now: () => new Date(current), passwordIterations: 1_000 })
  return {
    service,
    advance: (ms: number) => {
      current += ms
    },
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('register', () => {
  it('crea el usuario con saldo $0 e inicia su sesión', async () => {
    const { service } = createTestService()

    const result = await service.register(registration)

    expect(result).toMatchObject({
      ok: true,
      user: { name: 'Ana López', email: 'ana.lopez@example.com', balanceCents: 0 },
    })
    expect(service.restoreSession()?.email).toBe('ana.lopez@example.com')
  })

  it('nunca guarda ni devuelve la contraseña', async () => {
    const { service } = createTestService()

    const result = await service.register(registration)

    expect(JSON.stringify(result)).not.toContain(registration.password)
    expect(JSON.stringify(result)).not.toContain('"password"')
    expect(storageContents()).toContain('PBKDF2-SHA256')
    expect(storageContents()).not.toContain(registration.password)
  })

  it('rechaza un correo ya registrado', async () => {
    const { service } = createTestService()
    await service.register(registration)

    const result = await service.register({ ...registration, name: 'Otra Persona' })

    expect(result).toEqual({ ok: false, error: { code: 'email_taken' } })
  })
})

describe('login', () => {
  beforeEach(async () => {
    await createTestService().service.register(registration)
    localStorage.removeItem('snailbet:v1:session')
  })

  it('inicia sesión con el correo y la contraseña registrados', async () => {
    const { service } = createTestService()

    const result = await service.login(credentials)

    expect(result).toMatchObject({ ok: true, user: { email: registration.email } })
    expect(service.restoreSession()).not.toBeNull()
  })

  it('responde el mismo error para contraseña incorrecta y correo inexistente', async () => {
    const { service } = createTestService()

    const wrongPassword = await service.login({ ...credentials, password: 'Otra-Clave9' })
    const unknownEmail = await service.login({ ...credentials, email: 'nadie@example.com' })

    expect(wrongPassword).toEqual({ ok: false, error: { code: 'invalid_credentials' } })
    expect(unknownEmail).toEqual(wrongPassword)
  })

  it(`bloquea el correo tras ${MAX_FAILED_ATTEMPTS} intentos fallidos, aun con la contraseña correcta`, async () => {
    const { service } = createTestService()
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await service.login({ ...credentials, password: 'Otra-Clave9' })
    }

    const result = await service.login(credentials)

    expect(result).toMatchObject({ ok: false, error: { code: 'locked' } })
  })

  it('desbloquea el correo cuando pasa el tiempo de bloqueo', async () => {
    const { service, advance } = createTestService()
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await service.login({ ...credentials, password: 'Otra-Clave9' })
    }

    advance(LOCK_DURATION_MS)
    const result = await service.login(credentials)

    expect(result.ok).toBe(true)
  })

  it('reinicia el conteo de fallos después de un inicio de sesión exitoso', async () => {
    const { service } = createTestService()
    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i++) {
      await service.login({ ...credentials, password: 'Otra-Clave9' })
    }
    await service.login(credentials)

    const result = await service.login({ ...credentials, password: 'Otra-Clave9' })

    expect(result).toEqual({ ok: false, error: { code: 'invalid_credentials' } })
  })
})

describe('sesión', () => {
  it('se conserva al recargar la página (otra instancia del servicio)', async () => {
    await createTestService().service.register(registration)

    const afterReload = createTestService().service

    expect(afterReload.restoreSession()?.email).toBe(registration.email)
  })

  it('se elimina al cerrar sesión', async () => {
    const { service } = createTestService()
    await service.register(registration)

    service.logout()

    expect(service.restoreSession()).toBeNull()
  })

  it('expira después de 24 horas', async () => {
    const { service, advance } = createTestService()
    await service.register(registration)

    advance(SESSION_DURATION_MS)

    expect(service.restoreSession()).toBeNull()
    expect(localStorage.getItem('snailbet:v1:session')).toBeNull()
  })

  it('se descarta si el usuario ya no existe', async () => {
    const { service } = createTestService()
    await service.register(registration)
    localStorage.removeItem('snailbet:v1:users')

    expect(service.restoreSession()).toBeNull()
  })
})
