/*
 * Máscaras de los campos de tarjeta. Solo dan formato mientras se escribe;
 * la validación la hace paymentRequestSchema.
 */

export const CARD_NUMBER_LENGTH = 16
export const SECURITY_CODE_LENGTH = 3

/** Conserva solo los dígitos, hasta `maxLength`. */
export function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength)
}

/** "1234123412341234" → "1234 1234 1234 1234". */
export function formatCardNumber(value: string): string {
  return digitsOnly(value, CARD_NUMBER_LENGTH).replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** "1226" → "12/26". La diagonal aparece al escribir el tercer dígito, para no estorbar al borrar. */
export function formatExpiration(value: string): string {
  const digits = digitsOnly(value, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

/** Solo los últimos 4 dígitos: "1234123412341234" → "•••• 1234". */
export function maskCardNumber(cardNumber: string): string {
  return `•••• ${cardNumber.replace(/\D/g, '').slice(-4)}`
}
