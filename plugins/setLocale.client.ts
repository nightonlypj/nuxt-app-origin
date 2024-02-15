import { cookieKey, locales, defaultLocale, fallbackLocale } from '~/i18n.config'

// ブラウザ言語の自動検出、デフォルト言語の場合はURLから言語を削除
export default defineNuxtPlugin(({ $config }): any => {
  const browserLocales = window.navigator.languages
  const $route = useRoute()
  const fullPath = $route.fullPath.match(/^\/([^/]*)(.*)$/)
  const cookieLocale = useCookie(cookieKey)
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('plugins/setLocale.client', browserLocales, fullPath, cookieLocale.value) }

  if (browserLocales == null) {
    /* c8 ignore next */ // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log('...Skip') }
    return
  }

  // URLに言語が含まれる -> Cookie更新、デフォルト言語の場合はURLから言語を削除
  if (fullPath != null) {
    const locale = fullPath[1]
    if (locales.filter((item: any) => item.code === locale).length >= 1) {
      /* c8 ignore next */ // eslint-disable-next-line no-console
      if ($config.public.debug) { console.log('URL: cookieLocale', locale) }

      cookieLocale.value = locale

      if (locale === defaultLocale) {
        const path = fullPath[2] === '' ? '/' : fullPath[2]
        /* c8 ignore next */ // eslint-disable-next-line no-console
        if ($config.public.debug) { console.log('URL: location.replace', path) }

        location.replace(path)
      }
      return locale
    }
  }

  // Cookieあり -> デフォルト言語以外の場合はURLに言語を追加
  if (cookieLocale.value != null) {
    const locale = cookieLocale.value
    if (locales.filter((item: any) => item.code === locale).length >= 1) {
      if (locale !== defaultLocale) {
        const path = $route.fullPath === '/' ? `/${locale}` : `/${locale}${$route.fullPath}`
        /* c8 ignore next */ // eslint-disable-next-line no-console
        if ($config.public.debug) { console.log('Cookie: location.replace', path) }

        location.replace(path)
      }
      return
    }
  }

  // ブラウザの優先言語と一致 -> Cookie更新(ブラウザの優先言語)してリロード
  for (const browserLocale of browserLocales) {
    const locale = browserLocale.slice(0, 2) // NOTE: 先頭2文字で判定
    if (locales.filter((item: any) => item.code === locale).length >= 1) {
      /* c8 ignore next */ // eslint-disable-next-line no-console
      if ($config.public.debug) { console.log('browserLocales: cookieLocale', locale) }

      cookieLocale.value = locale

      const storageKey = 'browser-locale'
      if (localStorage.getItem(storageKey) !== locale) { // NOTE: Cookieが使えない場合にリダイレクトループを防ぐ
        /* c8 ignore next */ // eslint-disable-next-line no-console
        if ($config.public.debug) { console.log('browserLocales: location.reload') }

        localStorage.setItem(storageKey, locale)
        location.reload()
      }
      return locale
    }
  }

  // Cookie更新(fallbackLocale)
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('fallbackLocale: cookieLocale', fallbackLocale) }
  cookieLocale.value = fallbackLocale
  return fallbackLocale
})
