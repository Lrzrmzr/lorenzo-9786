import { TEST_CARDS, type PaymentRequest } from '@snailbet/shared'
import { describe, expect, it } from 'vitest'
import {
  buildIdempotencyMismatchResponse,
  buildInvalidRequestResponse,
  buildOutcomeResponse,
  buildServiceUnavailableResponse,
} from './payment-response.factory'

const NOW = new Date('2026-09-30T15:30:00.000Z')

const request: PaymentRequest = {
  card_number: TEST_CARDS.approved.number,
  expiration_date: TEST_CARDS.approved.expiration,
  security_code: TEST_CARDS.approved.cvv,
  cardholder_name: 'Ana López',
  transaction_amount: 250.5,
  payer_id: '3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d',
  payer_email: 'ana.lopez@example.com',
}

/** Campos que exige el contrato, en el orden de la tabla del ejercicio, más la tarjeta y el CVV. */
const CONTRACT_FIELDS = [
  'id',
  'status',
  'status_detail',
  'transaction_amount',
  'date_created',
  'authorization_code',
  'reference',
  'payer_id',
  'payer_email',
  'card_number',
  'security_code',
]

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('buildOutcomeResponse', () => {
  it('construye una respuesta aprobada con todos los campos del contrato, en orden', () => {
    const response = buildOutcomeResponse(
      request,
      { status: 'approved', status_detail: 'accredited' },
      NOW,
    )

    expect(Object.keys(response)).toEqual(CONTRACT_FIELDS)
    expect(response).toMatchObject({
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 250.5,
      date_created: '2026-09-30T15:30:00.000Z',
      payer_id: request.payer_id,
      payer_email: request.payer_email,
      card_number: TEST_CARDS.approved.number,
      security_code: TEST_CARDS.approved.cvv,
    })
    expect(response.id).toMatch(UUID_PATTERN)
    expect(response.reference).toMatch(/^SNP-20260930-[A-Z2-9]{4}$/)
    expect(response.authorization_code).toMatch(/^[A-Z2-9]{6}$/)
  })

  it('no incluye código de autorización en un rechazo', () => {
    const response = buildOutcomeResponse(
      request,
      { status: 'rejected', status_detail: 'insufficient_funds' },
      NOW,
    )

    expect(Object.keys(response)).toEqual(CONTRACT_FIELDS)
    expect(response.status).toBe('rejected')
    expect(response.authorization_code).toBeNull()
  })

  it('no incluye código de autorización en un error del sistema', () => {
    const response = buildOutcomeResponse(
      request,
      { status: 'error', status_detail: 'service_unavailable' },
      NOW,
    )

    expect(response.status).toBe('error')
    expect(response.authorization_code).toBeNull()
  })

  it('genera identificadores distintos en cada operación', () => {
    const outcome = { status: 'approved', status_detail: 'accredited' } as const
    const first = buildOutcomeResponse(request, outcome, NOW)
    const second = buildOutcomeResponse(request, outcome, NOW)

    expect(first.id).not.toBe(second.id)
  })
})

describe('buildInvalidRequestResponse', () => {
  it('devuelve los datos con tipo correcto, null en los demás, y los errores por campo', () => {
    const body = {
      card_number: '1234',
      security_code: 543,
      transaction_amount: 'cien',
      payer_email: 'ana.lopez@example.com',
    }
    const errors = { card_number: ['El número de tarjeta debe tener 16 dígitos'] }

    const response = buildInvalidRequestResponse(body, errors, NOW)

    expect(response).toMatchObject({
      status: 'rejected',
      status_detail: 'invalid_request',
      authorization_code: null,
      card_number: '1234',
      security_code: null,
      transaction_amount: null,
      payer_id: null,
      payer_email: 'ana.lopez@example.com',
      errors,
    })
  })

  it('tolera un cuerpo que no es un objeto', () => {
    const response = buildInvalidRequestResponse('texto', {}, NOW)

    expect(response.card_number).toBeNull()
    expect(response.transaction_amount).toBeNull()
  })
})

describe('respuestas especiales', () => {
  it('marca el conflicto de idempotencia como rechazo', () => {
    const response = buildIdempotencyMismatchResponse(request, NOW)

    expect(response.status).toBe('rejected')
    expect(response.status_detail).toBe('idempotency_key_mismatch')
  })

  it('construye el error del sistema con todos los campos aunque el cuerpo esté vacío', () => {
    const response = buildServiceUnavailableResponse(undefined, NOW)

    expect(Object.keys(response)).toEqual(CONTRACT_FIELDS)
    expect(response).toMatchObject({
      status: 'error',
      status_detail: 'service_unavailable',
      authorization_code: null,
    })
  })
})
