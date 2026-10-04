import { notifications } from '@mantine/notifications'
import { useCallback, useRef, useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { paymentsService } from '../services/payments.service'
import type { TopUpFormValues, TopUpState } from '../types'
import { getPaymentResponse, submitPayment } from '../api/snailpay.client'
import {
  creditFailedMessage,
  declineMessage,
  IDEMPOTENCY_CONFLICT_MESSAGE,
  PAYMENT_FAILED_MESSAGE,
  RATE_LIMITED_MESSAGE,
} from '../utils/payment-messages'
import { shouldReuseIdempotencyKey } from '../utils/idempotency'

function assertNever(value: never): never {
  throw new Error(`Unhandled payment result: ${String(value)}`)
}

export function useTopUp(): {
  state: TopUpState
  submit: (values: TopUpFormValues) => Promise<void>
  reset: () => void
} {
  const { state: authState, updateBalance } = useAuth()
  const user = authState.status === 'authenticated' ? authState.user : null

  const [state, setState] = useState<TopUpState>({ status: 'idle' })
  const processingRef = useRef(false)
  const keyRef = useRef<string | null>(null)

  const submit = useCallback(
    async (values: TopUpFormValues): Promise<void> => {
      if (!user || processingRef.current) return

      processingRef.current = true

      const key = keyRef.current ?? crypto.randomUUID()
      keyRef.current = key
      setState({ status: 'processing' })

      try {
        const result = await submitPayment(
          {
            ...values,
            payer_id: user.id,
            payer_email: user.email,
          },
          key,
        )

        keyRef.current = shouldReuseIdempotencyKey(result) ? key : null

        const payment = getPaymentResponse(result)
        if (payment !== null) {
          paymentsService.record(user.id, key, payment)
        }

        switch (result.kind) {
          case 'approved': {
            const credit = paymentsService.creditApproved(user.id, key, result.payment)

            if (!credit.ok) {
              setState({
                status: 'failed',
                message: creditFailedMessage(result.payment.reference),
                retryable: false,
              })
              return
            }

            updateBalance(credit.balanceCents)

            notifications.show({
              title: 'Recarga aprobada',
              message: `Código de autorización: ${result.payment.authorization_code}. Referencia: ${result.payment.reference}.`,
            })

            setState({
              status: 'approved',
              payment: result.payment,
              balanceCents: credit.balanceCents,
            })
            return
          }

          case 'rejected':
            setState({
              status: 'declined',
              message: declineMessage(result.payment.status_detail),
            })
            return

          case 'invalid':
            setState({
              status: 'invalid',
              errors: result.errors,
            })
            return

          case 'idempotency_conflict':
            setState({
              status: 'failed',
              message: IDEMPOTENCY_CONFLICT_MESSAGE,
              retryable: true,
            })
            return

          case 'rate_limited':
            setState({
              status: 'failed',
              message: RATE_LIMITED_MESSAGE,
              retryable: true,
            })
            return

          case 'unavailable':
          case 'timeout':
          case 'network_error':
            setState({
              status: 'failed',
              message: PAYMENT_FAILED_MESSAGE,
              retryable: true,
            })
            return

          default:
            return assertNever(result)
        }
      } finally {
        processingRef.current = false
      }
    },
    [user, updateBalance],
  )

  const reset = useCallback(() => {
    processingRef.current = false
    keyRef.current = null
    setState({ status: 'idle' })
  }, [])

  return { state, submit, reset }
}
