import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { cacheState, cachedTokens, contextTokens, costs, mmss, parseTranscriptTail, suggest, usd } from './cache'
import { config, priceFor } from './config'
import { textFor, toLang } from './text'

const snapshot = atom({ plugin: 'warmline-band', key: 'snapshot' } as const, null)
const now = atom({ plugin: 'warmline-band', key: 'now' } as const, 0)
const alertedAt = atom({ plugin: 'warmline-band', key: 'alertedAt' } as const, null)

// Only the file watch lives here; nothing drawn does. A reload resets it and re-reads.
const TAIL_BYTES = 1_048_576
let transcriptPath: string | null = null
let seenSize = -1

// Token counts in thousands once large: 193801 -> 193.8k
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

// Reads the transcript's tail when its size changed since the last read.
async function refresh($: EngineInterface) {
  if (!transcriptPath) return
  // A new session has no transcript file until its first message; a throw here used to
  // stop the session.start tick and the per-second loop from ever being scheduled.
  let size: number
  try {
    ;({ size } = await $.fs.stat(transcriptPath))
  } catch {
    return
  }
  if (size === seenSize) return
  const offset = Math.max(0, size - TAIL_BYTES)
  const text = await $.fs.read(transcriptPath, { offset, length: size - offset })
  const s = parseTranscriptTail(text)
  if (s) await update($, snapshot, () => s)
  seenSize = size
}

async function tick($: EngineInterface, lang: ReturnType<typeof toLang>) {
  const t = await $.clock.now()
  await update($, now, () => t)
  await refresh($)

  const s = await read($, snapshot)
  if (!s) return
  const st = cacheState(s, t)
  if (st.kind !== 'cooling' && st.kind !== 'cold') return
  if ((await read($, alertedAt)) === s.at) return
  await update($, alertedAt, () => s.at)

  const tx = textFor(lang)
  const { rebuildUsd } = costs(s)
  const head = st.kind === 'cold' ? tx.toastCold : tx.toastCooling(mmss(st.remainingMs ?? 0))
  $.ui.toast(`${head} ${tx.suggestion[suggest(s, rebuildUsd)]}`)
}

// Builds a handoff prompt from the session's last rows, on the person's press.
async function copyHandoff($: EngineInterface, lang: ReturnType<typeof toLang>) {
  const rows = (await $.session.messages()).slice(-16)
  const excerpt = rows.map(r => `${r.role}: ${(r.text ?? '').slice(0, 1500)}`).join('\n')
  const r = await $.model.complete({
    model: config.handoffModel,
    effort: 'low',
    prompt:
      'Below is the end of a coding session. Write a handoff prompt for a fresh session, ' +
      'in the language the conversation uses, with exactly three labeled lines: Goal, ' +
      'Current state, Next step. Output only the prompt.\n\n' +
      excerpt,
  })
  if (r.isAnswered) await $.ui.copy({ text: r.text })
  else $.ui.toast(textFor(lang).handoffFailed)
}

export const register: Register = (on, options) => {
  const lang = toLang(options.language)
  const tx = textFor(lang)

  on('session.start', async ($, e, next) => {
    const info = await $.session.info()
    transcriptPath = info.transcriptPath
    seenSize = -1
    $.clock.every(1000, () => {
      void tick($, lang)
    })
    await tick($, lang)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const s = await read($, snapshot)
    const t = await read($, now)

    // A rounded card in the chat: three lines at most, each kept to one line.
    if (!s) {
      return (
        <Box borderStyle="round" paddingX={1} flexDirection="column">
          <Text dir={tx.dir} dimColor maxLines={1}>
            {tx.noResponse}
          </Text>
        </Box>
      )
    }

    const st = cacheState(s, t)
    const { rebuildUsd, keepUsd } = costs(s)
    const sug = suggest(s, rebuildUsd)
    const clock =
      st.kind === 'cold'
        ? tx.idle(mmss(t - s.at))
        : st.remainingMs === null
          ? ''
          : tx.timeLeft(mmss(st.remainingMs))
    const act = () => (sug === 'keep' ? $.ui.copy({ text: config.keepWarmPrompt }) : copyHandoff($, lang))

    return (
      <Box borderStyle="round" paddingX={1} flexDirection="column">
        {/* 1: state, countdown, TTL */}
        <Box flexDirection={tx.flow} gap={2}>
          <Text dir={tx.dir} bold maxLines={1}>
            {tx.states[st.kind]}
          </Text>
          {clock === '' ? null : (
            <Text dir={tx.dir} maxLines={1}>
              {clock}
            </Text>
          )}
          <Text dir={tx.dir} dimColor maxLines={1}>
            {tx.ttl(s.ttl)}
          </Text>
        </Box>
        {/* 2: what a cold rebuild costs, what a refresh costs, and the cached size */}
        <Box flexDirection={tx.flow} gap={2}>
          {priceFor(s.model) ? (
            <Text dir={tx.dir} maxLines={1}>
              {tx.rebuild(rebuildUsd === null ? '—' : usd(rebuildUsd))}
            </Text>
          ) : (
            <Text dir={tx.dir} maxLines={1}>
              {tx.noPrice(s.model)}
            </Text>
          )}
          {priceFor(s.model) ? (
            <Text dir={tx.dir} maxLines={1}>
              {`${tx.refresh(usd(keepUsd ?? 0))} ${tx.perRefresh}`}
            </Text>
          ) : null}
          <Text dir={tx.dir} dimColor maxLines={1}>
            {tx.cached(compact(cachedTokens(s)))}
          </Text>
        </Box>
        {/* 3: the one suggestion and its action */}
        {sug === 'none' ? null : (
          <Box flexDirection={tx.flow} gap={2}>
            <Text dir={tx.dir} maxLines={1}>
              {tx.suggestion[sug]}
            </Text>
            <Button
              key="suggest"
              label={sug === 'keep' ? tx.button.keep : tx.button.handoff}
              onPress={() => {
                void act()
              }}
            />
          </Box>
        )}
      </Box>
    )
  })
}
