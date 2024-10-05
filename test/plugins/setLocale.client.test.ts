import { config } from '@vue/test-utils'
import { cookieKey, locales, defaultLocale, fallbackLocale } from '~/i18n.config'
import helper from '~/test/helper'
import Plugin from '~/plugins/setLocale.client'

describe('setLocale.client.ts', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      localStorage: {
        setItem: vi.fn()
      },
      location: {
        replace: vi.fn(),
        reload: vi.fn()
      }
    }
  })
  const nuxtApp: any = { $config: config.global.mocks.$config }
  const allLocales = locales.map((item: any) => item.code)
  const otherLocales = locales.filter((item: any) => item.code !== defaultLocale).map((item: any) => item.code)
  const storageKey = 'browser-locale'

  const beforeAction = (languages: any, fullPath: string, reqCookie: any = {}, reqStorage: any = {}) => {
    Object.defineProperty(window, 'navigator', { value: { languages } })
    vi.stubGlobal('useRoute', vi.fn(() => ({ fullPath })))
    vi.stubGlobal('useCookie', vi.fn((key: string) => { return { value: reqCookie[key] } }))
    vi.stubGlobal('localStorage', { getItem: vi.fn((key: string) => reqStorage[key]), setItem: mock.localStorage.setItem })
    Object.defineProperty(window, 'location', { value: { replace: mock.location.replace, reload: mock.location.reload } })

    return Plugin(nuxtApp)
  }

  const testExistsCookie = (languages: any) => {
    describe('testExistsCookie', () => {
      it('[Cookieの言語がデフォルト言語]undefined', () => {
        const reqCookie: any = {}
        reqCookie[cookieKey] = defaultLocale
        const locale = beforeAction(languages, '/', reqCookie)

        expect(locale).toBeUndefined()
        helper.mockCalledTest(mock.localStorage.setItem, 0)
        helper.mockCalledTest(mock.location.replace, 0)
        helper.mockCalledTest(mock.location.reload, 0)
      })
      it('[URLがルート。Cookieの言語がデフォルト言語以外]undefined、言語付きURLに書き換えられる', () => {
        if (otherLocales.length === 0) { return }

        const path = '/'
        const reqCookie: any = {}
        reqCookie[cookieKey] = otherLocales[0]
        const locale = beforeAction(languages, path, reqCookie)

        expect(locale).toBeUndefined()
        helper.mockCalledTest(mock.localStorage.setItem, 0)
        helper.mockCalledTest(mock.location.replace, 1, `/${reqCookie[cookieKey]}`)
        helper.mockCalledTest(mock.location.reload, 0)
      })
      it('[URLにパラメータがある。Cookieの言語がデフォルト言語以外]undefined、言語付きURLに書き換えられる', () => {
        if (otherLocales.length === 0) { return }

        const path = '/path?a=1'
        const reqCookie: any = {}
        reqCookie[cookieKey] = otherLocales[0]
        const locale = beforeAction(languages, path, reqCookie)

        expect(locale).toBeUndefined()
        helper.mockCalledTest(mock.localStorage.setItem, 0)
        helper.mockCalledTest(mock.location.replace, 1, `/${reqCookie[cookieKey]}${path}`)
        helper.mockCalledTest(mock.location.reload, 0)
      })
    })
  }
  const testIncludeURL = (languages: any) => {
    describe('testIncludeURL', () => {
      describe('URLの言語がデフォルト言語', () => {
        it('[URLがルート]defaultLocale、言語なしURLに書き換えられる', () => {
          const path = '/'
          const locale = beforeAction(languages, `/${defaultLocale}`)

          expect(locale).toBe(defaultLocale)
          helper.mockCalledTest(mock.localStorage.setItem, 0)
          helper.mockCalledTest(mock.location.replace, 1, path)
          helper.mockCalledTest(mock.location.reload, 0)
        })
        it('[URLにパラメータがある]defaultLocale、言語なしURLに書き換えられる', () => {
          const path = '/path?a=1'
          const locale = beforeAction(languages, `/${defaultLocale}${path}`)

          expect(locale).toBe(defaultLocale)
          helper.mockCalledTest(mock.localStorage.setItem, 0)
          helper.mockCalledTest(mock.location.replace, 1, path)
          helper.mockCalledTest(mock.location.reload, 0)
        })
      })
      it('[URLの言語がデフォルト言語以外]URLの言語', () => {
        if (otherLocales.length === 0) { return }

        const locale = beforeAction(languages, `/${otherLocales[0]}`)

        expect(locale).toBe(otherLocales[0])
        helper.mockCalledTest(mock.localStorage.setItem, 0)
        helper.mockCalledTest(mock.location.replace, 0)
        helper.mockCalledTest(mock.location.reload, 0)
      })
    })
  }

  it('[優先言語がない]undefined', () => {
    const locale = beforeAction(null, '/')

    expect(locale).toBeUndefined()
    helper.mockCalledTest(mock.localStorage.setItem, 0)
    helper.mockCalledTest(mock.location.replace, 0)
    helper.mockCalledTest(mock.location.reload, 0)
  })
  describe('優先言語に対応言語が含まれない', () => {
    const languages = ['xx', 'yy']
    describe('URLに言語が含まれない', () => {
      it('[Cookieの言語がない]fallbackLocale', () => {
        const locale = beforeAction(languages, '/')

        expect(locale).toBe(fallbackLocale)
        helper.mockCalledTest(mock.localStorage.setItem, 0)
        helper.mockCalledTest(mock.location.replace, 0)
        helper.mockCalledTest(mock.location.reload, 0)
      })
      it('[Cookieの言語が対応言語に存在しない]fallbackLocale', () => {
        const reqCookie: any = {}
        reqCookie[cookieKey] = 'zz'
        const locale = beforeAction(languages, '/', reqCookie)

        expect(locale).toBe(fallbackLocale)
        helper.mockCalledTest(mock.localStorage.setItem, 0)
        helper.mockCalledTest(mock.location.replace, 0)
        helper.mockCalledTest(mock.location.reload, 0)
      })
      testExistsCookie(languages)
    })
    testIncludeURL(languages)
  })
  describe('優先言語にデフォルト言語が含まれる', () => {
    const languages = ['xx', ...allLocales]
    describe('URLに言語が含まれない', () => {
      it('[Cookieの言語がない]優先言語が対応言語と最初に一致した言語、リロードされる', () => {
        const locale = beforeAction(languages, '/')

        expect(locale).toBe(allLocales[0])
        helper.mockCalledTest(mock.localStorage.setItem, 1, storageKey, locale)
        helper.mockCalledTest(mock.location.replace, 0)
        helper.mockCalledTest(mock.location.reload, 1)
      })
      it('[Cookieの言語が対応言語に存在しない]優先言語が対応言語と最初に一致した言語、リロードされる', () => {
        const reqCookie: any = {}
        reqCookie[cookieKey] = 'zz'
        const locale = beforeAction(languages, '/', reqCookie)

        expect(locale).toBe(allLocales[0])
        helper.mockCalledTest(mock.localStorage.setItem, 1, storageKey, locale)
        helper.mockCalledTest(mock.location.replace, 0)
        helper.mockCalledTest(mock.location.reload, 1)
      })
      testExistsCookie(languages)
    })
    testIncludeURL(languages)
  })
  describe('優先言語にデフォルト言語以外の対応言語が含まれる', () => {
    const languages = otherLocales
    describe('URLに言語が含まれない', () => {
      it('[Cookieの言語がない]優先言語が対応言語と最初に一致した言語、リロードされる', () => {
        if (otherLocales.length === 0) { return }

        const locale = beforeAction(languages, '/')

        expect(locale).toBe(otherLocales[0])
        helper.mockCalledTest(mock.localStorage.setItem, 1, storageKey, locale)
        helper.mockCalledTest(mock.location.replace, 0)
        helper.mockCalledTest(mock.location.reload, 1)
      })
      it('[Cookieの言語が対応言語に存在しない]優先言語が対応言語と最初に一致した言語、リロードされる', () => {
        if (otherLocales.length === 0) { return }

        const reqCookie: any = {}
        reqCookie[cookieKey] = 'zz'
        const locale = beforeAction(languages, '/', reqCookie)

        expect(locale).toBe(otherLocales[0])
        helper.mockCalledTest(mock.localStorage.setItem, 1, storageKey, locale)
        helper.mockCalledTest(mock.location.replace, 0)
        helper.mockCalledTest(mock.location.reload, 1)
      })
      testExistsCookie(languages)
    })
    testIncludeURL(languages)
  })
})
