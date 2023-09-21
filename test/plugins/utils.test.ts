import { mount } from '@vue/test-utils'

describe('utils.ts', () => {
  const wrapper = mount({ template: '<div />' })

  // 一定時間停止
  describe('sleep', () => {
    it.skip('[10]10ミリ秒停止する', async () => { // NOTE: 時々、失敗する為
      const startDate = new Date()
      await wrapper.vm.$sleep(10)
      expect((new Date()).getTime() - startDate.getTime() + 1).toBeGreaterThan(10)
    })
  })

  // 日付/時間を言語のフォーマットで返却
  describe('dateFormat/timeFormat', () => {
    it('[null]nullが返却される', () => {
      expect(wrapper.vm.$dateFormat('ja', null)).toBeNull()
      expect(wrapper.vm.$timeFormat('ja', null)).toBeNull()
    })
    it('[null/デフォルトあり]デフォルト値が返却される', () => {
      expect(wrapper.vm.$dateFormat('ja', null, 'N/A')).toBe('N/A')
      expect(wrapper.vm.$timeFormat('ja', null, 'N/A')).toBe('N/A')
    })
    it('[なし]nullが返却される', () => {
      expect(wrapper.vm.$dateFormat('ja', '')).toBeNull()
      expect(wrapper.vm.$timeFormat('ja', '')).toBeNull()
    })
    it('[なし/デフォルトあり]デフォルト値が返却される', () => {
      expect(wrapper.vm.$dateFormat('ja', '', 'N/A')).toBe('N/A')
      expect(wrapper.vm.$timeFormat('ja', '', 'N/A')).toBe('N/A')
    })
    it('[あり]日付/日時が返却される', () => {
      expect(wrapper.vm.$dateFormat('ja', '2000-01-02T12:34:56+09:00')).toBe('2000/01/02')
      expect(wrapper.vm.$timeFormat('ja', '2000-01-02T12:34:56+09:00')).toBe('2000/01/02 12:34')
    })
  })

  // ページの最初/最後の番号を返却
  describe('pageFirstNumber/pageLastNumber', () => {
    it('[null]nullが返却される', () => {
      expect(wrapper.vm.$pageFirstNumber(null)).toBeNull()
      expect(wrapper.vm.$pageLastNumber(null)).toBeNull()
    })
    it('[なし]nullが返却される', () => {
      expect(wrapper.vm.$pageFirstNumber({})).toBeNull()
      expect(wrapper.vm.$pageLastNumber({})).toBeNull()
    })
    it('[0件]1-0が返却される', () => {
      const info = Object.freeze({
        total_count: 0,
        current_page: 1,
        total_pages: 0,
        limit_value: 25
      })
      expect(wrapper.vm.$pageFirstNumber(info)).toBe(1)
      expect(wrapper.vm.$pageLastNumber(info)).toBe(0)
    })
    it('[2頁中1頁]1-25が返却される', () => {
      const info = Object.freeze({
        total_count: 26,
        current_page: 1,
        total_pages: 2,
        limit_value: 25
      })
      expect(wrapper.vm.$pageFirstNumber(info)).toBe(1)
      expect(wrapper.vm.$pageLastNumber(info)).toBe(25)
    })
    it('[2頁中2頁]26-26が返却される', () => {
      const info = Object.freeze({
        total_count: 26,
        current_page: 2,
        total_pages: 2,
        limit_value: 25
      })
      expect(wrapper.vm.$pageFirstNumber(info)).toBe(26)
      expect(wrapper.vm.$pageLastNumber(info)).toBe(26)
    })
  })

  // 数値を言語のフォーマットで返却
  describe('localeString', () => {
    it('[null]nullが返却される', () => {
      expect(wrapper.vm.$localeString('ja', null)).toBeNull()
    })
    it('[null/デフォルトあり]デフォルト値が返却される', () => {
      expect(wrapper.vm.$localeString('ja', null, 'N/A')).toBe('N/A')
    })
    it('[なし]nullが返却される', () => {
      expect(wrapper.vm.$localeString('ja', '')).toBeNull()
    })
    it('[なし/デフォルトあり]デフォルト値が返却される', () => {
      expect(wrapper.vm.$localeString('ja', '', 'N/A')).toBe('N/A')
    })
    it('[数値]値が返却される', () => {
      expect(wrapper.vm.$localeString('ja', '1000')).toBe('1000') // NOTE: testだとカンマ区切りにならない
    })
  })

  // テキストを省略して返却
  describe('textTruncate', () => {
    it('[null]nullが返却される', () => {
      expect(wrapper.vm.$textTruncate(null, 1)).toBeNull()
    })
    it('[最大値]そのまま返却される', () => {
      expect(wrapper.vm.$textTruncate('123', 3)).toBe('123')
    })
    it('[最大値以上]省略されて返却される', () => {
      expect(wrapper.vm.$textTruncate('123', 2)).toBe('12...')
    })
  })
})
