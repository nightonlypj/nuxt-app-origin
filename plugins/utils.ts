// 一定時間停止
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 日付を言語のフォーマットで返却
const dateFormat = (locales: string, value: string | null, defaultValue: any = null) => {
  if (value == null || value === '') { return defaultValue }

  return new Date(value).toLocaleString(locales, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 時間を言語のフォーマットで返却
const timeFormat = (locales: string, value: string | null, defaultValue: any = null) => {
  if (value == null || value === '') { return defaultValue }

  return new Date(value).toLocaleString(locales, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ページの最初の番号を返却
const pageFirstNumber = (info: any) => {
  if (info?.limit_value == null || info?.current_page == null) { return null }

  return info.limit_value * (info.current_page - 1) + 1
}

// ページの最後の番号を返却
const pageLastNumber = (info: any) => {
  if (info?.limit_value == null || info?.current_page == null || info?.total_pages == null || info?.total_count == null) { return null }

  return (info.current_page < info.total_pages) ? info.limit_value * info.current_page : info.total_count
}

// 数値を言語のフォーマットで返却
const localeString = (locales: string, value: any, defaultValue: any = null) => {
  if (value == null || value === '') { return defaultValue }

  return value.toLocaleString(locales)
}

// テキストを省略して返却
const textTruncate = (text: string | null, length: number) => {
  return text == null || text.length <= length ? text : `${text.slice(0, length)}...`
}

/* istanbul ignore next */
export default defineNuxtPlugin((_nuxtApp) => {
  return {
    provide: {
      sleep,
      dateFormat,
      timeFormat,
      pageFirstNumber,
      pageLastNumber,
      localeString,
      textTruncate
    }
  }
})

export const TestPluginUtils = {
  install (Vue: any) {
    Vue.prototype.$sleep = sleep
    Vue.prototype.$dateFormat = dateFormat
    Vue.prototype.$timeFormat = timeFormat
    Vue.prototype.$pageFirstNumber = pageFirstNumber
    Vue.prototype.$pageLastNumber = pageLastNumber
    Vue.prototype.$localeString = localeString
    Vue.prototype.$textTruncate = textTruncate
  }
}
