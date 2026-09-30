import { createHash } from 'node:crypto'
import type { PaymentRequest, PaymentResponse } from '@snailbet/shared'
import { buildOutcomeResponse } from './payment-response.factory'
import type { PaymentRule } from './payment-rule.types'
import { PAYMENT_RULES } from './payment-rules'

export type ProcessedPayment = {
  response: PaymentResponse
  /** Regla que decidió el resultado; útil en logs. */
  ruleName: string
}

/**
 * Procesa un cobro ya validado: aplica la primera regla que coincide y construye la respuesta.
 * No conoce Express ni HTTP, por eso se prueba con llamadas directas.
 *
 * @throws {Error} si ninguna regla aplica; indica un error en la tabla (falta la regla final).
 */
export function processPayment(
  request: PaymentRequest,
  now: Date,
  rules: readonly PaymentRule[] = PAYMENT_RULES,
): ProcessedPayment {
  const rule = rules.find((candidate) => candidate.matches(request, now))
  if (!rule) {
    throw new Error('No payment rule matched; the rule table must end with a catch-all rule')
  }
  return { response: buildOutcomeResponse(request, rule.outcome, now), ruleName: rule.name }
}

/**
 * Huella de la petición para la idempotencia: dos peticiones con los mismos datos
 * producen la misma huella. Se guarda el hash en lugar de los datos para comparar
 * sin conservar una copia más de la tarjeta.
 *
 * El orden de las llaves es estable porque la petición viene del esquema de Zod,
 * que siempre devuelve los campos en el mismo orden.
 */
export function createRequestFingerprint(request: PaymentRequest): string {
  return createHash('sha256').update(JSON.stringify(request)).digest('hex')
}
