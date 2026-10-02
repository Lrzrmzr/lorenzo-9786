import { describe, expect, it } from 'vitest'
import { base64ToBytes, bytesToBase64, constantTimeEqual } from './encoding'

describe('base64', () => {
  it('convierte bytes a base64 y de vuelta sin perder información', () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 254, 255])
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes)
  })

  it('produce base64 estándar', () => {
    expect(bytesToBase64(new TextEncoder().encode('caracol'))).toBe('Y2FyYWNvbA==')
  })
})

describe('constantTimeEqual', () => {
  it('devuelve true para secuencias iguales', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true)
  })

  it('devuelve false si difiere cualquier byte', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false)
  })

  it('devuelve false si las longitudes son distintas', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false)
  })
})
