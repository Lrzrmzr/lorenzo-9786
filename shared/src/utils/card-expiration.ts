export type CardExpiration = {
  month: number
  year: number
}

const EXPIRATION_PATTERN = /^(0[1-9]|1[0-2])\/(\d{2})$/

/**
 * Convierte una fecha de vencimiento `MM/AA` en mes y año completo.
 * Devuelve `null` si el formato no es válido.
 */
export function parseExpiration(value: string): CardExpiration | null {
  const match = EXPIRATION_PATTERN.exec(value.trim())
  if (!match?.[1] || !match[2]) {
    return null
  }
  return { month: Number(match[1]), year: 2000 + Number(match[2]) }
}

/**
 * Indica si una tarjeta está vencida en la fecha dada.
 * Una tarjeta es válida hasta el último día de su mes de vencimiento.
 *
 * La fecha actual se recibe como parámetro (en lugar de usar `new Date()` internamente)
 * para que el resultado sea predecible en pruebas y no dependa del día en que se ejecuten.
 * Se compara en UTC para que servidor y pruebas den el mismo resultado sin importar la zona horaria.
 *
 * @throws {TypeError} si `expiration` no tiene formato `MM/AA`; se espera que ya haya sido validada.
 */
export function isCardExpired(expiration: string, now: Date): boolean {
  const parsed = parseExpiration(expiration)
  if (!parsed) {
    throw new TypeError(`Invalid card expiration format: "${expiration}"`)
  }

  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() + 1

  return currentYear > parsed.year || (currentYear === parsed.year && currentMonth > parsed.month)
}
