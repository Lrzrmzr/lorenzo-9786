import type {
  ApprovedPaymentResponse,
  ErrorPaymentResponse,
  PaymentFieldErrors,
  PaymentRequest,
  RejectedPaymentResponse,
  RejectedStatusDetail,
} from '@snailbet/shared'

/** Datos que captura el formulario; `payer_id` y `payer_email` salen de la sesión. */
export type TopUpFormValues = Omit<PaymentRequest, 'payer_id' | 'payer_email'>

/**
 * Motivos de rechazo que se le explican al usuario. Los otros dos rechazos tienen su
 * propio resultado: `invalid_request` (errores por campo) y `idempotency_key_mismatch`.
 */
export type DeclineReason = Exclude<
  RejectedStatusDetail,
  'invalid_request' | 'idempotency_key_mismatch'
>

export type DeclinedPaymentResponse = RejectedPaymentResponse & { status_detail: DeclineReason }

/**
 * Resultado de un intento de cobro, ya traducido desde HTTP. El resto de la app no conoce
 * códigos de estado: solo esta unión, que obliga a manejar cada caso.
 */
export type TopUpResult =
  | { kind: 'approved'; payment: ApprovedPaymentResponse }
  | { kind: 'rejected'; payment: DeclinedPaymentResponse }
  | { kind: 'invalid'; payment: RejectedPaymentResponse; errors: PaymentFieldErrors }
  | { kind: 'idempotency_conflict'; payment: RejectedPaymentResponse }
  /** 503 o una respuesta que no se pudo interpretar (entonces `payment` es `null`). */
  | { kind: 'unavailable'; payment: ErrorPaymentResponse | null }
  /** 429: demasiados cobros por minuto; la pasarela no procesó la operación. */
  | { kind: 'rate_limited' }
  /** El cliente abortó tras el tiempo máximo; no se sabe si el servidor llegó a procesarla. */
  | { kind: 'timeout' }
  /** No hubo respuesta (sin conexión o servidor apagado). */
  | { kind: 'network_error' }

/** Estado del modal de recarga. */
export type TopUpState =
  | { status: 'idle' }
  | { status: 'processing' }
  | { status: 'approved'; payment: ApprovedPaymentResponse; balanceCents: number }
  /** Rechazo de negocio: alerta en terracota y el formulario se conserva para corregir. */
  | { status: 'declined'; message: string }
  /** 400: errores por campo devueltos por SnailPay. */
  | { status: 'invalid'; errors: PaymentFieldErrors }
  /**
   * Error del sistema, timeout, red, conflicto de llave o límite: alerta ámbar.
   * `retryable: false` oculta "Reintentar" cuando reintentar podría generar otro cobro
   * (pago aprobado cuyo saldo no se pudo guardar).
   */
  | { status: 'failed'; message: string; retryable: boolean }
