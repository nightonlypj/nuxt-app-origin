import { completInputKey, existKeyErrors, sleep, dateFormat, dateTimeFormat, pageFirstNumber, pageLastNumber, localeString, textTruncate } from '~/utils/helper'

describe('helper.ts', () => {
  // 入力が完了しているかを返却 // NOTE: IME確定のEnterやShift+Enter等で送信されないようにする（keyupのisComposingはfalseになるので、keydownで判定）
  describe('completInputKey', () => {
    it('[全てfalse]true', () => {
      const $event = Object.freeze({ isComposing: false, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false })
      expect(completInputKey($event)).toBe(true)
    })
    it('[isComposingがtrue]false', () => {
      const $event = Object.freeze({ isComposing: true, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false })
      expect(completInputKey($event)).toBe(false)
    })
    it('[altKeyがtrue]false', () => {
      const $event = Object.freeze({ isComposing: false, altKey: true, ctrlKey: false, metaKey: false, shiftKey: false })
      expect(completInputKey($event)).toBe(false)
    })
    it('[ctrlKeyがtrue]false', () => {
      const $event = Object.freeze({ isComposing: false, altKey: false, ctrlKey: true, metaKey: false, shiftKey: false })
      expect(completInputKey($event)).toBe(false)
    })
    it('[metaKeyがtrue]false', () => {
      const $event = Object.freeze({ isComposing: false, altKey: false, ctrlKey: false, metaKey: true, shiftKey: false })
      expect(completInputKey($event)).toBe(false)
    })
    it('[shiftKeyがtrue]false', () => {
      const $event = Object.freeze({ isComposing: false, altKey: false, ctrlKey: false, metaKey: false, shiftKey: true })
      expect(completInputKey($event)).toBe(false)
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
      expect(existKeyErrors(errors, values)).toEqual(result)
    })
  })

  // 一定時間停止
  describe('sleep', () => {
    // it.skip('[10]10ミリ秒停止する', async () => { // NOTE: 時々、失敗する為
    it('[10]10ミリ秒停止する', async () => {
      const startDate = new Date()
      await sleep(10)
      expect((new Date()).getTime() - startDate.getTime() + 1).toBeGreaterThan(10)
    })
  })

  // 日付/時間を言語のフォーマットで返却
  describe('dateFormat/dateTimeFormat', () => {
    it('[null]nullが返却される', () => {
      expect(dateFormat('ja', null)).toBeNull()
      expect(dateTimeFormat('ja', null)).toBeNull()
    })
    it('[null/デフォルトあり]デフォルト値が返却される', () => {
      expect(dateFormat('ja', null, 'N/A')).toBe('N/A')
      expect(dateTimeFormat('ja', null, 'N/A')).toBe('N/A')
    })
    it('[なし]nullが返却される', () => {
      expect(dateFormat('ja', '')).toBeNull()
      expect(dateTimeFormat('ja', '')).toBeNull()
    })
    it('[なし/デフォルトあり]デフォルト値が返却される', () => {
      expect(dateFormat('ja', '', 'N/A')).toBe('N/A')
      expect(dateTimeFormat('ja', '', 'N/A')).toBe('N/A')
    })
    it('[あり]日付/日時が返却される', () => {
      expect(dateFormat('ja', '2000-01-02T12:34:56+09:00')).toBe('2000/01/02')
      expect(dateTimeFormat('ja', '2000-01-02T12:34:56+09:00')).toBe('2000/01/02 12:34')
    })
  })

  // ページの最初/最後の番号を返却
  describe('pageFirstNumber/pageLastNumber', () => {
    it('[null]nullが返却される', () => {
      expect(pageFirstNumber(null)).toBeNull()
      expect(pageLastNumber(null)).toBeNull()
    })
    it('[なし]nullが返却される', () => {
      expect(pageFirstNumber({})).toBeNull()
      expect(pageLastNumber({})).toBeNull()
    })
    it('[0件]1-0が返却される', () => {
      const info = Object.freeze({
        total_count: 0,
        current_page: 1,
        total_pages: 0,
        limit_value: 25
      })
      expect(pageFirstNumber(info)).toBe(1)
      expect(pageLastNumber(info)).toBe(0)
    })
    it('[2頁中1頁]1-25が返却される', () => {
      const info = Object.freeze({
        total_count: 26,
        current_page: 1,
        total_pages: 2,
        limit_value: 25
      })
      expect(pageFirstNumber(info)).toBe(1)
      expect(pageLastNumber(info)).toBe(25)
    })
    it('[2頁中2頁]26-26が返却される', () => {
      const info = Object.freeze({
        total_count: 26,
        current_page: 2,
        total_pages: 2,
        limit_value: 25
      })
      expect(pageFirstNumber(info)).toBe(26)
      expect(pageLastNumber(info)).toBe(26)
    })
  })

  // 数値を言語のフォーマットで返却
  describe('localeString', () => {
    it('[null]nullが返却される', () => {
      expect(localeString('ja', null)).toBeNull()
    })
    it('[null/デフォルトあり]デフォルト値が返却される', () => {
      expect(localeString('ja', null, 'N/A')).toBe('N/A')
    })
    it('[なし]nullが返却される', () => {
      expect(localeString('ja', '')).toBeNull()
    })
    it('[なし/デフォルトあり]デフォルト値が返却される', () => {
      expect(localeString('ja', '', 'N/A')).toBe('N/A')
    })
    it('[数値]値が返却される', () => {
      expect(localeString('ja', '1000')).toBe('1000') // NOTE: testだとカンマ区切りにならない
    })
  })

  // テキストを省略して返却
  describe('textTruncate', () => {
    it('[null]nullが返却される', () => {
      expect(textTruncate(null, 1)).toBeNull()
    })
    it('[最大値]そのまま返却される', () => {
      expect(textTruncate('123', 3)).toBe('123')
    })
    it('[最大値以上]省略されて返却される', () => {
      expect(textTruncate('123', 2)).toBe('12...')
    })
  })
})
