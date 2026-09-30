import type { PaymentResponse } from '@snailbet/shared'
import type { Clock } from '../config/clock'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/** Resultado definitivo de un cobro, guardado bajo su llave de idempotencia. */
export type StoredPaymentResult = {
  fingerprint: string
  statusCode: number
  response: PaymentResponse
}

/**
 * Patrón Repository: aísla dónde se guardan las llaves de idempotencia.
 * Los métodos son asíncronos aunque la implementación en memoria no lo necesite,
 * para que una implementación con Redis o base de datos no obligue a cambiar a quien la usa.
 */
export interface IdempotencyStore {
  get(key: string): Promise<StoredPaymentResult | undefined>
  save(key: string, result: StoredPaymentResult): Promise<void>
}

type Entry = {
  result: StoredPaymentResult
  expiresAt: number
}

/**
 * Implementación en memoria con expiración. Limitación conocida: se pierde al reiniciar
 * el servidor y no se comparte entre varias instancias; en producción se usaría Redis
 * o una restricción `UNIQUE` en base de datos.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  readonly #entries = new Map<string, Entry>()
  readonly #clock: Clock
  readonly #ttlMs: number

  constructor(clock: Clock, ttlMs: number = ONE_DAY_MS) {
    this.#clock = clock
    this.#ttlMs = ttlMs
  }

  async get(key: string): Promise<StoredPaymentResult | undefined> {
    const entry = this.#entries.get(key)
    if (!entry) return undefined

    if (entry.expiresAt <= this.#now()) {
      this.#entries.delete(key)
      return undefined
    }
    return entry.result
  }

  async save(key: string, result: StoredPaymentResult): Promise<void> {
    this.#removeExpired()
    this.#entries.set(key, { result, expiresAt: this.#now() + this.#ttlMs })
  }

  #now(): number {
    return this.#clock.now().getTime()
  }

  /** Evita que el mapa crezca sin límite con llaves que ya nadie consultará. */
  #removeExpired(): void {
    const now = this.#now()
    for (const [key, entry] of this.#entries) {
      if (entry.expiresAt <= now) this.#entries.delete(key)
    }
  }
}
