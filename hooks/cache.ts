import type { CacheSnapshot } from '../types'
import { config, priceFor } from './config'

type Ttl = '5m' | '1h'
const TTL_MS: Record<Ttl, number> = { '5m': 300_000, '1h': 3_600_000 }

/**
 * The last main-thread model response in a transcript tail, plus the TTL its
 * cache writes were given (the latest write's; a response that only read reuses it).
 * Lines are JSONL; the first line of a cut tail is partial and is skipped.
 */
export function parseTranscriptTail(text: string): CacheSnapshot | null {
  const lines = text.split('\n')
  let last: CacheSnapshot | null = null
  let ttl: Ttl | null = null

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i] ?? ''
    if (!line.includes('"type":"assistant"')) continue
    let row: any
    try {
      row = JSON.parse(line)
    } catch {
      continue
    }
    const usage = row.message?.usage
    if (row.isSidechain || !usage) continue

    const input = usage.input_tokens ?? 0
    const cacheRead = usage.cache_read_input_tokens ?? 0
    const cacheWrite = usage.cache_creation_input_tokens ?? 0
    if (last === null) {
      last = { at: Date.parse(row.timestamp), model: row.message.model ?? '', input, cacheRead, cacheWrite, ttl: null }
    }
    if (cacheWrite > 0) {
      // The shorter lifetime governs when both were written.
      const c = usage.cache_creation ?? {}
      if ((c.ephemeral_5m_input_tokens ?? 0) > 0) ttl = '5m'
      else if ((c.ephemeral_1h_input_tokens ?? 0) > 0) ttl = '1h'
      break
    }
  }
  if (last === null || Number.isNaN(last.at)) return null
  last.ttl = ttl
  return last
}

export type CacheKind = 'warm' | 'cooling' | 'cold' | 'unknown'

export function cacheState(s: CacheSnapshot, now: number): { kind: CacheKind; remainingMs: number | null } {
  if (!s.ttl) return { kind: 'unknown', remainingMs: null }
  const remainingMs = s.at + TTL_MS[s.ttl] - now
  if (remainingMs <= 0) return { kind: 'cold', remainingMs: 0 }
  if (remainingMs <= config.alertBeforeMs[s.ttl]) return { kind: 'cooling', remainingMs }
  return { kind: 'warm', remainingMs }
}

/** Tokens the cache holds for this prompt: what a cold rebuild would write again. */
export function cachedTokens(s: CacheSnapshot): number {
  return s.cacheRead + s.cacheWrite
}

export function contextTokens(s: CacheSnapshot): number {
  return s.input + s.cacheRead + s.cacheWrite
}

/** Rebuild (cache write at the detected TTL) and keep-warm (cache read) costs in USD; null without a price. */
export function costs(s: CacheSnapshot): { rebuildUsd: number | null; keepUsd: number | null } {
  const price = priceFor(s.model)
  if (!price) return { rebuildUsd: null, keepUsd: null }
  const keepUsd = (cachedTokens(s) * price.cacheRead) / 1e6
  if (!s.ttl) return { rebuildUsd: null, keepUsd }
  const write = s.ttl === '1h' ? price.cacheWrite1h : price.cacheWrite5m
  return { rebuildUsd: (cachedTokens(s) * write) / 1e6, keepUsd }
}

export type Suggestion = 'keep' | 'handoff' | 'none'

export function suggest(s: CacheSnapshot, rebuildUsd: number | null): Suggestion {
  const ctx = contextTokens(s)
  if ((rebuildUsd ?? 0) > config.rebuildThresholdUsd || ctx >= config.hugeContextTokens) return 'handoff'
  if (ctx >= config.largeContextTokens) return 'keep'
  return 'none'
}

export function mmss(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

export function usd(n: number): string {
  return `$${n.toFixed(4)}`
}
