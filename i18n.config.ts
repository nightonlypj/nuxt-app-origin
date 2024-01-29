import { ja } from '~/locales/ja'
import { en } from '~/locales/en'

export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  silentFallbackWarn: true,
  messages: {
    ja,
    en
  }
}))
