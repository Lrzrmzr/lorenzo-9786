import {
  CLIENT_PAYMENT_TIMEOUT_MS,
  type PaymentRequest,
  type PaymentResponse,
  type RejectedPaymentResponse,
} from '@snailbet/shared'
import { fetchWithTimeout, TimeoutError } from '../../../lib/http'
import type { DeclinedPaymentResponse, TopUpResult } from '../types'
import { paymentResponseSchema } from './payment-response.schema'

const PAYMENTS_URL = '/api/snailpay/payments'

function isDeclined(payment: RejectedPaymentResponse): payment is DeclinedPaymentResponse {
  return (
    payment.status_detail !== 'invalid_request' &&
    payment.status_detail !== 'idempotency_key_mismatch'
  )
}

/** `null` si el cuerpo no es JSON o no tiene la forma del contrato. */
async function readPayment(response: Response): Promise<PaymentResponse | null> {
  try {
    const result = paymentResponseSchema.safeParse(await response.json())
    return result.success ? result.data : null
  } catch {
    return null
  }
}

/** Traduce una respuesta HTTP al resultado del dominio, comprobando que código y cuerpo coincidan. */
function toResult(httpStatus: number, payment: PaymentResponse | null): TopUpResult {
  switch (httpStatus) {
    case 201:
      if (payment?.status === 'approved') return { kind: 'approved', payment }
      if (payment?.status === 'rejected' && isDeclined(payment))
        return { kind: 'rejected', payment }
      break
    case 400:
      if (payment?.status === 'rejected' && payment.status_detail === 'invalid_request') {
        return { kind: 'invalid', payment, errors: payment.errors ?? {} }
      }
      break
    case 422:
      if (payment?.status === 'rejected' && payment.status_detail === 'idempotency_key_mismatch') {
        return { kind: 'idempotency_conflict', payment }
      }
      break
    case 503:
      if (payment?.status === 'error') return { kind: 'unavailable', payment }
      break
  }
  // Cualquier otra combinación es inesperada. Se trata como "no disponible": nunca se
  // acredita saldo con una respuesta que no se entiende, y se permite reintentar.
  return { kind: 'unavailable', payment: null }
}

/**
 * Patrón Adapter: único lugar que conoce el HTTP de SnailPay. Nunca lanza errores:
 * cualquier desenlace, incluidos el timeout y la falta de red, llega como `TopUpResult`.
 *
 * @param idempotencyKey UUID del intento; reutilizarlo al reintentar evita un cobro doble.
 */
export async function submitPayment(
  request: PaymentRequest,
  idempotencyKey: string,
  timeoutMs: number = CLIENT_PAYMENT_TIMEOUT_MS,
): Promise<TopUpResult> {
  let response: Response
  try {
    response = await fetchWithTimeout(PAYMENTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(request),
      timeoutMs,
    })
  } catch (error) {
    return error instanceof TimeoutError ? { kind: 'timeout' } : { kind: 'network_error' }
  }

  if (response.status === 429) {
    return { kind: 'rate_limited' }
  }
  return toResult(response.status, await readPayment(response))
}

/** La respuesta de la pasarela incluida en el resultado, si la hubo (para guardarla en el historial). */
export function getPaymentResponse(result: TopUpResult): PaymentResponse | null {
  return 'payment' in result ? result.payment : null
}
