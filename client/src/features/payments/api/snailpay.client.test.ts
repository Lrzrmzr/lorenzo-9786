import type { PaymentRequest } from '@snailbet/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimeoutError } from '../../../lib/http'
import type { TopUpResult } from '../types'
import { getPaymentResponse, submitPayment } from './snailpay.client'

const request: PaymentRequest = {
  card_number: '1234123412341234',
  expiration_date: '12/26',
  security_code: '543',
  cardholder_name: 'Ana López',
  transaction_amount: 250,
  payer_id: '3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d',
  payer_email: 'ana.lopez@example.com',
}

const KEY = '11111111-1111-4111-8111-111111111111'

const common = {
  id: '0b6f3f0e-7c1a-4f7e-9a51-2d4c8e1b9f33',
  date_created: '2026-09-30T18:04:11.532Z',
  reference: 'SNP-20260930-H4TZ',
  transaction_amount: 250,
  payer_id: request.payer_id,
  payer_email: request.payer_email,
  card_number: request.card_number,
  security_code: request.security_code,
}

const approved = {
  ...common,
  status: 'approved',
  status_detail: 'accredited',
  authorization_code: 'K7Q2MX',
}
const declined = {
  ...common,
  status: 'rejected',
  status_detail: 'insufficient_funds',
  authorization_code: null,
}
const invalid = {
  ...common,
  status: 'rejected',
  status_detail: 'invalid_request',
  authorization_code: null,
  errors: { card_number: ['El número de tarjeta debe tener 16 dígitos'] },
}
const conflict = {
  ...common,
  status: 'rejected',
  status_detail: 'idempotency_key_mismatch',
  authorization_code: null,
}
const outage = {
  ...common,
  status: 'error',
  status_detail: 'service_unavailable',
  authorization_code: null,
}

function respondWith(status: number, body: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }),
    )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('submitPayment', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the request as JSON with the Idempotency-Key header', async () => {
    const fetchMock = respondWith(201, approved)

    await submitPayment(request, KEY)

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('/api/snailpay/payments')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'Idempotency-Key': KEY,
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(init.body)).toEqual(request)
  })

  it.each<[TopUpResult['kind'], number, unknown]>([
    ['approved', 201, approved],
    ['rejected', 201, declined],
    ['invalid', 400, invalid],
    ['idempotency_conflict', 422, conflict],
    ['unavailable', 503, outage],
  ])('maps the response to %s', async (kind, status, body) => {
    respondWith(status, body)

    const result = await submitPayment(request, KEY)

    expect(result.kind).toBe(kind)
    expect(getPaymentResponse(result)).toEqual(body)
  })

  it('includes the field errors of a 400', async () => {
    respondWith(400, invalid)

    const result = await submitPayment(request, KEY)

    expect(result).toMatchObject({ kind: 'invalid', errors: invalid.errors })
  })

  it('maps 429 to rate_limited', async () => {
    respondWith(429, { error: 'Too many requests' })

    expect(await submitPayment(request, KEY)).toEqual({ kind: 'rate_limited' })
  })

  it('maps a timeout to timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TimeoutError(10)))

    expect(await submitPayment(request, KEY, 10)).toEqual({ kind: 'timeout' })
  })

  it('maps a failed connection to network_error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    expect(await submitPayment(request, KEY)).toEqual({ kind: 'network_error' })
  })

  describe('never credits an unexpected response', () => {
    it.each<[string, number, unknown]>([
      ['a body that is not JSON', 201, '<html>Bad gateway</html>'],
      ['a body with another shape', 201, { ok: true }],
      ['an approval with a status code that is not 201', 200, approved],
      ['an approval inside an error status', 503, approved],
      ['an unexpected server error', 500, { error: 'Internal error' }],
    ])('treats %s as unavailable', async (_case, status, body) => {
      respondWith(status, body)

      expect(await submitPayment(request, KEY)).toEqual({ kind: 'unavailable', payment: null })
    })
  })
})
