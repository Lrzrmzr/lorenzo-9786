import { describe, expect, it } from 'vitest'
import { PAYMENT_LIMITS, TEST_CARDS } from '../constants/payment.constants'
import { paymentRequestSchema, type PaymentRequestInput } from './payment.schema'

const validPayment: PaymentRequestInput = {
  card_number: TEST_CARDS.approved.number,
  expiration_date: TEST_CARDS.approved.expiration,
  security_code: TEST_CARDS.approved.cvv,
  cardholder_name: 'Ana López',
  transaction_amount: 250,
  payer_id: '3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d',
  payer_email: 'ana.lopez@example.com',
}

function invalidFields(input: unknown): string[] {
  const result = paymentRequestSchema.safeParse(input)
  if (result.success) return []
  return result.error.issues.map((issue) => issue.path.join('.'))
}

describe('paymentRequestSchema', () => {
  it('acepta los datos de la tarjeta de éxito', () => {
    expect(paymentRequestSchema.safeParse(validPayment).success).toBe(true)
  })

  it('elimina espacios y guiones del número de tarjeta', () => {
    const result = paymentRequestSchema.safeParse({
      ...validPayment,
      card_number: '1234 1234-1234 1234',
    })
    expect(result.data?.card_number).toBe('1234123412341234')
  })

  it.each([
    ['tarjeta con letras', { card_number: '1234abcd12341234' }, 'card_number'],
    ['tarjeta de 15 dígitos', { card_number: '123412341234123' }, 'card_number'],
    ['mes 13', { expiration_date: '13/26' }, 'expiration_date'],
    ['mes 00', { expiration_date: '00/26' }, 'expiration_date'],
    ['fecha sin diagonal', { expiration_date: '1226' }, 'expiration_date'],
    ['CVV de 2 dígitos', { security_code: '54' }, 'security_code'],
    ['CVV con letras', { security_code: '5a3' }, 'security_code'],
    ['titular vacío', { cardholder_name: '   ' }, 'cardholder_name'],
    ['monto cero', { transaction_amount: 0 }, 'transaction_amount'],
    ['monto negativo', { transaction_amount: -10 }, 'transaction_amount'],
    ['monto con 3 decimales', { transaction_amount: 10.005 }, 'transaction_amount'],
    ['monto como texto', { transaction_amount: '100' }, 'transaction_amount'],
    ['monto no numérico', { transaction_amount: Number.NaN }, 'transaction_amount'],
    [
      'monto mayor al máximo por recarga',
      { transaction_amount: PAYMENT_LIMITS.maxAmount + 0.01 },
      'transaction_amount',
    ],
    ['payer_id que no es UUID', { payer_id: '123' }, 'payer_id'],
    ['payer_email inválido', { payer_email: 'ana@' }, 'payer_email'],
  ])('rechaza %s', (_case, override, field) => {
    expect(invalidFields({ ...validPayment, ...override })).toContain(field)
  })

  it.each([0.01, 10.1, 10.5, 99.99])('acepta el monto %s con hasta dos decimales', (amount) => {
    expect(
      paymentRequestSchema.safeParse({ ...validPayment, transaction_amount: amount }).success,
    ).toBe(true)
  })

  it('acepta un titular con cualquier carácter porque el ejercicio solo exige que no esté vacío', () => {
    expect(
      paymentRequestSchema.safeParse({ ...validPayment, cardholder_name: 'Titular 123' }).success,
    ).toBe(true)
  })

  // Límite exacto: el máximo es válido; un centavo más ya no (ver la tabla de rechazos).
  it('acepta exactamente el monto máximo por recarga', () => {
    const result = paymentRequestSchema.safeParse({
      ...validPayment,
      transaction_amount: PAYMENT_LIMITS.maxAmount,
    })
    expect(result.success).toBe(true)
  })

  it('explica el monto máximo en el mensaje de error', () => {
    const result = paymentRequestSchema.safeParse({ ...validPayment, transaction_amount: 60_000 })
    expect(result.error?.issues[0]?.message).toBe('El monto máximo por recarga es $50,000')
  })

  // Decisión de diseño: el vencimiento es una regla de negocio que evalúa la pasarela
  // (`card_expired`); si el esquema la rechazara, ese escenario no sería reproducible.
  it('deja pasar una tarjeta vencida para que la rechace la pasarela', () => {
    const result = paymentRequestSchema.safeParse({ ...validPayment, expiration_date: '01/20' })
    expect(result.success).toBe(true)
  })
})
