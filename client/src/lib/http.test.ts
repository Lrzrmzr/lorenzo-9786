import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWithTimeout, TimeoutError } from './http'

/** Simula un `fetch` que nunca responde y solo termina si se cancela, como uno real. */
function hangingFetch() {
  return vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      const rejectAborted = () =>
        reject(new DOMException('The operation was aborted.', 'AbortError'))
      if (init?.signal?.aborted) {
        rejectAborted()
      }
      init?.signal?.addEventListener('abort', rejectAborted)
    })
  })
}

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns the response when it arrives in time', async () => {
    const response = new Response('ok')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    await expect(fetchWithTimeout('/api/x', { timeoutMs: 1000 })).resolves.toBe(response)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('throws TimeoutError when the deadline passes', async () => {
    vi.stubGlobal('fetch', hangingFetch())

    const request = fetchWithTimeout('/api/x', { timeoutMs: 1000 })
    const assertion = expect(request).rejects.toBeInstanceOf(TimeoutError)
    await vi.advanceTimersByTimeAsync(1000)

    await assertion
  })

  it('does not time out before the deadline', async () => {
    vi.stubGlobal('fetch', hangingFetch())

    const caller = new AbortController()
    const request = fetchWithTimeout('/api/x', { timeoutMs: 1000, signal: caller.signal })
    const assertion = expect(request).rejects.not.toBeInstanceOf(TimeoutError)
    await vi.advanceTimersByTimeAsync(999)
    caller.abort()

    await assertion
  })

  it('propagates a cancellation from the caller as AbortError, not TimeoutError', async () => {
    vi.stubGlobal('fetch', hangingFetch())

    const caller = new AbortController()
    const request = fetchWithTimeout('/api/x', { timeoutMs: 1000, signal: caller.signal })
    const assertion = expect(request).rejects.toMatchObject({ name: 'AbortError' })
    caller.abort()

    await assertion
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not send the request if the caller already cancelled', async () => {
    const fetchMock = hangingFetch()
    vi.stubGlobal('fetch', fetchMock)

    const caller = new AbortController()
    caller.abort()

    await expect(fetchWithTimeout('/api/x', { signal: caller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    })
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
  })
})
