import type { PaymentRequest } from '../schemas/payment.schema'

/**
 * Estado general de la operación. Corresponde uno a uno con las tres categorías del contrato:
 * cobro exitoso, error de transacción y error del sistema.
 */
export type PaymentStatus = 'approved' | 'rejected' | 'error'

export type ApprovedStatusDetail = 'accredited'

export type RejectedStatusDetail =
  | 'invalid_request'
  | 'invalid_security_code'
  | 'invalid_expiration_date'
  | 'card_expired'
  | 'insufficient_funds'
  | 'card_reported_lost'
  | 'high_risk_blocked'
  | 'card_not_recognized'
  | 'idempotency_key_mismatch'

export type ErrorStatusDetail = 'service_unavailable' | 'gateway_timeout'

export type PaymentStatusDetail = ApprovedStatusDetail | RejectedStatusDetail | ErrorStatusDetail

/**
 * Errores de validación por campo; solo se envían con `status_detail: invalid_request`.
 * `idempotency_key` corresponde al encabezado `Idempotency-Key`, no al cuerpo.
 */
export type PaymentFieldErrors = Partial<Record<keyof PaymentRequest | 'idempotency_key', string[]>>

/** Campos que toda respuesta incluye, sin importar el resultado. */
type PaymentResponseBase = {
  /** UUID v4 de la operación. */
  id: string
  /** Fecha de creación en ISO 8601. */
  date_created: string
  /** Referencia legible con formato `SNP-AAAAMMDD-XXXX`. */
  reference: string
}

/**
 * Datos del pagador y de la tarjeta. En una operación no aprobada pueden ser `null`
 * cuando la petición llegó incompleta o mal formada.
 * La tarjeta y el CVV se devuelven por requisito del ejercicio; siempre son ficticios.
 */
type NullablePaymentEcho = {
  transaction_amount: number | null
  payer_id: string | null
  payer_email: string | null
  card_number: string | null
  security_code: string | null
}

export type ApprovedPaymentResponse = PaymentResponseBase & {
  status: 'approved'
  status_detail: ApprovedStatusDetail
  authorization_code: string
  transaction_amount: number
  payer_id: string
  payer_email: string
  card_number: string
  security_code: string
}

export type RejectedPaymentResponse = PaymentResponseBase &
  NullablePaymentEcho & {
    status: 'rejected'
    status_detail: RejectedStatusDetail
    authorization_code: null
    errors?: PaymentFieldErrors
  }

export type ErrorPaymentResponse = PaymentResponseBase &
  NullablePaymentEcho & {
    status: 'error'
    status_detail: ErrorStatusDetail
    authorization_code: null
  }

/**
 * Respuesta de la pasarela como unión discriminada por `status`:
 * al revisar `status`, TypeScript sabe qué campos existen y con qué tipo.
 */
export type PaymentResponse =
  ApprovedPaymentResponse | RejectedPaymentResponse | ErrorPaymentResponse
