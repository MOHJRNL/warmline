import type { Suggestion } from './cache'

export type Lang = 'en' | 'ar'

/** The band's language: `ar` only when chosen, English otherwise. */
export const toLang = (value: unknown): Lang => (value === 'ar' ? 'ar' : 'en')

type Text = {
  dir: 'ltr' | 'rtl'
  /** Row order: 'row' reads left to right, 'row-reverse' is the RTL equivalent. */
  flow: 'row' | 'row-reverse'
  states: { warm: string; cooling: string; cold: string; unknown: string }
  ttl: (ttl: '5m' | '1h' | null) => string
  timeLeft: (mmss: string) => string
  idle: (mmss: string) => string
  rebuild: (usd: string) => string
  refresh: (usd: string) => string
  perRefresh: string
  cached: (tokens: string) => string
  noResponse: string
  noPrice: (model: string) => string
  suggestion: Record<Suggestion, string>
  button: Record<'keep' | 'handoff', string>
  toastCold: string
  toastCooling: (mmss: string) => string
  handoffFailed: string
}

const en: Text = {
  dir: 'ltr',
  flow: 'row',
  states: { warm: '🟢 Warm', cooling: '🟡 Cooling soon', cold: '🔵 Cold', unknown: '⚪ Unknown' },
  ttl: t => (t === '1h' ? 'TTL 1h' : t === '5m' ? 'TTL 5m' : 'TTL unknown'),
  timeLeft: t => `${t} left`,
  idle: t => `idle ${t}`,
  rebuild: u => `Rebuild ${u}`,
  refresh: u => `Refresh ${u}`,
  perRefresh: 'each',
  cached: t => `${t} cached`,
  noResponse: 'No model response yet in this session.',
  noPrice: m => `No price for ${m}: add it in config.ts`,
  suggestion: {
    keep: 'Large context: a short message is cheaper than a rebuild.',
    handoff: 'Costly rebuild or huge context: start a new session.',
    none: '',
  },
  button: { keep: 'Copy prompt', handoff: 'Copy handoff' },
  toastCold: 'The cache went cold.',
  toastCooling: t => `⏳ Cache cools in ${t}.`,
  handoffFailed: 'Could not write the handoff prompt',
}

const ar: Text = {
  dir: 'rtl',
  flow: 'row-reverse',
  states: { warm: '🟢 دافئ', cooling: '🟡 يبرد قريبًا', cold: '🔵 بارد', unknown: '⚪ غير معروف' },
  ttl: t => (t === '1h' ? 'TTL ساعة' : t === '5m' ? 'TTL 5 د' : 'TTL unknown'),
  timeLeft: t => `${t} متبقٍ`,
  idle: t => `خامل ${t}`,
  rebuild: u => `إعادة البناء ${u}`,
  refresh: u => `تحديث ${u}`,
  perRefresh: 'لكل مرة',
  cached: t => `${t} مخبّأ`,
  noResponse: 'لا توجد ردود من النموذج بعد في هذه الجلسة.',
  noPrice: m => `سعر ${m} غير معروف: أضفه في config.ts`,
  suggestion: {
    keep: 'سياق كبير: رسالة قصيرة أرخص من إعادة البناء.',
    handoff: 'إعادة البناء مكلفة أو السياق ضخم: ابدأ جلسة جديدة.',
    none: '',
  },
  button: { keep: 'نسخ الرسالة', handoff: 'نسخ prompt الانتقال' },
  toastCold: 'بَرَد الكاش.',
  toastCooling: t => `⏳ الكاش يبرد خلال ${t}.`,
  handoffFailed: 'تعذّر إنشاء prompt الانتقال',
}

export const textFor = (lang: Lang): Text => (lang === 'ar' ? ar : en)
