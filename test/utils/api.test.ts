import { apiRequestURL } from '~/utils/api'
import { locales } from '~/i18n.config'

const $config = useRuntimeConfig()

describe('api.ts', () => {
  // APIリクエストURL取得
  describe('apiRequestURL', () => {
    const url = '/api'
    for (const item of [...locales, { code: 'unknown' }]) {
      const result = $config.public.apiBaseURL + ($config.public.apiLocale as any)[item.code] + url
      it(`[${item.code}]${result}が返却される`, () => {
        expect(apiRequestURL.value(item.code, url)).toBe(result)
      })
    }
  })
})
