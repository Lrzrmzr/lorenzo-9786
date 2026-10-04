import type {
  ApprovedPaymentResponse,
  ErrorPaymentResponse,
  RejectedPaymentResponse,
} from '@snailbet/shared'
import { describe, expect, it } from 'vitest'
import type { DeclinedPaymentResponse, TopUpResult } from '../types'
import { shouldReuseIdempotencyKey } from './idempotency'

const common = {
  id: '0b6f3f0e-7c1a-4f7e-9a51-2d4c8e1b9f33',
  date_created: '2026-10-03T12:00:00.000Z',
  reference: 'SNP-20261003-H4TZ',
  transaction_amount: 250,
  payer_id: '3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d',
  payer_email: 'ana.lopez@example.com',
  card_number: '1234123412341234',
  security_code: '543',
}

const approved: ApprovedPaymentResponse = {
  ...common,
  status: 'approved',
  status_detail: 'accredited',
  authorization_code: 'K7Q2MX',
}
const declined: DeclinedPaymentResponse = {
  ...common,
  status: 'rejected',
  status_detail: 'insufficient_funds',
  authorization_code: null,
}
const invalid: RejectedPaymentResponse = {
  ...common,
  status: 'rejected',
  status_detail: 'invalid_request',
  authorization_code: null,
}
const conflict: RejectedPaymentResponse = { ...invalid, status_detail: 'idempotency_key_mismatch' }
const outage: ErrorPaymentResponse = {
  ...common,
  status: 'error',
  status_detail: 'service_unavailable',
  authorization_code: null,
}

describe('shouldReuseIdempotencyKey', () => {
  // Resultado definitivo: la pasarela ya decidió. El siguiente pago es otro intento, con llave nueva.
  it.each<[string, TopUpResult]>([
    ['approved', { kind: 'approved', payment: approved }],
    ['rejected', { kind: 'rejected', payment: declined }],
    ['invalid', { kind: 'invalid', payment: invalid, errors: {} }],
    ['idempotency_conflict', { kind: 'idempotency_conflict', payment: conflict }],
  ])('uses a new key after %s', (_kind, result) => {
    expect(shouldReuseIdempotencyKey(result)).toBe(false)
  })

  // Sin resultado definitivo: el reintento es el mismo intento. Con la misma llave, si el
  // servidor sí llegó a cobrar, devuelve ese cobro en lugar de hacer uno nuevo.
  it.each<[string, TopUpResult]>([
    ['unavailable with a response', { kind: 'unavailable', payment: outage }],
    ['unavailable without a response', { kind: 'unavailable', payment: null }],
    ['timeout', { kind: 'timeout' }],
    ['network_error', { kind: 'network_error' }],
    ['rate_limited', { kind: 'rate_limited' }],
  ])('reuses the key after %s', (_kind, result) => {
    expect(shouldReuseIdempotencyKey(result)).toBe(true)
  })
})
