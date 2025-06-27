export const cookieKey = 'locale' // <- 'i18n_redirected'
export const defaultLocale = 'ja'
export const locales = [
  { code: 'en', iso: 'en_US', name: 'English', file: 'en.ts' },
  { code: 'ja', iso: 'ja_JP', name: '日本語', file: 'ja.ts' }
]
export const langDir = '../locales'
export const fallbackLocale = 'en'

export default {
  legacy: false,
  fallbackLocale,
  silentFallbackWarn: true
}
