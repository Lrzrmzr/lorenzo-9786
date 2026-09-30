import { randomInt, randomUUID } from 'node:crypto'
import type {
  ApprovedPaymentResponse,
  ErrorPaymentResponse,
  ErrorStatusDetail,
  PaymentFieldErrors,
  PaymentRequest,
  PaymentResponse,
  RejectedPaymentResponse,
  RejectedStatusDetail,
} from '@snailbet/shared'
import type { PaymentOutcome } from './payment-rule.types'

/** Sin 0/O ni 1/I: los códigos se leen o dictan sin confusiones. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const AUTHORIZATION_CODE_LENGTH = 6
const REFERENCE_SUFFIX_LENGTH = 4

/** Datos de la petición que se devuelven en la respuesta; `null` si no se pudieron leer. */
type PaymentEcho = {
  transaction_amount: number | null
  payer_id: string | null
  payer_email: string | null
  card_number: string | null
  security_code: string | null
}

type Identifiers = {
  id: string
  date_created: string
  reference: string
}

function randomCode(length: number): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET.charAt(randomInt(CODE_ALPHABET.length))
  }
  return code
}

/** Identificadores de la operación. `reference` usa la fecha UTC: `SNP-AAAAMMDD-XXXX`. */
function createIdentifiers(now: Date): Identifiers {
  const datePart = now.toISOString().slice(0, 10).replaceAll('-', '')
  return {
    id: randomUUID(),
    date_created: now.toISOString(),
    reference: `SNP-${datePart}-${randomCode(REFERENCE_SUFFIX_LENGTH)}`,
  }
}

function echoFromRequest(request: PaymentRequest): PaymentEcho {
  return {
    transaction_amount: request.transaction_amount,
    payer_id: request.payer_id,
    payer_email: request.payer_email,
    card_number: request.card_number,
    security_code: request.security_code,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key]
  return typeof value === 'string' ? value : null
}

/**
 * Extrae lo que se pueda de un cuerpo que no pasó la validación (o que ni se validó).
 * Cada campo se devuelve solo si tiene el tipo esperado; si no, `null`.
 */
function echoFromUnknownBody(body: unknown): PaymentEcho {
  if (!isRecord(body)) {
    return {
      transaction_amount: null,
      payer_id: null,
      payer_email: null,
      card_number: null,
      security_code: null,
    }
  }
  const amount = body.transaction_amount
  return {
    transaction_amount: typeof amount === 'number' && Number.isFinite(amount) ? amount : null,
    payer_id: readString(body, 'payer_id'),
    payer_email: readString(body, 'payer_email'),
    card_number: readString(body, 'card_number'),
    security_code: readString(body, 'security_code'),
  }
}

/*
 * Los objetos se escriben con los campos en el orden de la tabla del contrato,
 * para que las respuestas sean fáciles de leer y comparar.
 */

function approvedResponse(request: PaymentRequest, now: Date): ApprovedPaymentResponse {
  const { id, date_created, reference } = createIdentifiers(now)
  return {
    id,
    status: 'approved',
    status_detail: 'accredited',
    transaction_amount: request.transaction_amount,
    date_created,
    authorization_code: randomCode(AUTHORIZATION_CODE_LENGTH),
    reference,
    payer_id: request.payer_id,
    payer_email: request.payer_email,
    card_number: request.card_number,
    security_code: request.security_code,
  }
}

function rejectedResponse(
  echo: PaymentEcho,
  statusDetail: RejectedStatusDetail,
  now: Date,
  errors?: PaymentFieldErrors,
): RejectedPaymentResponse {
  const { id, date_created, reference } = createIdentifiers(now)
  return {
    id,
    status: 'rejected',
    status_detail: statusDetail,
    transaction_amount: echo.transaction_amount,
    date_created,
    authorization_code: null,
    reference,
    payer_id: echo.payer_id,
    payer_email: echo.payer_email,
    card_number: echo.card_number,
    security_code: echo.security_code,
    ...(errors && { errors }),
  }
}

function errorResponse(
  echo: PaymentEcho,
  statusDetail: ErrorStatusDetail,
  now: Date,
): ErrorPaymentResponse {
  const { id, date_created, reference } = createIdentifiers(now)
  return {
    id,
    status: 'error',
    status_detail: statusDetail,
    transaction_amount: echo.transaction_amount,
    date_created,
    authorization_code: null,
    reference,
    payer_id: echo.payer_id,
    payer_email: echo.payer_email,
    card_number: echo.card_number,
    security_code: echo.security_code,
  }
}

/**
 * Patrón Factory: único lugar que construye respuestas de la pasarela.
 * Garantiza que todas incluyan los campos del contrato con formatos consistentes,
 * y que el código de autorización solo exista en operaciones aprobadas.
 */
export function buildOutcomeResponse(
  request: PaymentRequest,
  outcome: PaymentOutcome,
  now: Date,
): PaymentResponse {
  switch (outcome.status) {
    case 'approved':
      return approvedResponse(request, now)
    case 'rejected':
      return rejectedResponse(echoFromRequest(request), outcome.status_detail, now)
    case 'error':
      return errorResponse(echoFromRequest(request), outcome.status_detail, now)
  }
}

/** 400: la petición no pasó la validación. */
export function buildInvalidRequestResponse(
  body: unknown,
  errors: PaymentFieldErrors,
  now: Date,
): RejectedPaymentResponse {
  return rejectedResponse(echoFromUnknownBody(body), 'invalid_request', now, errors)
}

/** 422: la llave de idempotencia ya se usó con datos distintos. */
export function buildIdempotencyMismatchResponse(
  request: PaymentRequest,
  now: Date,
): RejectedPaymentResponse {
  return rejectedResponse(echoFromRequest(request), 'idempotency_key_mismatch', now)
}

/** 503: caída simulada de la pasarela (se responde antes de validar la petición). */
export function buildServiceUnavailableResponse(body: unknown, now: Date): ErrorPaymentResponse {
  return errorResponse(echoFromUnknownBody(body), 'service_unavailable', now)
}
