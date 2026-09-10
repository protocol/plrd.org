import type { OAuthSession } from '@atproto/oauth-client-browser'

export const LAB_AUTH_MAX_RESPONSE_BYTES = 1_048_576
export const LAB_AUTH_TIMEOUT_MS = 12_000
// Callers may tighten, but cannot disable or increase, the request deadline.
export type LabTransportOptions = { timeoutMs?: number }

// Credentials, token refresh and DPoP remain entirely inside the official SDK.
// Cap the response stream before XRPC's unconditional arrayBuffer(). The outer
// race also terminates when a custom transport ignores AbortSignal/cancellation.
export function boundedLabFetch(session: Pick<OAuthSession, 'fetchHandler'>, options: LabTransportOptions = {}): OAuthSession['fetchHandler'] {
  const timeoutMs = options.timeoutMs ?? LAB_AUTH_TIMEOUT_MS
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > LAB_AUTH_TIMEOUT_MS) throw new Error('Invalid bounded PDS request deadline.')
  return async (path, init) => {
    const controller = new AbortController()
    const signal = controller.signal
    const expires = performance.now() + timeoutMs
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    const timeout = () => controller.abort(new Error('PDS request deadline exceeded.'))
    const relayAbort = () => controller.abort(init?.signal?.reason)
    let onAbort: () => void
    const interrupted = new Promise<never>((_resolve, reject) => {
      onAbort = () => {
        // Never await cancellation: even a broken cancellation hook is bounded.
        void reader?.cancel(signal.reason).catch(() => {})
        reject(signal.reason)
      }
      signal.addEventListener('abort', onAbort, { once: true })
    })
    const timer = setTimeout(timeout, timeoutMs)
    init?.signal?.addEventListener('abort', relayAbort, { once: true })
    if (init?.signal?.aborted) relayAbort()
    function checkDeadline() {
      // A hot stream of empty chunks must not starve the timer indefinitely.
      if (performance.now() >= expires) timeout()
      signal.throwIfAborted()
    }
    const consume = async () => {
      checkDeadline()
      const response = await session.fetchHandler(path, { ...init, signal })
      if (signal.aborted) {
        void response.body?.cancel(signal.reason).catch(() => {})
        signal.throwIfAborted()
      }
      reader = response.body?.getReader()
      checkDeadline()
      if (Number(response.headers.get('content-length')) > LAB_AUTH_MAX_RESPONSE_BYTES) throw new Error('PDS response exceeds the 1 MiB limit.')
      const bytes = new Uint8Array(LAB_AUTH_MAX_RESPONSE_BYTES)
      let size = 0
      if (reader) while (true) {
        checkDeadline()
        const { done, value } = await reader.read()
        checkDeadline()
        if (done) break
        if (size + value.byteLength > LAB_AUTH_MAX_RESPONSE_BYTES) throw new Error('PDS response exceeds the 1 MiB limit.')
        bytes.set(value, size)
        size += value.byteLength
      }
      return new Response(response.body ? bytes.slice(0, size) : null, { status: response.status, statusText: response.statusText, headers: response.headers })
    }
    try { return await Promise.race([consume(), interrupted]) }
    catch (error) { controller.abort(error); throw error }
    finally {
      clearTimeout(timer)
      signal.removeEventListener('abort', onAbort!)
      init?.signal?.removeEventListener('abort', relayAbort)
    }
  }
}
