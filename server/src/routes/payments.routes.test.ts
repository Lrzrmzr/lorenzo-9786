import { randomUUID } from 'node:crypto'
import { TEST_CARDS } from '@snailbet/shared'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { createFixedClock } from '../config/clock'
import { loadConfig } from '../config/env'
import { silentLogger, type Logger } from '../lib/logger'
import { InMemoryIdempotencyStore, type IdempotencyStore } from '../repositories/idempotency.store'

const ENDPOINT = '/api/snailpay/payments'
const NOW = new Date('2026-09-30T12:00:00.000Z')
const TEST_TIMEOUT_DELAY_MS = 30

type AppOptions = {
  env?: Record<string, string>
  now?: Date
  logger?: Logger
  idempotencyStore?: IdempotencyStore
}

function buildApp({
  env = {},
  now = NOW,
  logger = silentLogger,
  idempotencyStore,
}: AppOptions = {}) {
  const clock = createFixedClock(now)
  return createApp({
    config: loadConfig({
      NODE_ENV: 'test',
      SNAILPAY_TIMEOUT_DELAY_MS: String(TEST_TIMEOUT_DELAY_MS),
      ...env,
    }),
    clock,
    logger,
    idempotencyStore: idempotencyStore ?? new InMemoryIdempotencyStore(clock),
  })
}

const validBody = {
  card_number: TEST_CARDS.approved.number,
  expiration_date: TEST_CARDS.approved.expiration,
  security_code: TEST_CARDS.approved.cvv,
  cardholder_name: 'Ana López',
  transaction_amount: 250,
  payer_id: '3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d',
  payer_email: 'ana.lopez@example.com',
}

function pay(app: ReturnType<typeof buildApp>, body: object, idempotencyKey = randomUUID()) {
  return request(app).post(ENDPOINT).set('Idempotency-Key', idempotencyKey).send(body)
}

describe('POST /api/snailpay/payments: escenarios', () => {
  it('aprueba la tarjeta de éxito y devuelve el contrato completo', async () => {
    const response = await pay(buildApp(), validBody)

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 250,
      date_created: NOW.toISOString(),
      payer_id: validBody.payer_id,
      payer_email: validBody.payer_email,
      card_number: validBody.card_number,
      security_code: validBody.security_code,
    })
    expect(response.body.authorization_code).toMatch(/^[A-Z2-9]{6}$/)
    expect(response.body.reference).toMatch(/^SNP-20260930-/)
  })

  it.each([
    ['CVV incorrecto', { security_code: '999' }, 201, 'rejected', 'invalid_security_code'],
    ['fecha incorrecta', { expiration_date: '11/27' }, 201, 'rejected', 'invalid_expiration_date'],
    ['tarjeta vencida', { expiration_date: '01/25' }, 201, 'rejected', 'card_expired'],
    [
      'fondos insuficientes',
      { card_number: TEST_CARDS.insufficientFunds, expiration_date: '12/28' },
      201,
      'rejected',
      'insufficient_funds',
    ],
    [
      'tarjeta extraviada',
      { card_number: TEST_CARDS.reportedLost, expiration_date: '12/28' },
      201,
      'rejected',
      'card_reported_lost',
    ],
    [
      'alto riesgo',
      { card_number: TEST_CARDS.highRisk, expiration_date: '12/28' },
      201,
      'rejected',
      'high_risk_blocked',
    ],
    [
      'tarjeta desconocida',
      { card_number: '5555444433332222', expiration_date: '12/28' },
      201,
      'rejected',
      'card_not_recognized',
    ],
    [
      'error del sistema',
      { card_number: TEST_CARDS.systemError },
      503,
      'error',
      'service_unavailable',
    ],
  ])('%s → %i %s / %s', async (_case, override, httpStatus, status, statusDetail) => {
    const response = await pay(buildApp(), { ...validBody, ...override })

    expect(response.status).toBe(httpStatus)
    expect(response.body.status).toBe(status)
    expect(response.body.status_detail).toBe(statusDetail)
    expect(response.body.authorization_code).toBeNull()
  })

  it('sigue aprobando la tarjeta de éxito después de 12/26', async () => {
    const response = await pay(buildApp({ now: new Date('2027-03-01T00:00:00Z') }), validBody)

    expect(response.status).toBe(201)
    expect(response.body.status).toBe('approved')
  })

  it('responde 503 gateway_timeout después del retraso configurado', async () => {
    const startedAt = performance.now()

    const response = await pay(buildApp(), { ...validBody, card_number: TEST_CARDS.timeout })

    expect(performance.now() - startedAt).toBeGreaterThanOrEqual(TEST_TIMEOUT_DELAY_MS - 5)
    expect(response.status).toBe(503)
    expect(response.body.status_detail).toBe('gateway_timeout')
  })
})

