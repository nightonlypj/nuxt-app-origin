import { pickBy } from 'lodash'

// 入力が完了しているかを返却 // NOTE: IME確定のEnterやShift+Enter等で送信されないようにする（keyupのisComposingはfalseになるので、keydownで判定）
const completInputKey = computed(() => ($event: any) => {
  return !$event.isComposing && !$event.altKey && !$event.ctrlKey && !$event.metaKey && !$event.shiftKey
})

// キーが存在するエラーのみを返却 // NOTE: 未使用の値があるとvalidがtrueに戻らない為
const existKeyErrors = computed(() => (errors: object, values: any) => {
  return pickBy(errors, (_value: string, key: string) => values[key] != null)
})

export {
  completInputKey,
  existKeyErrors
}
