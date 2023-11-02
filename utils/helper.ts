// eslint-disable-next-line import/named
import { pickBy } from 'lodash'

// 入力が完了しているかを返却 NOTE: IME確定のEnterやShift+Enter等で送信されないようにする（keyupのisComposingはfalseになるので、keydownで判定）
const completInputKey = ($event: any) => {
  return !$event.isComposing && !$event.altKey && !$event.ctrlKey && !$event.metaKey && !$event.shiftKey
}

// キーが存在するエラーのみを返却 // NOTE: 未使用の値があるとvalidがtrueに戻らない為
const existKeyErrors = (errors: object, values: any) => {
  return pickBy(errors, (_value: string, key: string) => values[key] != null)
}

// 一定時間停止
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 日付を言語のフォーマットで返却
const dateFormat = (locales: string, value: string | null, defaultValue: any = null) => {
  if (value == null || value === '') { return defaultValue }

  return new Date(value).toLocaleString(locales, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 日時を言語のフォーマットで返却
const dateTimeFormat = (locales: string, value: string | null, defaultValue: any = null) => {
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

export {
  completInputKey,
  existKeyErrors,
  sleep,
  dateFormat,
  dateTimeFormat,
  pageFirstNumber,
  pageLastNumber,
  localeString,
  textTruncate
}
