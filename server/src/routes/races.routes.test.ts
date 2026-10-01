import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { createFixedClock } from '../config/clock'
import { loadConfig } from '../config/env'
import { silentLogger } from '../lib/logger'
import { InMemoryIdempotencyStore } from '../repositories/idempotency.store'

function buildApp(now: Date) {
  const clock = createFixedClock(now)
  return createApp({
    config: loadConfig({ NODE_ENV: 'test' }),
    clock,
    logger: silentLogger,
    idempotencyStore: new InMemoryIdempotencyStore(clock),
  })
}

describe('GET /api/races/daily-summary', () => {
  it('devuelve el resumen del día anterior según el reloj', async () => {
    const response = await request(buildApp(new Date('2026-09-30T12:00:00Z'))).get(
      '/api/races/daily-summary',
    )

    expect(response.status).toBe(200)
    expect(response.body.date).toBe('2026-09-29')
    expect(response.body.snails).toHaveLength(6)
    expect(response.body.races).toHaveLength(6)
  })

  it('permite que el navegador reutilice la respuesta unos minutos', async () => {
    const response = await request(buildApp(new Date('2026-09-30T12:00:00Z'))).get(
      '/api/races/daily-summary',
    )

    expect(response.headers['cache-control']).toBe('public, max-age=300')
  })
})
