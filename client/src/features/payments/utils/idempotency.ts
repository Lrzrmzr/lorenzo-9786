import type { TopUpResult } from '../types'

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`)
}

/**
 * Conserva la misma llave cuando el resultado es incierto y el servidor pudo haber
 * procesado la operación. Para resultados definitivos se genera una llave nueva.
 */
export function shouldReuseIdempotencyKey(result: TopUpResult): boolean {
  switch (result.kind) {
    case 'approved':
    case 'rejected':
    case 'invalid':
    case 'idempotency_conflict':
      return false
    case 'unavailable':
    case 'rate_limited':
    case 'network_error':
    case 'timeout':
      return true
    default:
      return assertNever(result)
  }
}
