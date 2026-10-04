import { describe, expect, it } from 'vitest'
import type { DeclineReason } from '../types'
import {
  creditFailedMessage,
  declineMessage,
  IDEMPOTENCY_CONFLICT_MESSAGE,
  PAYMENT_FAILED_MESSAGE,
  RATE_LIMITED_MESSAGE,
} from './payment-messages'

describe('declineMessage', () => {
  it.each<[DeclineReason, string]>([
    ['invalid_security_code', 'El código de seguridad no es correcto.'],
    ['invalid_expiration_date', 'La fecha de vencimiento no coincide con la tarjeta.'],
    ['card_expired', 'La tarjeta está vencida.'],
    ['insufficient_funds', 'La tarjeta no tiene fondos suficientes.'],
    ['card_reported_lost', 'Esta tarjeta fue reportada como extraviada. Usa otra tarjeta.'],
    [
      'high_risk_blocked',
      'No pudimos aprobar esta operación por seguridad. Intenta con otra tarjeta.',
    ],
    ['card_not_recognized', 'No reconocemos esta tarjeta. Revisa el número.'],
  ])('explains %s', (reason, message) => {
    expect(declineMessage(reason)).toBe(message)
  })
})

describe('generic messages', () => {
  it('tells the user the balance did not change when the payment could not be processed', () => {
    expect(PAYMENT_FAILED_MESSAGE).toBe(
      'No pudimos procesar tu recarga. Tu saldo no fue modificado.',
    )
  })

  it('defines the idempotency conflict and rate limit messages', () => {
    expect(IDEMPOTENCY_CONFLICT_MESSAGE.trim()).not.toBe('')
    expect(RATE_LIMITED_MESSAGE.trim()).not.toBe('')
  })

  it('includes the payment reference when the approval could not be credited', () => {
    expect(creditFailedMessage('SNP-20261003-H4TZ')).toContain('SNP-20261003-H4TZ')
  })
})
