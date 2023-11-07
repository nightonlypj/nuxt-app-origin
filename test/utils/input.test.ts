import { completInputKey, existKeyErrors } from '~/utils/input'

describe('input.ts', () => {
  // 入力が完了しているかを返却 // NOTE: IME確定のEnterやShift+Enter等で送信されないようにする（keyupのisComposingはfalseになるので、keydownで判定）
  describe('completInputKey', () => {
    it('[全てfalse]true', () => {
      const $event = Object.freeze({ isComposing: false, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false })
      expect(completInputKey.value($event)).toBe(true)
    })
    it('[isComposingがtrue]false', () => {
      const $event = Object.freeze({ isComposing: true, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false })
      expect(completInputKey.value($event)).toBe(false)
    })
    it('[altKeyがtrue]false', () => {
      const $event = Object.freeze({ isComposing: false, altKey: true, ctrlKey: false, metaKey: false, shiftKey: false })
      expect(completInputKey.value($event)).toBe(false)
    })
    it('[ctrlKeyがtrue]false', () => {
      const $event = Object.freeze({ isComposing: false, altKey: false, ctrlKey: true, metaKey: false, shiftKey: false })
      expect(completInputKey.value($event)).toBe(false)
    })
    it('[metaKeyがtrue]false', () => {
      const $event = Object.freeze({ isComposing: false, altKey: false, ctrlKey: false, metaKey: true, shiftKey: false })
      expect(completInputKey.value($event)).toBe(false)
    })
    it('[shiftKeyがtrue]false', () => {
      const $event = Object.freeze({ isComposing: false, altKey: false, ctrlKey: false, metaKey: false, shiftKey: true })
      expect(completInputKey.value($event)).toBe(false)
    })
  })

  // キーが存在するエラーのみを返却 // NOTE: 未使用の値があるとvalidがtrueに戻らない為
  describe('existKeyErrors', () => {
    it('キーが存在するエラーのみが返却される', () => {
      const result = Object.freeze({
        email: ['errorメッセージ']
      })
      const errors = Object.freeze({
        ...result,
        full_messages: ['メールアドレス errorメッセージ']
      })
      const values = Object.freeze({
        name: 'user1の氏名',
        email: 'user1@example.com'
      })
      expect(existKeyErrors.value(errors, values)).toEqual(result)
    })
  })
})
