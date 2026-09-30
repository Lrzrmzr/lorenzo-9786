import { describe, expect, it } from 'vitest'
import { loadConfig } from './env'

describe('loadConfig', () => {
  it('usa valores por defecto cuando no hay variables definidas', () => {
    expect(loadConfig({})).toEqual({
      nodeEnv: 'development',
      port: 3001,
      clientOrigins: ['http://localhost:5173'],
      snailpay: { forceOutage: false, timeoutDelayMs: 15_000, rateLimitPerMinute: 20 },
    })
  })

  it('convierte los textos del entorno a sus tipos', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      CLIENT_ORIGIN: 'https://app.example.com, http://localhost:5173',
      SNAILPAY_FORCE_OUTAGE: 'true',
      SNAILPAY_TIMEOUT_DELAY_MS: '500',
      PAYMENT_RATE_LIMIT_PER_MINUTE: '5',
    })

    expect(config).toEqual({
      nodeEnv: 'production',
      port: 8080,
      clientOrigins: ['https://app.example.com', 'http://localhost:5173'],
      snailpay: { forceOutage: true, timeoutDelayMs: 500, rateLimitPerMinute: 5 },
    })
  })

  it.each([
    ['true', true],
    ['1', true],
    ['false', false],
    ['0', false],
  ])('interpreta SNAILPAY_FORCE_OUTAGE="%s" como %s', (value, expected) => {
    expect(loadConfig({ SNAILPAY_FORCE_OUTAGE: value }).snailpay.forceOutage).toBe(expected)
  })

  it.each([
    ['PORT', 'abc'],
    ['PORT', '70000'],
    ['NODE_ENV', 'staging'],
    ['CLIENT_ORIGIN', 'no-es-una-url'],
    ['SNAILPAY_FORCE_OUTAGE', 'quizas'],
    ['SNAILPAY_TIMEOUT_DELAY_MS', '-1'],
    ['PAYMENT_RATE_LIMIT_PER_MINUTE', '0'],
  ])('rechaza %s=%s e indica la variable en el mensaje', (name, value) => {
    expect(() => loadConfig({ [name]: value })).toThrow(name)
  })
})