describe('POST /api/snailpay/payments: validación', () => {
  it('responde 400 con errores por campo y el contrato completo', async () => {
    const response = await pay(buildApp(), {
      ...validBody,
      card_number: '1234',
      transaction_amount: 0,
    })

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      status: 'rejected',
      status_detail: 'invalid_request',
      authorization_code: null,
      payer_email: validBody.payer_email,
    })
    expect(Object.keys(response.body.errors)).toEqual(
      expect.arrayContaining(['card_number', 'transaction_amount']),
    )
  })

  it('responde 400 cuando falta el encabezado Idempotency-Key', async () => {
    const response = await request(buildApp()).post(ENDPOINT).send(validBody)

    expect(response.status).toBe(400)
    expect(response.body.errors.idempotency_key).toHaveLength(1)
  })

  it('responde 400 cuando el monto supera el máximo por recarga', async () => {
    const response = await pay(buildApp(), { ...validBody, transaction_amount: 60_000 })

    expect(response.status).toBe(400)
    expect(response.body.errors.transaction_amount).toEqual([
      'El monto máximo por recarga es $50,000',
    ])
  })
})

describe('POST /api/snailpay/payments: caída forzada', () => {
  it('responde 503 incluso con la tarjeta de éxito y nunca aprueba', async () => {
    const response = await pay(buildApp({ env: { SNAILPAY_FORCE_OUTAGE: 'true' } }), validBody)

    expect(response.status).toBe(503)
    expect(response.body).toMatchObject({
      status: 'error',
      status_detail: 'service_unavailable',
      authorization_code: null,
    })
  })
})

describe('POST /api/snailpay/payments: idempotencia', () => {
  it('devuelve la misma operación si se repite la petición con la misma llave', async () => {
    const app = buildApp()
    const key = randomUUID()

    const first = await pay(app, validBody, key)
    const retry = await pay(app, validBody, key)

    expect(retry.status).toBe(201)
    expect(retry.body.id).toBe(first.body.id)
    expect(retry.headers['idempotent-replayed']).toBe('true')
  })

  it('responde 422 si la llave se reutiliza con otros datos', async () => {
    const app = buildApp()
    const key = randomUUID()

    await pay(app, validBody, key)
    const conflict = await pay(app, { ...validBody, transaction_amount: 999 }, key)

    expect(conflict.status).toBe(422)
    expect(conflict.body.status_detail).toBe('idempotency_key_mismatch')
  })

  it('no guarda los errores del sistema: el reintento con la misma llave se procesa', async () => {
    const idempotencyStore = new InMemoryIdempotencyStore(createFixedClock(NOW))
    const key = randomUUID()

    const duringOutage = await pay(
      buildApp({ env: { SNAILPAY_FORCE_OUTAGE: 'true' }, idempotencyStore }),
      validBody,
      key,
    )
    const afterRecovery = await pay(buildApp({ idempotencyStore }), validBody, key)

    expect(duringOutage.status).toBe(503)
    expect(afterRecovery.status).toBe(201)
    expect(afterRecovery.body.status).toBe('approved')
  })
})

describe('POST /api/snailpay/payments: seguridad', () => {
  it('limita los cobros por minuto', async () => {
    const app = buildApp({ env: { PAYMENT_RATE_LIMIT_PER_MINUTE: '2' } })

    await pay(app, validBody)
    await pay(app, validBody)
    const third = await pay(app, validBody)

    expect(third.status).toBe(429)
    expect(third.body.error.code).toBe('too_many_requests')
  })

  it('nunca registra el número de tarjeta ni el CVV en los logs', async () => {
    const logger: Logger = { info: vi.fn(), error: vi.fn() }
    const app = buildApp({ logger })

    await pay(app, validBody)
    await pay(app, { ...validBody, card_number: TEST_CARDS.insufficientFunds })

    const everythingLogged = JSON.stringify([
      vi.mocked(logger.info).mock.calls,
      vi.mocked(logger.error).mock.calls,
    ])
    expect(everythingLogged).not.toContain(TEST_CARDS.approved.number)
    expect(everythingLogged).not.toContain(TEST_CARDS.insufficientFunds)
    expect(everythingLogged).not.toContain(`"${TEST_CARDS.approved.cvv}"`)
  })
})
