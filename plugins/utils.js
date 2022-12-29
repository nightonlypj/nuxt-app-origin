// 日付を言語のフォーマットで返却
const dateFormat = (locales, value, defaultValue = null) => {
  if (value == null || value === '') { return defaultValue }

  return new Date(value).toLocaleString(locales, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 時間を言語のフォーマットで返却
const timeFormat = (locales, value, defaultValue = null) => {
  if (value == null || value === '') { return defaultValue }

  return new Date(value).toLocaleString(locales, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ページの最初の番号を返却
const pageFirstNumber = (info) => {
  if (info?.limit_value == null || info?.current_page == null) { return null }

  return info.limit_value * (info.current_page - 1) + 1
}

// ページの最後の番号を返却
const pageLastNumber = (info) => {
  if (info?.limit_value == null || info?.current_page == null || info?.total_pages == null || info?.total_count == null) { return null }

  return (info.current_page < info.total_pages) ? info.limit_value * info.current_page : info.total_count
}

// 数値を言語のフォーマットで返却
const localeString = (locales, value, defaultValue = null) => {
  if (value == null || value === '') { return defaultValue }

  return value.toLocaleString(locales)
}

export default (_context, inject) => {
  inject('config', useRuntimeConfig())
  inject('dateFormat', dateFormat)
  inject('timeFormat', timeFormat)
  inject('pageFirstNumber', pageFirstNumber)
  inject('pageLastNumber', pageLastNumber)
  inject('localeString', localeString)
}

export const TestPluginUtils = {
  install (Vue) {
    Vue.prototype.$dateFormat = dateFormat
    Vue.prototype.$timeFormat = timeFormat
    Vue.prototype.$pageFirstNumber = pageFirstNumber
    Vue.prototype.$pageLastNumber = pageLastNumber
    Vue.prototype.$localeString = localeString
  }
}
