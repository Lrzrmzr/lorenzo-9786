import type { ApprovedPaymentResponse, ErrorPaymentResponse } from '@snailbet/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userRepository } from '../../auth/repositories/user.repository'
import type { StoredUser } from '../../auth/types'
import { paymentRepository } from '../repositories/payment.repository'
import { createPaymentsService } from './payments.service'

const NOW = new Date('2026-10-03T12:00:00.000Z')
const KEY = '11111111-1111-4111-8111-111111111111'

const user: StoredUser = {
  id: '3f1c9a52-8d4e-4b7a-9c2f-5e6d7a8b9c0d',
  name: 'Ana López',
  email: 'ana.lopez@example.com',
  password: { algorithm: 'PBKDF2-SHA256', iterations: 1000, salt: 'c2FsdA==', hash: 'aGFzaA==' },
  balanceCents: 10_000,
  createdAt: '2026-10-01T12:00:00.000Z',
}

function approvedPayment(
  overrides: Partial<ApprovedPaymentResponse> = {},
): ApprovedPaymentResponse {
  return {
    id: '0b6f3f0e-7c1a-4f7e-9a51-2d4c8e1b9f33',
    status: 'approved',
    status_detail: 'accredited',
    transaction_amount: 250.5,
    date_created: NOW.toISOString(),
    authorization_code: 'K7Q2MX',
    reference: 'SNP-20261003-H4TZ',
    payer_id: user.id,
    payer_email: user.email,
    card_number: '1234123412341234',
    security_code: '543',
    ...overrides,
  }
}

const outage: ErrorPaymentResponse = {
  id: '5a0e8a52-1d0f-4a0e-8f0e-6b2d5c1e7a90',
  status: 'error',
  status_detail: 'service_unavailable',
  transaction_amount: 250,
  date_created: NOW.toISOString(),
  authorization_code: null,
  reference: 'SNP-20261003-9WPC',
  payer_id: user.id,
  payer_email: user.email,
  card_number: '4000000000000500',
  security_code: '123',
}

describe('paymentsService', () => {
  const service = createPaymentsService({ now: () => NOW })

  beforeEach(() => {
    localStorage.clear()
    userRepository.save(user)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('creditApproved', () => {
    it('adds the amount to the balance in cents and persists it', () => {
      const result = service.creditApproved(user.id, KEY, approvedPayment())

      expect(result).toEqual({ ok: true, balanceCents: 35_050 })
      expect(userRepository.findById(user.id)?.balanceCents).toBe(35_050)
    })

    it('credits the same payment id only once', () => {
      service.creditApproved(user.id, KEY, approvedPayment())
      const replay = service.creditApproved(user.id, KEY, approvedPayment())

      expect(replay).toEqual({ ok: true, balanceCents: 35_050 })
      expect(userRepository.findById(user.id)?.balanceCents).toBe(35_050)
    })

    it('credits different payments separately', () => {
      service.creditApproved(user.id, KEY, approvedPayment())
      const second = service.creditApproved(
        user.id,
        KEY,
        approvedPayment({ id: 'another-id', transaction_amount: 100 }),
      )

      expect(second).toEqual({ ok: true, balanceCents: 45_050 })
    })

    it('marks the payment as credited in the history', () => {
      service.creditApproved(user.id, KEY, approvedPayment())

      expect(paymentRepository.findById(approvedPayment().id)).toMatchObject({
        userId: user.id,
        idempotencyKey: KEY,
        credited: true,
      })
    })

    it('fails without changing anything when the user does not exist', () => {
      const result = service.creditApproved('missing-user', KEY, approvedPayment())

      expect(result).toEqual({ ok: false, reason: 'user_not_found' })
      expect(paymentRepository.findById(approvedPayment().id)).toBeNull()
    })

    it('reports storage_unavailable when the browser cannot save', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      })

      expect(service.creditApproved(user.id, KEY, approvedPayment())).toEqual({
        ok: false,
        reason: 'storage_unavailable',
      })
    })
  })

  describe('record', () => {
    it('stores every response in the history, including failures', () => {
      service.record(user.id, KEY, outage)

      expect(paymentRepository.listByUser(user.id)).toEqual([
        {
          userId: user.id,
          idempotencyKey: KEY,
          recordedAt: NOW.toISOString(),
          credited: false,
          response: outage,
        },
      ])
    })

    it('does not duplicate a replayed response nor lose its credited flag', () => {
      service.creditApproved(user.id, KEY, approvedPayment())
      service.record(user.id, KEY, approvedPayment())

      const history = paymentRepository.listByUser(user.id)
      expect(history).toHaveLength(1)
      expect(history[0]?.credited).toBe(true)
    })

    it('does not throw when the browser cannot save', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      })

      expect(() => service.record(user.id, KEY, outage)).not.toThrow()
    })
  })
})
