import { en } from './locales/en'
import { ja } from './locales/ja'

export const cookieKey = 'locale' // <- 'i18n_redirected'
export const defaultLocale = 'ja'
export const locales = [
  { code: 'en', iso: 'en_US', name: 'English' },
  { code: 'ja', iso: 'ja_JP', name: '日本語' }
]
export const fallbackLocale = 'en'

export default {
  legacy: false,
  fallbackLocale,
  silentFallbackWarn: true,
  messages: {
    en,
    ja
  }
}
