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
   * Monto máximo por recarga. Es parte de la validación (400 con error en el campo),
   * no una regla de rechazo: los requisitos exigen que la tarjeta de éxito apruebe
   * cualquier cantidad válida, así que un monto aceptado nunca puede rechazarse por su tamaño.
   */
  maxAmount: 50_000,
} as const

/** Tiempo máximo que el cliente espera la respuesta de la pasarela antes de abortar. */
export const CLIENT_PAYMENT_TIMEOUT_MS = 10_000
