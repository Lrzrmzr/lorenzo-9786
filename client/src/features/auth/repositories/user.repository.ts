import { z } from 'zod'
import { readItem, writeItem } from '../../../lib/storage'
import type { StoredUser } from '../types'

const passwordHashSchema = z.object({
  algorithm: z.literal('PBKDF2-SHA256'),
  iterations: z.number().int().positive(),
  salt: z.string().min(1),
  hash: z.string().min(1),
})

const storedUserSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.email(),
  password: passwordHashSchema,
  balanceCents: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
})

/** Usuarios indexados por correo: buscar por correo es la operación más frecuente (login). */
const usersSchema = z.record(z.string(), storedUserSchema)

type UsersByEmail = Record<string, StoredUser>

function readAll(): UsersByEmail {
  return readItem('users', usersSchema) ?? {}
}

/**
 * Patrón Repository: único lugar que sabe cómo y dónde se guardan los usuarios.
 * Con una base de datos, solo cambiaría este archivo.
 */
export const userRepository = {
  findByEmail(email: string): StoredUser | null {
    return readAll()[email] ?? null
  },

  findById(id: string): StoredUser | null {
    return Object.values(readAll()).find((user) => user.id === id) ?? null
  },

  /** Crea o reemplaza un usuario. */
  save(user: StoredUser): void {
    writeItem('users', { ...readAll(), [user.email]: user })
  },
}
