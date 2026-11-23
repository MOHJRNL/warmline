// Edit this file. Prices are USD per 1M tokens.
//
// Source: the claude-api skill's price table (cached 2026-11-03) and the cache
// multipliers in its prompt-caching notes: write 1.25x (5-minute TTL), 2x (1-hour TTL);
// read 0.1x, or 0.05x on Opus 5.5 / Sonnet 5.5 and 0.025x on Fable 5.2.
// Haiku 5.5's cache read is not listed; 0.01 is 0.1x of its input price (derived).
// Re-check against current pricing before trusting the dollar figures.

export type ModelPrice = {
  input: number
  cacheWrite5m: number
  cacheWrite1h: number
  cacheRead: number
}

export const pricing: Record<string, ModelPrice> = {
  'claude-opus-5-5': { input: 4, cacheWrite5m: 5, cacheWrite1h: 8, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, cacheWrite5m: 2.5, cacheWrite1h: 4, cacheRead: 0.1 },
  'claude-haiku-5-5': { input: 0.1, cacheWrite5m: 0.125, cacheWrite1h: 0.2, cacheRead: 0.01 },
  'claude-fable-5-2': { input: 8, cacheWrite5m: 10, cacheWrite1h: 16, cacheRead: 0.2 },
}

export const config = {
  /** Model that writes the handoff prompt when the person asks for it. */
  handoffModel: 'haiku',
  /** Suggest a new session when a rebuild would cost more than this (USD). */
  rebuildThresholdUsd: 0.5,
  /** Context (tokens) above which keeping it warm is worth suggesting. */
  largeContextTokens: 100_000,
  /** Context (tokens) above which a new session is suggested. */
  hugeContextTokens: 400_000,
  /** Toast and "cooling" start this long before cold, per TTL. */
  alertBeforeMs: { '5m': 60_000, '1h': 300_000 } as Record<'5m' | '1h', number>,
  keepWarmPrompt: 'Continue, and summarize where we are in one line.',
}

/** Price for a model id; a dated id (claude-x-y-20260101) matches its base id. */
export function priceFor(model: string): ModelPrice | null {
  const base = Object.keys(pricing)
    .filter(k => model === k || model.startsWith(k + '-'))
    .sort((a, b) => b.length - a.length)[0]
  return base ? (pricing[base] ?? null) : null
}
