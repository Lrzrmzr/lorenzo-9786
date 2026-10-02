import { describe, expect, it } from 'vitest'
import type { AuthState, AuthUser } from '../types'
import { authReducer, initialAuthState } from './auth-reducer'

const user: AuthUser = {
  id: '3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d',
  name: 'Ana López',
  email: 'ana.lopez@example.com',
  balanceCents: 0,
  createdAt: '2026-10-02T12:00:00.000Z',
}

const loading: AuthState = { status: 'loading' }
const anonymous: AuthState = { status: 'anonymous' }
const authenticated: AuthState = { status: 'authenticated', user }

describe('authReducer', () => {
  it('empieza cargando, mientras se revisa si hay una sesión guardada', () => {
    expect(initialAuthState).toEqual({ status: 'loading' })
  })

  describe('al restaurar la sesión (recarga de página)', () => {
    it('pasa a autenticado si había una sesión válida', () => {
      expect(authReducer(loading, { type: 'session_restored', user })).toEqual(authenticated)
    })

    it('pasa a anónimo si no había sesión', () => {
      expect(authReducer(loading, { type: 'session_not_found' })).toEqual(anonymous)
    })
  })

  describe('al iniciar y cerrar sesión', () => {
    it('pasa a autenticado al iniciar sesión', () => {
      expect(authReducer(anonymous, { type: 'logged_in', user })).toEqual(authenticated)
    })

    it('pasa a anónimo al cerrar sesión', () => {
      expect(authReducer(authenticated, { type: 'logged_out' })).toEqual(anonymous)
    })
  })

  describe('al actualizar el saldo', () => {
    it('cambia solo el saldo del usuario autenticado', () => {
      const next = authReducer(authenticated, { type: 'balance_updated', balanceCents: 25_000 })

      expect(next).toEqual({ status: 'authenticated', user: { ...user, balanceCents: 25_000 } })
    })

    it('no modifica el estado anterior: devuelve uno nuevo', () => {
      const frozen = Object.freeze({
        status: 'authenticated',
        user: Object.freeze({ ...user }),
      }) as AuthState

      const next = authReducer(frozen, { type: 'balance_updated', balanceCents: 25_000 })

      expect(next).not.toBe(frozen)
      expect(frozen).toEqual(authenticated)
    })

    it('ignora la acción si no hay sesión y devuelve el mismo estado', () => {
      const next = authReducer(anonymous, { type: 'balance_updated', balanceCents: 25_000 })

      expect(next).toBe(anonymous)
    })
  })
})
