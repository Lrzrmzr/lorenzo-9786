import type {
  ApprovedStatusDetail,
  ErrorStatusDetail,
  PaymentRequest,
  RejectedStatusDetail,
} from '@snailbet/shared'

/**
 * Rechazos que puede decidir una regla. `invalid_request` e `idempotency_key_mismatch`
 * no están aquí porque los decide el controlador antes de evaluar las reglas.
 */
export type RuleRejectedStatusDetail = Exclude<
  RejectedStatusDetail,
  'invalid_request' | 'idempotency_key_mismatch'
>

/** Resultado de negocio de una regla, sin los datos de la respuesta (eso lo arma la factory). */
export type PaymentOutcome =
  | { status: 'approved'; status_detail: ApprovedStatusDetail }
  | { status: 'rejected'; status_detail: RuleRejectedStatusDetail }
  | { status: 'error'; status_detail: ErrorStatusDetail }

/**
 * Una fila de la tabla de escenarios (patrón Strategy):
 * una condición y el resultado que produce si se cumple.
 */
export type PaymentRule = {
  /** Nombre descriptivo; aparece en los logs y ayuda a depurar. */
  name: string
  /**
   * Indica si la regla aplica a la petición. Recibe la fecha actual como parámetro
   * para evaluar vencimientos sin depender del reloj real.
   */
  matches: (request: PaymentRequest, now: Date) => boolean
  outcome: PaymentOutcome
}
