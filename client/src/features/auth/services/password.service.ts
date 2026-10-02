import type { PasswordHash } from '../types'
import { base64ToBytes, bytesToBase64, constantTimeEqual } from '../../../lib/encoding'

export const PBKDF2_ITERATIONS = 600_000

async function deriveHash(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  )
  return new Uint8Array(bits)
}

export async function hashPassword(
  password: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<PasswordHash> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hashBytes = await deriveHash(password, salt, iterations)
  return {
    algorithm: 'PBKDF2-SHA256',
    iterations,
    salt: bytesToBase64(salt),
    hash: bytesToBase64(hashBytes),
  }
}
export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  if (stored.algorithm !== 'PBKDF2-SHA256') {
    return false
  }
  const salt = base64ToBytes(stored.salt)

  const hashBytes = await deriveHash(password, salt, stored.iterations)

  const storedHashBytes = base64ToBytes(stored.hash)
  return constantTimeEqual(hashBytes, storedHashBytes)
}
