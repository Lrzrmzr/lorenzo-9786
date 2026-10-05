import type { PaymentResponse } from '@snailbet/shared'
import { z } from 'zod'
import { readItem, writeItem } from '../../../lib/storage'
import { paymentResponseSchema } from '../api/payment-response.schema'

/** Respuesta de la pasarela tal como se guarda en el historial. */
export type StoredPayment = {
  userId: string
  idempotencyKey: string
  recordedAt: string
  /** `true` cuando el monto ya se sumó al saldo: evita acreditar dos veces el mismo `id`. */
  credited: boolean
  /**
   * Respuesta completa, incluidos tarjeta y CVV por requisito del proyecto.
   * En la interfaz siempre se muestran enmascarados.
   */
  response: PaymentResponse
}

const storedPaymentSchema = z.object({
  userId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  recordedAt: z.iso.datetime(),
  credited: z.boolean(),
  response: paymentResponseSchema,
})

const paymentsSchema = z.array(storedPaymentSchema)

function readAll(): StoredPayment[] {
  return readItem('payments', paymentsSchema) ?? []
}

/** Patrón Repository: único lugar que sabe cómo se guarda el historial de pagos. */
export const paymentRepository = {
  findById(paymentId: string): StoredPayment | null {
    return readAll().find((payment) => payment.response.id === paymentId) ?? null
  },

  /** Pagos del usuario, del más reciente al más antiguo. */
  listByUser(userId: string): StoredPayment[] {
    return readAll()
      .filter((payment) => payment.userId === userId)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
  },

  /**
   * Crea o reemplaza un pago según el `id` de la pasarela. Una respuesta repetida por
   * idempotencia trae el mismo `id`, así que no se duplica en el historial.
   */
  save(payment: StoredPayment): void {
    const others = readAll().filter((stored) => stored.response.id !== payment.response.id)
    writeItem('payments', [...others, payment])
  },
}
