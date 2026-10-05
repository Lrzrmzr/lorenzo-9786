import { z } from 'zod'
import { PAYMENT_LIMITS } from '../constants/payment.constants'

export const CARDHOLDER_NAME_MAX_LENGTH = 80

/** Evita errores de punto flotante: 10.10 * 100 = 1009.9999999999999. */
function hasAtMostTwoDecimals(value: number): boolean {
  const cents = value * 100
  return Math.abs(cents - Math.round(cents)) < 1e-6
}

/**
 * Solo valida el formato de la tarjeta, no el algoritmo de Luhn:
 * la tarjeta de éxito que exigen los requisitos (1234123412341234) no lo cumple.
 * Acepta espacios o guiones entre grupos y los elimina.
 */
const cardNumberSchema = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\d{16}$/, 'El número de tarjeta debe tener 16 dígitos'))

const expirationDateSchema = z
  .string()
  .trim()
  .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usa el formato MM/AA con un mes entre 01 y 12')

const securityCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{3}$/, 'El CVV debe tener 3 dígitos')

/** Los requisitos piden aceptar cualquier nombre no vacío, por eso no se restringen caracteres. */
const cardholderNameSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa el nombre del titular')
  .max(
    CARDHOLDER_NAME_MAX_LENGTH,
    `El nombre no puede tener más de ${CARDHOLDER_NAME_MAX_LENGTH} caracteres`,
  )

const formattedMaxAmount = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
}).format(PAYMENT_LIMITS.maxAmount)

const transactionAmountSchema = z
  .number('Ingresa un monto válido')
  .positive('El monto debe ser mayor que cero')
  .max(PAYMENT_LIMITS.maxAmount, `El monto máximo por recarga es ${formattedMaxAmount}`)
  .refine(hasAtMostTwoDecimals, 'El monto admite como máximo dos decimales')

/**
 * Cuerpo de la petición de cobro. Usa snake_case igual que la respuesta,
 * para que todo el contrato HTTP tenga una sola convención de nombres.
 *
 * Valida formato y límites de la petición. Las reglas de negocio (vencimiento, tarjetas
 * rechazadas) las decide la pasarela, para que cada escenario sea reproducible desde la interfaz.
 */
export const paymentRequestSchema = z.object({
  card_number: cardNumberSchema,
  expiration_date: expirationDateSchema,
  security_code: securityCodeSchema,
  cardholder_name: cardholderNameSchema,
  transaction_amount: transactionAmountSchema,
  payer_id: z.uuid('Identificador de usuario inválido'),
  payer_email: z.email('Correo del pagador inválido'),
})

/** Datos tal como se envían (el número de tarjeta puede traer espacios). */
export type PaymentRequestInput = z.input<typeof paymentRequestSchema>
/** Datos ya validados y normalizados. */
export type PaymentRequest = z.output<typeof paymentRequestSchema>
