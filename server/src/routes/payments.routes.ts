import { Router } from 'express'
import {
  createPaymentsController,
  type PaymentsControllerDeps,
} from '../controllers/payments.controller'
import { createPaymentRateLimiter } from '../middleware/rate-limit'

export function createPaymentsRouter(deps: PaymentsControllerDeps): Router {
  const router = Router()

  router.post(
    '/',
    createPaymentRateLimiter(deps.config.rateLimitPerMinute),
    createPaymentsController(deps),
  )

  return router
}
