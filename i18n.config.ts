import { en } from './locales/en'
import { ja } from './locales/ja'

export const defaultLocale = 'ja'
export const locales = [
  { code: 'en', iso: 'en_US', name: 'English' },
  { code: 'ja', iso: 'ja_JP', name: '日本語' }
]

export default {
  legacy: false,
  fallbackLocale: 'en',
  silentFallbackWarn: true,
  messages: {
    en,
    ja
  }
}
