/**
 * Tarjetas ficticias que activan cada escenario de la pasarela simulada.
 * La tabla completa de escenarios está documentada en docs/.
 */
export const TEST_CARDS = {
  approved: { number: '1234123412341234', expiration: '12/26', cvv: '543' },
  insufficientFunds: '4000000000000002',
  reportedLost: '4000000000000119',
  highRisk: '4000000000000259',
  systemError: '4000000000000500',
  timeout: '4000000000000408',
} as const

export const PAYMENT_LIMITS = {
  /**
   * Tope técnico del esquema: por encima la petición se considera mal formada (400).
   * Es distinto del límite de negocio para que el rechazo `amount_exceeds_limit` sea alcanzable.
   */
  maxRequestAmount: 1_000_000,
  /** Límite de negocio: por encima la pasarela rechaza la operación (201 `rejected`). */
  maxApprovedAmount: 50_000,
} as const

/** Tiempo máximo que el cliente espera la respuesta de la pasarela antes de abortar. */
export const CLIENT_PAYMENT_TIMEOUT_MS = 10_000
