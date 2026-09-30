import { TEST_CARDS, type PaymentRequest } from '@snailbet/shared'
import { describe, expect, it } from 'vitest'
import type { PaymentOutcome } from './payment-rule.types'
import { PAYMENT_RULES } from './payment-rules'

const NOW = new Date('2026-09-30T12:00:00Z')
const AFTER_SUCCESS_CARD_EXPIRES = new Date('2027-01-15T12:00:00Z')

/** Fecha y CVV válidos para las tarjetas especiales, que aceptan cualquier dato no vencido. */
const FUTURE_EXPIRATION = '12/28'
const PAST_EXPIRATION = '01/25'
const ANY_CVV = '123'

const successRequest: PaymentRequest = {
  card_number: TEST_CARDS.approved.number,
  expiration_date: TEST_CARDS.approved.expiration,
  security_code: TEST_CARDS.approved.cvv,
  cardholder_name: 'Ana López',
  transaction_amount: 250,
  payer_id: '3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d',
  payer_email: 'ana.lopez@example.com',
}

function withCard(
  card_number: string,
  expiration_date = FUTURE_EXPIRATION,
  security_code = ANY_CVV,
) {
  return { ...successRequest, card_number, expiration_date, security_code }
}

/** Devuelve el resultado de la primera regla que aplica, igual que lo hará el servicio. */
function resolve(request: PaymentRequest, now = NOW): PaymentOutcome | undefined {
  return PAYMENT_RULES.find((rule) => rule.matches(request, now))?.outcome
}

describe('PAYMENT_RULES: tabla de escenarios', () => {
  it.each<[string, PaymentRequest, PaymentOutcome]>([
    [
      'la tarjeta de éxito con sus datos exactos',
      successRequest,
      { status: 'approved', status_detail: 'accredited' },
    ],
    [
      'la tarjeta de éxito con un CVV distinto',
      { ...successRequest, security_code: '999' },
      { status: 'rejected', status_detail: 'invalid_security_code' },
    ],
    [
      'la tarjeta de éxito con una fecha distinta no vencida',
      { ...successRequest, expiration_date: '11/27' },
      { status: 'rejected', status_detail: 'invalid_expiration_date' },
    ],
    [
      'la tarjeta de éxito con una fecha vencida',
      { ...successRequest, expiration_date: PAST_EXPIRATION },
      { status: 'rejected', status_detail: 'card_expired' },
    ],
    [
      'la tarjeta de fondos insuficientes',
      withCard(TEST_CARDS.insufficientFunds),
      { status: 'rejected', status_detail: 'insufficient_funds' },
    ],
    [
      'la tarjeta reportada como extraviada',
      withCard(TEST_CARDS.reportedLost),
      { status: 'rejected', status_detail: 'card_reported_lost' },
    ],
    [
      'la tarjeta de alto riesgo',
      withCard(TEST_CARDS.highRisk),
      { status: 'rejected', status_detail: 'high_risk_blocked' },
    ],
    [
      'la tarjeta de error del sistema',
      withCard(TEST_CARDS.systemError),
      { status: 'error', status_detail: 'service_unavailable' },
    ],
    [
      'la tarjeta de timeout',
      withCard(TEST_CARDS.timeout),
      { status: 'error', status_detail: 'gateway_timeout' },
    ],
    [
      'una tarjeta desconocida',
      withCard('5555444433332222'),
      { status: 'rejected', status_detail: 'card_not_recognized' },
    ],
  ])('%s', (_case, request, expected) => {
    expect(resolve(request)).toEqual(expected)
  })
})

describe('PAYMENT_RULES: orden de evaluación', () => {
  it('aprueba la tarjeta de éxito aunque la fecha actual ya sea posterior a 12/26', () => {
    expect(resolve(successRequest, AFTER_SUCCESS_CARD_EXPIRES)).toEqual({
      status: 'approved',
      status_detail: 'accredited',
    })
  })

  it('revisa el vencimiento antes que el motivo de rechazo de la tarjeta', () => {
    expect(resolve(withCard(TEST_CARDS.insufficientFunds, PAST_EXPIRATION))).toEqual({
      status: 'rejected',
      status_detail: 'card_expired',
    })
  })

  it('simula el error del sistema sin importar los demás datos', () => {
    expect(resolve(withCard(TEST_CARDS.systemError, PAST_EXPIRATION))).toEqual({
      status: 'error',
      status_detail: 'service_unavailable',
    })
  })

  it('simula el timeout sin importar los demás datos', () => {
    expect(resolve(withCard(TEST_CARDS.timeout, PAST_EXPIRATION))).toEqual({
      status: 'error',
      status_detail: 'gateway_timeout',
    })
  })

  it('nunca aprueba una tarjeta que no sea la de éxito', () => {
    const otherCards = [
      TEST_CARDS.insufficientFunds,
      TEST_CARDS.reportedLost,
      TEST_CARDS.highRisk,
      TEST_CARDS.systemError,
      TEST_CARDS.timeout,
      '5555444433332222',
    ]
    for (const card of otherCards) {
      expect(resolve(withCard(card))?.status).not.toBe('approved')
    }
  })
})

describe('PAYMENT_RULES: estructura de la tabla', () => {
  it('termina con una regla que aplica a cualquier petición, para que siempre haya resultado', () => {
    const lastRule = PAYMENT_RULES.at(-1)
    expect(lastRule?.matches(withCard('0000000000000000'), NOW)).toBe(true)
  })

  it('no repite nombres de reglas', () => {
    const names = PAYMENT_RULES.map((rule) => rule.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
