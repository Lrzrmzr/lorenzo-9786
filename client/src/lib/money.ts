/*
 * El dinero se maneja en centavos enteros. Los decimales de JavaScript no son exactos
 * (0.1 + 0.2 = 0.30000000000000004); los enteros sí, así que sumar saldos en centavos
 * nunca acumula errores.
 */

const MXN_FORMATTER = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

/** Convierte pesos (como los envía el API) a centavos enteros. */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`Invalid money amount: ${amount}`)
  }
  return Math.round(amount * 100)
}

/** Convierte centavos a pesos. */
export function fromCents(cents: number): number {
  return cents / 100
}

/** Formato de moneda mexicana: 125000 centavos → "$1,250.00". */
export function formatMoney(cents: number): string {
  return MXN_FORMATTER.format(fromCents(cents))
}
