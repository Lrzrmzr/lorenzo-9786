/** Convierte bytes a texto base64, para poder guardarlos como JSON. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

/** Convierte texto base64 de vuelta a bytes. */
export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

/**
 * Compara dos secuencias de bytes en tiempo constante.
 *
 * Una comparación normal se detiene en el primer byte distinto, así que tarda más
 * cuantos más bytes coinciden; midiendo ese tiempo, un atacante podría adivinar
 * un hash byte por byte. Esta función siempre recorre todos los bytes.
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false
  }
  let difference = 0
  for (let i = 0; i < a.length; i++) {
    difference |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return difference === 0
}
