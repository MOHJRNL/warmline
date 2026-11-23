import { expect, test } from 'claude-code/testing'

import { cacheState, costs, parseTranscriptTail, suggest } from './cache'

const T0 = '2026-11-23T13:00:00.000Z'
const T0_MS = Date.parse(T0)

const line = (timestamp: string, usage: object, model = 'claude-opus-5-5') =>
  JSON.stringify({ type: 'assistant', timestamp, message: { model, usage } })

const write5m = (n: number) => ({ cache_creation_input_tokens: n, cache_creation: { ephemeral_5m_input_tokens: n, ephemeral_1h_input_tokens: 0 } })
const write1h = (n: number) => ({ cache_creation_input_tokens: n, cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: n } })

test('the last response is read from the tail, its TTL from its own write', () => {
  const text = [
    'a line the tail cut in half',
    line('2026-11-23T12:00:00.000Z', { input_tokens: 5, cache_read_input_tokens: 0, ...write1h(1000) }),
    JSON.stringify({ type: 'user', timestamp: T0, message: {} }),
    line(T0, { input_tokens: 2, cache_read_input_tokens: 90000, ...write5m(2693) }),
  ].join('\n')
  const s = parseTranscriptTail(text)!
  expect(s.at).toBe(T0_MS)
  expect(s.cacheRead).toBe(90000)
  expect(s.cacheWrite).toBe(2693)
  expect(s.ttl).toBe('5m')
})

test('a response that only read takes the TTL of the last write', () => {
  const text = [
    line('2026-11-23T12:00:00.000Z', { input_tokens: 5, cache_read_input_tokens: 0, ...write1h(1000) }),
    line(T0, { input_tokens: 2, cache_read_input_tokens: 90000, cache_creation_input_tokens: 0 }),
  ].join('\n')
  expect(parseTranscriptTail(text)!.ttl).toBe('1h')
})

test('a write without a TTL breakdown leaves the TTL unknown', () => {
  const text = line(T0, { input_tokens: 2, cache_read_input_tokens: 0, cache_creation_input_tokens: 500 })
  expect(parseTranscriptTail(text)!.ttl).toBe(null)
})

test('state, rebuild and keep-warm cost follow the clock and the price', () => {
  // 200k cached tokens on Opus 5.5 with a 5-minute TTL
  const s = parseTranscriptTail(line(T0, { input_tokens: 2, cache_read_input_tokens: 0, ...write5m(200000) }))!
  expect(s.ttl).toBe('5m')
  expect(cacheState(s, T0_MS + 60_000).kind).toBe('warm')
  expect(cacheState(s, T0_MS + 4 * 60_000 + 30_000).kind).toBe('cooling')
  expect(cacheState(s, T0_MS + 5 * 60_000).kind).toBe('cold')
  // rebuild: 200k x $5/MTok (5m write) = $1.00; keep-warm: 200k x $0.20/MTok (read) = $0.04
  const c = costs(s)
  expect(c.rebuildUsd).toBe(1)
  expect(c.keepUsd).toBe(0.04)
  expect(suggest(s, c.rebuildUsd)).toBe('handoff')
})
