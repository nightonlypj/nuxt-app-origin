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

// 非表示項目をlocalStorageまたはheadersから取得して返却 // NOTE: 存在しないkeyは含めいない。追加項目はdefaultHiddenで判断
const tableHiddenItems = computed(() => (model: string, headers: any = []) => {
  const localHiddenItems = localStorage.getItem(`${model}.hidden-items`)?.split(',')
  if (localHiddenItems == null) { return headers.filter((item: any) => item.defaultHidden).map((item: any) => item.key) }

  const localShowItems = localStorage.getItem(`${model}.show-items`)?.split(',')
  const showItems = (localShowItems != null) ? localShowItems : headers.filter((item: any) => !item.defaultHidden).map((item: any) => item.key)

  const headerKeys = headers.map((item: any) => item.key)
  const hiddenItems = localHiddenItems.filter((item: any) => headerKeys.includes(item))
  const newItems = hiddenItems.filter((item: any) => !showItems.includes(item))
  return hiddenItems.concat(newItems.filter((item: any) => item.defaultHidden))
})

// テーブルのヘッダ情報を返却
const tableHeaders = computed(() => ($t: any, items: any, hiddenItems: any = [], admin: boolean | null = null) => {
  const result = []
  for (const item of items) {
    if ((item.required || !hiddenItems.includes(item.key)) && (!item.adminOnly || admin)) {
      let props: any = { headerProps: { class: 'text-no-wrap' }, cellProps: { class: 'px-1 py-2' } }
      if (item.key === 'data-table-select') { props = { ...props, headerProps: { class: 'px-0' }, cellProps: { class: 'px-0 py-2' } } }
      if (item.align === 'end') { props = { ...props, cellProps: { class: 'pl-1 pr-6 py-2' }, align: 'end' } }
      if (item.align === 'center') { props = { ...props, align: 'center' } }
      if (item.headerProps != null) { props = { ...props, headerProps: { ...props.headerProps, ...item.headerProps } } }
      if (item.cellProps != null) { props = { ...props, cellProps: { ...props.cellProps, ...item.cellProps } } }
      if (item.width != null) { props = { ...props, width: item.width } }

      result.push({
        title: item.title != null ? $t(item.title) : '',
        key: item.key,
        sortable: item.sortable != null ? item.sortable : true,
        ...props
      })
    }
  }
  return result
})

export {
  dateFormat,
  dateTimeFormat,
  pageFirstNumber,
  pageLastNumber,
  localeString,
  textTruncate,
  timeZoneOffset,
  timeZoneShortName,
  tableHiddenItems,
  tableHeaders
}
