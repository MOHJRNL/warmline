import { expect, test } from 'claude-code/testing'

// Session start, the transcript tail, the one-second timer and the band, end to end.
const NOW = 1_800_000_000_000
const LINE = JSON.stringify({
  type: 'assistant',
  timestamp: new Date(NOW - 60_000).toISOString(),
  message: {
    model: 'claude-opus-5-5',
    usage: { input_tokens: 2, cache_read_input_tokens: 0, cache_creation_input_tokens: 150000, cache_creation: { ephemeral_5m_input_tokens: 150000, ephemeral_1h_input_tokens: 0 } },
  },
})
const PROPS = { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 6, bodyColumns: 80, scroll: { offset: 0, bodyRows: 6 }, view: {} }

test('the band follows the transcript after session start', { options: { language: 'en' } }, async ($, on) => {
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('session.info', () => ({ value: { transcriptPath: '/fake/session.jsonl' } }))
  on('clock.now', () => ({ value: NOW }))
  on('fs.stat', () => ({ value: { size: LINE.length + 1 } }))
  on('fs.read', () => ({ value: LINE + '\n' }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ plugin: 'warmline', surface: 'desktop', component: 'AbovePrompt', requestId: 'band', props: PROPS })
  expect((await ui.find({ type: 'Text', text: /🟢 Warm/ }))?.text).toMatch(/🟢 Warm/)
  expect((await ui.find({ type: 'Text', text: /04:00 left/ }))?.text).toMatch(/04:00 left/)
  await ui.unmount()
})
