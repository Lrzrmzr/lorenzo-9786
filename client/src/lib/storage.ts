import type { z } from 'zod'

/**
 * Prefijo con versión: si algún día cambia la forma de los datos, se sube a `v2`
 * y los datos viejos se ignoran en lugar de romper la aplicación.
 */
const KEY_PREFIX = 'snailbet:v1:'

export type StorageKey = 'users' | 'session' | 'payments' | 'login-attempts'

function fullKey(key: StorageKey): string {
  return `${KEY_PREFIX}${key}`
}

/**
 * Lee un valor de localStorage y lo valida con un esquema de Zod.
 *
 * localStorage es editable por cualquiera desde las herramientas del navegador, así que
 * su contenido se trata como datos externos: si no es JSON válido o no tiene la forma
 * esperada, se descarta y se devuelve `null` en lugar de romper la aplicación.
 * También devuelve `null` si el navegador bloquea el acceso (por ejemplo, en modo privado).
 */
export function readItem<T>(key: StorageKey, schema: z.ZodType<T>): T | null {
  try {
    const raw = localStorage.getItem(fullKey(key))
    if (raw === null) {
      return null
    }
    const result = schema.safeParse(JSON.parse(raw))
    if (!result.success) {
      localStorage.removeItem(fullKey(key))
      return null
    }
    return result.data
  } catch {
    return null
  }
}

/** Guarda un valor como JSON. Lanza un error si el navegador no permite guardarlo. */
export function writeItem<T>(key: StorageKey, value: T): void {
  localStorage.setItem(fullKey(key), JSON.stringify(value))
}

export function removeItem(key: StorageKey): void {
  try {
    localStorage.removeItem(fullKey(key))
  } catch {
    // Si el almacenamiento no está disponible, no hay nada que borrar.
  }
}
