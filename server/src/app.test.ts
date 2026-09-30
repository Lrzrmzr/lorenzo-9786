import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app'
import { createFixedClock } from './config/clock'
import { loadConfig } from './config/env'
import { silentLogger, type Logger } from './lib/logger'
import { errorHandler } from './middleware/error-handler'

const FIXED_NOW = new Date('2026-09-29T12:00:00.000Z')
const ALLOWED_ORIGIN = 'http://localhost:5173'

function buildApp() {
  return createApp({
    config: loadConfig({ NODE_ENV: 'test', CLIENT_ORIGIN: ALLOWED_ORIGIN }),
    clock: createFixedClock(FIXED_NOW),
    logger: silentLogger,
  })
}

describe('GET /api/health', () => {
  it('responde 200 con la hora del reloj inyectado', async () => {
    const response = await request(buildApp()).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', timestamp: FIXED_NOW.toISOString() })
  })
})

describe('seguridad', () => {
  it('agrega encabezados de seguridad y oculta la tecnología del servidor', async () => {
    const response = await request(buildApp()).get('/api/health')

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('permite peticiones desde el origen configurado', async () => {
    const response = await request(buildApp()).get('/api/health').set('Origin', ALLOWED_ORIGIN)

    expect(response.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN)
  })

  it('no autoriza orígenes desconocidos', async () => {
    const response = await request(buildApp())
      .get('/api/health')
      .set('Origin', 'https://sitio-malicioso.example')

    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })
})

describe('manejo de errores', () => {
  it('responde 404 en JSON para rutas inexistentes', async () => {
    const response = await request(buildApp()).get('/api/no-existe')

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('not_found')
  })

  it('responde 400 cuando el cuerpo no es JSON válido', async () => {
    const response = await request(buildApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"monto": ')

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('invalid_json')
  })

  it('responde 413 cuando el cuerpo supera el límite', async () => {
    const response = await request(buildApp())
      .post('/api/health')
      .send({ relleno: 'x'.repeat(20_000) })

    expect(response.status).toBe(413)
    expect(response.body.error.code).toBe('payload_too_large')
  })

  it('oculta el detalle de errores inesperados al cliente pero los registra', async () => {
    const logger: Logger = { info: vi.fn(), error: vi.fn() }
    const app = express()
    app.get('/falla', () => {
      throw new Error('detalle interno: conexión a 10.0.0.5 rechazada')
    })
    app.use(errorHandler(logger))

    const response = await request(app).get('/falla')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      error: { code: 'internal_error', message: 'Ocurrió un error inesperado' },
    })
    expect(JSON.stringify(response.body)).not.toContain('10.0.0.5')
    expect(logger.error).toHaveBeenCalledWith(
      'unhandled_error',
      expect.objectContaining({ message: 'detalle interno: conexión a 10.0.0.5 rechazada' }),
    )
  })
})
