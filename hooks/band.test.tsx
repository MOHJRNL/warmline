import { expect, test } from 'claude-code/testing'

// 150k cached tokens on Opus 5.5, 5-minute TTL.
// rebuild = 150000 x $5/MTok = $0.75 (over the $0.50 threshold, so a handoff is suggested);
// keep-warm = 150000 x $0.20/MTok = $0.03.
const NOW = 1_800_000_000_000
const snapshotAt = (ago: number) => ({
  at: NOW - ago,
  model: 'claude-opus-5-5',
  input: 2,
  cacheRead: 150_000,
  cacheWrite: 0,
  ttl: '5m',
})

const PROPS = {
  hasSurvey: false,
  isCollapsed: false,
  isWorking: false,
  maxRows: 6,
  bodyColumns: 80,
  scroll: { offset: 0, bodyRows: 6 },
  view: {},
}

const LANGS = {
  en: {
    warm: /🟢 Warm/,
    left: /04:00 left/,
    cold: /🔵 Cold/,
    idle: /idle 06:00/,
    rebuild: /Rebuild \$0\.7500/,
    keep: /Refresh \$0\.0300 each/,
  },
  ar: {
    warm: /🟢 دافئ/,
    left: /04:00 متبقٍ/,
    cold: /🔵 بارد/,
    idle: /خامل 06:00/,
    rebuild: /إعادة البناء \$0\.7500/,
    keep: /تحديث \$0\.0300 لكل مرة/,
  },
} as const

for (const language of ['en', 'ar'] as const) {
  const L = LANGS[language]
  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    test(`the band draws in ${language} on ${surface}`, { options: { language } }, async ($, on) => {
      const seeds: Record<string, unknown> = { snapshot: snapshotAt(60_000), now: NOW, alertedAt: null }
      on('state.get', (_, e) => ({ value: { value: seeds[e.key as string] ?? null, version: 1 } }))

      const ui = await $.ui.mount({ plugin: 'warmline-band', surface, component: 'AbovePrompt', requestId: 'band', props: PROPS })

      expect((await ui.find({ type: 'Text', text: L.warm }))?.text).toMatch(L.warm)
      expect((await ui.find({ type: 'Text', text: L.left }))?.text).toMatch(L.left)
      expect((await ui.find({ type: 'Text', text: L.rebuild }))?.text).toMatch(L.rebuild)
      expect((await ui.find({ type: 'Text', text: L.keep }))?.text).toMatch(L.keep)
      await ui.unmount()
    })

    test(`the band shows idle time once cold in ${language} on ${surface}`, { options: { language } }, async ($, on) => {
      // 6 minutes after the last response on a 5-minute TTL: cold, idle since then
      const seeds: Record<string, unknown> = { snapshot: snapshotAt(6 * 60_000), now: NOW, alertedAt: null }
      on('state.get', (_, e) => ({ value: { value: seeds[e.key as string] ?? null, version: 1 } }))

      const ui = await $.ui.mount({ plugin: 'warmline-band', surface, component: 'AbovePrompt', requestId: 'band', props: PROPS })

      expect((await ui.find({ type: 'Text', text: L.cold }))?.text).toMatch(L.cold)
      expect((await ui.find({ type: 'Text', text: L.idle }))?.text).toMatch(L.idle)
      await ui.unmount()
    })
  }
}

test('English is the default when no language is chosen', async ($, on) => {
  const seeds: Record<string, unknown> = { snapshot: snapshotAt(60_000), now: NOW, alertedAt: null }
  on('state.get', (_, e) => ({ value: { value: seeds[e.key as string] ?? null, version: 1 } }))

  const ui = await $.ui.mount({ plugin: 'warmline-band', surface: 'desktop', component: 'AbovePrompt', requestId: 'band', props: PROPS })

  expect((await ui.find({ type: 'Text', text: /🟢 Warm/ }))?.text).toMatch(/🟢 Warm/)
  await ui.unmount()
})
