import type { ApprovedPaymentResponse, PaymentResponse } from '@snailbet/shared'
import { toCents } from '../../../lib/money'
import { userRepository } from '../../auth/repositories/user.repository'
import { paymentRepository } from '../repositories/payment.repository'

export type CreditResult =
  | { ok: true; balanceCents: number }
  | { ok: false; reason: 'user_not_found' | 'storage_unavailable' }

export type PaymentsServiceDeps = {
  now: () => Date
}

const defaultDeps: PaymentsServiceDeps = { now: () => new Date() }

/** Historial de pagos y acreditación del saldo. */
export function createPaymentsService(deps: PaymentsServiceDeps = defaultDeps) {
  return {
    /**
     * Guarda la respuesta en el historial. Si el navegador no permite guardar, el pago
     * sigue su curso: perder una entrada del historial no debe bloquear la recarga.
     * Conserva la marca de acreditado si la respuesta ya estaba guardada.
     */
    record(userId: string, idempotencyKey: string, response: PaymentResponse): void {
      try {
        const stored = paymentRepository.findById(response.id)
        paymentRepository.save({
          userId,
          idempotencyKey,
          recordedAt: stored?.recordedAt ?? deps.now().toISOString(),
          credited: stored?.credited ?? false,
          response,
        })
      } catch {
        // Ver comentario de la función.
      }
    },

    /**
     * Suma el monto de un pago aprobado al saldo, una sola vez por `id` de operación.
     * Si la pasarela repite la misma respuesta (reintento con la misma llave), devuelve
     * el saldo actual sin volver a sumar.
     *
     * El saldo se lee de nuevo del almacenamiento y no del estado de React, para no partir
     * de un valor desactualizado. Los montos se suman en centavos enteros.
     */
    creditApproved(
      userId: string,
      idempotencyKey: string,
      payment: ApprovedPaymentResponse,
    ): CreditResult {
      const user = userRepository.findById(userId)
      if (!user) {
        return { ok: false, reason: 'user_not_found' }
      }

      const stored = paymentRepository.findById(payment.id)
      if (stored?.credited) {
        return { ok: true, balanceCents: user.balanceCents }
      }

      const balanceCents = user.balanceCents + toCents(payment.transaction_amount)
      try {
        // Limitación conocida: son dos escrituras separadas en localStorage. Con una base de
        // datos irían en una sola transacción.
        userRepository.save({ ...user, balanceCents })
        paymentRepository.save({
          userId,
          idempotencyKey,
          recordedAt: stored?.recordedAt ?? deps.now().toISOString(),
          credited: true,
          response: payment,
        })
      } catch {
        return { ok: false, reason: 'storage_unavailable' }
      }
      return { ok: true, balanceCents }
    },
  }
}

export type PaymentsService = ReturnType<typeof createPaymentsService>

export const paymentsService = createPaymentsService()
