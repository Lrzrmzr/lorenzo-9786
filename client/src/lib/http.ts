/** Tiempo máximo por defecto para una petición; después se cancela. */
export const DEFAULT_TIMEOUT_MS = 10_000

/** La petición no respondió dentro del tiempo máximo. */
export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs} ms`)
    this.name = 'TimeoutError'
  }
}

export type FetchWithTimeoutInit = RequestInit & {
  /** Milisegundos antes de cancelar la petición. */
  timeoutMs?: number
}

/**
 * `fetch` con tiempo máximo. `fetch` por sí solo puede esperar indefinidamente;
 * aquí un AbortController la cancela al vencer el plazo.
 *
 * Distingue dos cancelaciones:
 * - Por tiempo: lanza `TimeoutError`, para que la interfaz ofrezca reintentar.
 * - Por quien llama (su propio `signal`, p. ej. al desmontar un componente): se propaga
 *   el `AbortError` original, que no es un fallo y normalmente se ignora.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...init }: FetchWithTimeoutInit = {},
): Promise<Response> {
  const controller = new AbortController()
  let timedOut = false

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  const abortFromCaller = () => controller.abort(signal?.reason)
  if (signal?.aborted) {
    abortFromCaller()
  } else {
    signal?.addEventListener('abort', abortFromCaller, { once: true })
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (timedOut) {
      throw new TimeoutError(timeoutMs)
    }
    throw error
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}
