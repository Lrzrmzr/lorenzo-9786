import { setTimeout as wait } from 'node:timers/promises'
import {
  paymentRequestSchema,
  type PaymentFieldErrors,
  type PaymentResponse,
} from '@snailbet/shared'
import type { RequestHandler, Response } from 'express'
import { z } from 'zod'
import type { Clock } from '../config/clock'
import type { SnailPayConfig } from '../config/env'
import type { Logger } from '../lib/logger'
import type { IdempotencyStore } from '../repositories/idempotency.store'
import {
  buildIdempotencyMismatchResponse,
  buildInvalidRequestResponse,
  buildServiceUnavailableResponse,
} from '../services/snailpay/payment-response.factory'
import { createRequestFingerprint, processPayment } from '../services/snailpay/snailpay.service'

export type PaymentsControllerDeps = {
  config: SnailPayConfig
  clock: Clock
  logger: Logger
  idempotencyStore: IdempotencyStore
}

const idempotencyKeySchema = z.uuid()

const IDEMPOTENCY_KEY_ERROR = 'El encabezado Idempotency-Key es obligatorio y debe ser un UUID'

function send(res: Response, statusCode: number, body: PaymentResponse): void {
  res.status(statusCode).json(body)
}

/** Aprobado o rechazado: la pasarela procesó la operación (201). Error: no pudo procesarla (503). */
function statusCodeFor(response: PaymentResponse): number {
  return response.status === 'error' ? 503 : 201
}

/**
 * POST /api/snailpay/payments
 *
 * Orden de evaluación:
 * 1. Caída forzada por configuración → 503, antes de leer nada más.
 * 2. Validación del encabezado Idempotency-Key y del cuerpo → 400 con errores por campo.
 * 3. Llave ya usada: mismos datos → respuesta guardada; datos distintos → 422.
 * 4. Tabla de reglas → 201 (aprobado o rechazado) o 503 (error del sistema o timeout).
 * 5. Solo los resultados definitivos (201) se guardan; un 503 permite reintentar con la misma llave.
 */
export function createPaymentsController({
  config,
  clock,
  logger,
  idempotencyStore,
}: PaymentsControllerDeps): RequestHandler {
  return async (req, res) => {
    const now = clock.now()

    if (config.forceOutage) {
      logger.info('payment_rejected_by_forced_outage')
      send(res, 503, buildServiceUnavailableResponse(req.body, now))
      return
    }

    const keyResult = idempotencyKeySchema.safeParse(req.get('Idempotency-Key'))
    const bodyResult = paymentRequestSchema.safeParse(req.body)

    if (!keyResult.success || !bodyResult.success) {
      const errors: PaymentFieldErrors = {
        ...(!bodyResult.success && z.flattenError(bodyResult.error).fieldErrors),
        ...(!keyResult.success && { idempotency_key: [IDEMPOTENCY_KEY_ERROR] }),
      }
      send(res, 400, buildInvalidRequestResponse(req.body, errors, now))
      return
    }

    const idempotencyKey = keyResult.data
    const request = bodyResult.data
    const fingerprint = createRequestFingerprint(request)

    const stored = await idempotencyStore.get(idempotencyKey)
    if (stored) {
      if (stored.fingerprint !== fingerprint) {
        send(res, 422, buildIdempotencyMismatchResponse(request, now))
        return
      }
      // Reintento de una operación ya resuelta: se devuelve el mismo resultado, sin cobrar de nuevo.
      res.set('Idempotent-Replayed', 'true')
      send(res, stored.statusCode, stored.response)
      return
    }

    const { response, ruleName } = processPayment(request, now)

    // El retraso se aplica aquí y no en la regla para que la tabla de reglas siga siendo pura.
    if (response.status_detail === 'gateway_timeout') {
      await wait(config.timeoutDelayMs)
    }

    const statusCode = statusCodeFor(response)
    if (response.status !== 'error') {
      await idempotencyStore.save(idempotencyKey, { fingerprint, statusCode, response })
    }

    // Solo identificadores y resultado: nunca datos de la tarjeta.
    logger.info('payment_processed', {
      paymentId: response.id,
      rule: ruleName,
      status: response.status,
      statusDetail: response.status_detail,
    })

    send(res, statusCode, response)
  }
}
