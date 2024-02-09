// 日付を言語のフォーマットで返却
const dateFormat = computed(() => (locales: string, value: string | null, defaultValue: any = null) => {
  if (value == null || value === '') { return defaultValue }

  return new Date(value).toLocaleString(locales, { year: 'numeric', month: '2-digit', day: '2-digit' })
})

// 日時を言語のフォーマットで返却
const dateTimeFormat = computed(() => (locales: string, value: string | null, defaultValue: any = null) => {
  if (value == null || value === '') { return defaultValue }

  return new Date(value).toLocaleString(locales, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
})

// ページの最初の番号を返却
const pageFirstNumber = computed(() => (info: any) => {
  if (info?.limit_value == null || info?.current_page == null) { return null }

  return info.limit_value * (info.current_page - 1) + 1
})

// ページの最後の番号を返却
const pageLastNumber = computed(() => (info: any) => {
  if (info?.limit_value == null || info?.current_page == null || info?.total_pages == null || info?.total_count == null) { return null }

  return (info.current_page < info.total_pages) ? info.limit_value * info.current_page : info.total_count
})

// 数値を言語のフォーマットで返却
const localeString = computed(() => (locales: string, value: any, defaultValue: any = null) => {
  if (value == null || value === '') { return defaultValue }

  return value.toLocaleString(locales)
})

// テキストを省略して返却
const textTruncate = computed(() => (text: string | null, length: number) => {
  return text == null || text.length <= length ? text : `${text.slice(0, length)}...`
})

// タイムゾーンの差を返却 ex.'+09:00',
const timeZoneOffset = computed(() => {
  const offset = new Date().getTimezoneOffset() * -1
  const offsetAbs = Math.abs(offset)
  return (offset >= 0 ? '+' : '-') + `0${String(Math.trunc(offsetAbs / 60))}`.slice(-2) + ':' + `0${offsetAbs % 60}`.slice(-2)
})

// タイムゾーンの略称を返却 ex.'JST'
const timeZoneShortName = computed(() => {
  const secZone = new Date().toLocaleString('default', { second: 'numeric', timeZoneName: 'short' }) // 0 JST
  const result = secZone.match(/\s(.*)$/)
  return (result != null) ? result[1] : null
})

export {
  dateFormat,
  dateTimeFormat,
  pageFirstNumber,
  pageLastNumber,
  localeString,
  textTruncate,
  timeZoneOffset,
  timeZoneShortName
}
