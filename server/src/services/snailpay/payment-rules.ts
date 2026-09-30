import { isCardExpired, TEST_CARDS } from '@snailbet/shared'
import type { PaymentRule } from './payment-rule.types'

/** Tabla de escenarios de la pasarela. Se evalúa en orden y gana la primera regla que aplica */
export const PAYMENT_RULES: readonly PaymentRule[] = [
  {
    name: 'system_error_card',
    matches: (request) => request.card_number === TEST_CARDS.systemError,
    outcome: { status: 'error', status_detail: 'service_unavailable' },
  },
  {
    name: 'timeout_card',
    matches: (request) => request.card_number === TEST_CARDS.timeout,
    outcome: { status: 'error', status_detail: 'gateway_timeout' },
  },
  {
    name: 'approved_card',
    matches: (request) =>
      request.card_number === TEST_CARDS.approved.number &&
      request.expiration_date === TEST_CARDS.approved.expiration &&
      request.security_code === TEST_CARDS.approved.cvv,
    outcome: { status: 'approved', status_detail: 'accredited' },
  },
  {
    name: 'expired_card',
    matches: (request, now) => isCardExpired(request.expiration_date, now),
    outcome: { status: 'rejected', status_detail: 'card_expired' },
  },
  {
    name: 'invalid_cvv',
    matches: (request) =>
      request.card_number === TEST_CARDS.approved.number &&
      request.security_code !== TEST_CARDS.approved.cvv,
    outcome: { status: 'rejected', status_detail: 'invalid_security_code' },
  },
  {
    name: 'invalid_expiration_date',
    matches: (request) =>
      request.card_number === TEST_CARDS.approved.number &&
      request.expiration_date !== TEST_CARDS.approved.expiration,
    outcome: { status: 'rejected', status_detail: 'invalid_expiration_date' },
  },
  {
    name: 'reported_lost_card',
    matches: (request) => request.card_number === TEST_CARDS.reportedLost,
    outcome: { status: 'rejected', status_detail: 'card_reported_lost' },
  },
  {
    name: 'high_risk_card',
    matches: (request) => request.card_number === TEST_CARDS.highRisk,
    outcome: { status: 'rejected', status_detail: 'high_risk_blocked' },
  },
  {
    name: 'insufficient_funds_card',
    matches: (request) => request.card_number === TEST_CARDS.insufficientFunds,
    outcome: { status: 'rejected', status_detail: 'insufficient_funds' },
  },
  {
    name: 'unknown_card',
    matches: () => true,
    outcome: { status: 'rejected', status_detail: 'card_not_recognized' },
  },
]
