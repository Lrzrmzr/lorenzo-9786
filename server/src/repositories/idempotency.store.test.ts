import type { PaymentResponse } from '@snailbet/shared'
import { describe, expect, it } from 'vitest'
import type { Clock } from '../config/clock'
import { InMemoryIdempotencyStore, type StoredPaymentResult } from './idempotency.store'

const TTL_MS = 1_000

/** Reloj que las pruebas pueden adelantar para simular el paso del tiempo. */
function createManualClock(start: Date) {
  let current = start.getTime()
  const clock: Clock = { now: () => new Date(current) }
  return {
    clock,
    advance: (ms: number) => {
      current += ms
    },
  }
}

const result: StoredPaymentResult = {
  fingerprint: 'abc123',
  statusCode: 201,
  response: { id: 'operacion-1' } as PaymentResponse,
}

describe('InMemoryIdempotencyStore', () => {
  it('devuelve undefined para una llave que no existe', async () => {
    const { clock } = createManualClock(new Date())
    const store = new InMemoryIdempotencyStore(clock, TTL_MS)

    expect(await store.get('no-existe')).toBeUndefined()
  })

  it('recupera el resultado guardado bajo una llave', async () => {
    const { clock } = createManualClock(new Date())
    const store = new InMemoryIdempotencyStore(clock, TTL_MS)

    await store.save('llave-1', result)

    expect(await store.get('llave-1')).toEqual(result)
  })

  it('conserva la llave hasta justo antes de expirar', async () => {
    const { clock, advance } = createManualClock(new Date())
    const store = new InMemoryIdempotencyStore(clock, TTL_MS)
    await store.save('llave-1', result)

    advance(TTL_MS - 1)

    expect(await store.get('llave-1')).toEqual(result)
  })

  it('olvida la llave cuando expira', async () => {
    const { clock, advance } = createManualClock(new Date())
    const store = new InMemoryIdempotencyStore(clock, TTL_MS)
    await store.save('llave-1', result)

    advance(TTL_MS)

    expect(await store.get('llave-1')).toBeUndefined()
  })
})
