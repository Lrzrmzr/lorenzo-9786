import type {
  ErrorStatusDetail,
  PaymentFieldErrors,
  PaymentResponse,
  RejectedStatusDetail,
} from '@snailbet/shared'
import { z } from 'zod'

/*
 * La respuesta de la pasarela decide si se acredita dinero, así que se valida antes de usarla,
 * igual que los datos de localStorage. El historial guardado se valida con este mismo esquema.
 */

const REJECTED_DETAILS = [
  'invalid_request',
  'invalid_security_code',
  'invalid_expiration_date',
  'card_expired',
  'insufficient_funds',
  'card_reported_lost',
  'high_risk_blocked',
  'card_not_recognized',
  'idempotency_key_mismatch',
] as const satisfies readonly RejectedStatusDetail[]

const ERROR_DETAILS = [
  'service_unavailable',
  'gateway_timeout',
] as const satisfies readonly ErrorStatusDetail[]

const FIELD_ERROR_KEYS = [
  'card_number',
  'expiration_date',
  'security_code',
  'cardholder_name',
  'transaction_amount',
  'payer_id',
  'payer_email',
  'idempotency_key',
] as const satisfies readonly (keyof PaymentFieldErrors)[]

const base = {
  id: z.string().min(1),
  date_created: z.string().min(1),
  reference: z.string().min(1),
}

const nullableEcho = {
  transaction_amount: z.number().nullable(),
  payer_id: z.string().nullable(),
  payer_email: z.string().nullable(),
  card_number: z.string().nullable(),
  security_code: z.string().nullable(),
}

const approvedSchema = z.object({
  ...base,
  status: z.literal('approved'),
  status_detail: z.literal('accredited'),
  authorization_code: z.string().min(1),
  transaction_amount: z.number().positive(),
  payer_id: z.string(),
  payer_email: z.string(),
  card_number: z.string(),
  security_code: z.string(),
})

const rejectedSchema = z.object({
  ...base,
  ...nullableEcho,
  status: z.literal('rejected'),
  status_detail: z.enum(REJECTED_DETAILS),
  authorization_code: z.null(),
  errors: z.partialRecord(z.enum(FIELD_ERROR_KEYS), z.array(z.string())).optional(),
})

const errorSchema = z.object({
  ...base,
  ...nullableEcho,
  status: z.literal('error'),
  status_detail: z.enum(ERROR_DETAILS),
  authorization_code: z.null(),
})

/** El tipo anotado hace que TypeScript avise si el esquema y el contrato compartido divergen. */
export const paymentResponseSchema: z.ZodType<PaymentResponse> = z.discriminatedUnion('status', [
  approvedSchema,
  rejectedSchema,
  errorSchema,
])
