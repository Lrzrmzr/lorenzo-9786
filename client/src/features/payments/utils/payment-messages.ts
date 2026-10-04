import type { DeclineReason } from '../types'

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`)
}

/**
 * Mensajes de rechazo de negocio mostrados al usuario.
 *
 * `invalid_request` e `idempotency_key_mismatch` no llegan aquí:
 * tienen resultados específicos en `TopUpResult`.
 */
export function declineMessage(reason: DeclineReason): string {
  switch (reason) {
    case 'invalid_security_code':
      return 'El código de seguridad no es correcto.'

    case 'invalid_expiration_date':
      return 'La fecha de vencimiento no coincide con la tarjeta.'

    case 'card_expired':
      return 'La tarjeta está vencida.'

    case 'insufficient_funds':
      return 'La tarjeta no tiene fondos suficientes.'

    case 'card_reported_lost':
      return 'Esta tarjeta fue reportada como extraviada. Usa otra tarjeta.'

    case 'high_risk_blocked':
      return 'No pudimos aprobar esta operación por seguridad. Intenta con otra tarjeta.'

    case 'card_not_recognized':
      return 'No reconocemos esta tarjeta. Revisa el número.'

    default:
      return assertNever(reason)
  }
}

export const PAYMENT_FAILED_MESSAGE = 'No pudimos procesar tu recarga. Tu saldo no fue modificado.'

export const IDEMPOTENCY_CONFLICT_MESSAGE =
  'No pudimos procesar tu recarga. Tu saldo no fue modificado. Inténtalo de nuevo.'

export const RATE_LIMITED_MESSAGE =
  'Hiciste demasiados intentos. Espera un minuto e inténtalo de nuevo.'

export function creditFailedMessage(reference: string): string {
  return `Tu pago fue aprobado (referencia ${reference}), pero no pudimos actualizar tu saldo en este navegador. No vuelvas a intentarlo; conserva la referencia para aclararlo.`
}
