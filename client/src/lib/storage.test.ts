import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { readItem, removeItem, writeItem } from './storage'

const userSchema = z.object({ name: z.string(), balanceCents: z.number().int() })

beforeEach(() => {
  localStorage.clear()
})

describe('storage', () => {
  it('devuelve null si la llave no existe', () => {
    expect(readItem('users', userSchema)).toBeNull()
  })

  it('guarda y recupera un valor con el prefijo de la aplicación', () => {
    writeItem('users', { name: 'Ana', balanceCents: 1_000 })

    expect(readItem('users', userSchema)).toEqual({ name: 'Ana', balanceCents: 1_000 })
    expect(localStorage.getItem('snailbet:v1:users')).not.toBeNull()
  })

  it('descarta un valor que no es JSON válido', () => {
    localStorage.setItem('snailbet:v1:users', '{ esto no es json')

    expect(readItem('users', userSchema)).toBeNull()
  })

  it('descarta y borra un valor que no cumple el esquema', () => {
    localStorage.setItem(
      'snailbet:v1:users',
      JSON.stringify({ name: 'Ana', balanceCents: 'mucho' }),
    )

    expect(readItem('users', userSchema)).toBeNull()
    expect(localStorage.getItem('snailbet:v1:users')).toBeNull()
  })

  it('borra un valor', () => {
    writeItem('users', { name: 'Ana', balanceCents: 0 })
    removeItem('users')

    expect(readItem('users', userSchema)).toBeNull()
  })
})
