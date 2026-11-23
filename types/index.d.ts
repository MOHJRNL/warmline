/** The last model response's cache usage, read from the session transcript. */
export type CacheSnapshot = {
  /** ms since epoch: the transcript line's timestamp of that response. */
  at: number
  model: string
  input: number
  cacheRead: number
  cacheWrite: number
  /** From `cache_creation.ephemeral_*`; null when the data does not say. */
  ttl: '5m' | '1h' | null
}

declare module 'claude-code' {
  interface PluginState {
    'warmline-band': {
      snapshot: CacheSnapshot | null
      now: number
      alertedAt: number | null
    }
  }
}
