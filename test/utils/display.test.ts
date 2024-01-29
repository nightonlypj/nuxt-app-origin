import { dateFormat, dateTimeFormat, pageFirstNumber, pageLastNumber, localeString, textTruncate, tableHeight, timeZoneOffset, timeZoneShortName } from '~/utils/display'
import helper from '~/test/helper'

describe('display.ts', () => {
  // 日付/時間を言語のフォーマットで返却
  describe('dateFormat/dateTimeFormat', () => {
    it('[null]nullが返却される', () => {
      expect(dateFormat.value(helper.locale, null)).toBeNull()
      expect(dateTimeFormat.value(helper.locale, null)).toBeNull()
    })
    it('[null/デフォルトあり]デフォルト値が返却される', () => {
      expect(dateFormat.value(helper.locale, null, 'N/A')).toBe('N/A')
      expect(dateTimeFormat.value(helper.locale, null, 'N/A')).toBe('N/A')
    })
    it('[なし]nullが返却される', () => {
      expect(dateFormat.value(helper.locale, '')).toBeNull()
      expect(dateTimeFormat.value(helper.locale, '')).toBeNull()
    })
    it('[なし/デフォルトあり]デフォルト値が返却される', () => {
      expect(dateFormat.value(helper.locale, '', 'N/A')).toBe('N/A')
      expect(dateTimeFormat.value(helper.locale, '', 'N/A')).toBe('N/A')
    })
    it('[あり]日付/日時が返却される', () => {
      expect(dateFormat.value(helper.locale, '2000-01-02T12:34:56+09:00')).toBe(helper.locale === 'ja' ? '2000/01/02' : '01/02/2000')
      expect(dateTimeFormat.value(helper.locale, '2000-01-02T12:34:56+09:00')).toBe(helper.locale === 'ja' ? '2000/01/02 12:34' : '01/02/2000, 12:34 PM')
    })
  })

  // ページの最初/最後の番号を返却
  describe('pageFirstNumber/pageLastNumber', () => {
    it('[null]nullが返却される', () => {
      expect(pageFirstNumber.value(null)).toBeNull()
      expect(pageLastNumber.value(null)).toBeNull()
    })
    it('[なし]nullが返却される', () => {
      expect(pageFirstNumber.value({})).toBeNull()
      expect(pageLastNumber.value({})).toBeNull()
    })
    it('[0件]1-0が返却される', () => {
      const info = Object.freeze({
        total_count: 0,
        current_page: 1,
        total_pages: 0,
        limit_value: 25
      })
      expect(pageFirstNumber.value(info)).toBe(1)
      expect(pageLastNumber.value(info)).toBe(0)
    })
    it('[2頁中1頁]1-25が返却される', () => {
      const info = Object.freeze({
        total_count: 26,
        current_page: 1,
        total_pages: 2,
        limit_value: 25
      })
      expect(pageFirstNumber.value(info)).toBe(1)
      expect(pageLastNumber.value(info)).toBe(25)
    })
    it('[2頁中2頁]26-26が返却される', () => {
      const info = Object.freeze({
        total_count: 26,
        current_page: 2,
        total_pages: 2,
        limit_value: 25
      })
      expect(pageFirstNumber.value(info)).toBe(26)
      expect(pageLastNumber.value(info)).toBe(26)
    })
  })

  // 数値を言語のフォーマットで返却
  describe('localeString', () => {
    it('[null]nullが返却される', () => {
      expect(localeString.value(helper.locale, null)).toBeNull()
    })
    it('[null/デフォルトあり]デフォルト値が返却される', () => {
      expect(localeString.value(helper.locale, null, 'N/A')).toBe('N/A')
    })
    it('[なし]nullが返却される', () => {
      expect(localeString.value(helper.locale, '')).toBeNull()
    })
    it('[なし/デフォルトあり]デフォルト値が返却される', () => {
      expect(localeString.value(helper.locale, '', 'N/A')).toBe('N/A')
    })
    it('[数値]値が返却される', () => {
      expect(localeString.value(helper.locale, '1000')).toBe('1000') // NOTE: testだとカンマ区切りにならない
    })
  })

  // テキストを省略して返却
  describe('textTruncate', () => {
    it('[null]nullが返却される', () => {
      expect(textTruncate.value(null, 1)).toBeNull()
    })
    it('[最大値]そのまま返却される', () => {
      expect(textTruncate.value('123', 3)).toBe('123')
    })
    it('[最大値以上]省略されて返却される', () => {
      expect(textTruncate.value('123', 2)).toBe('12...')
    })
  })

  // テーブルの高さを返却
  describe('tableHeight', () => {
    const margin = 64 + 16 + 16 + 40
    it('[高さが199+マージン]200pxが返却される', () => {
      expect(tableHeight.value(199 + margin)).toBe('200px')
    })
    it('[高さが200+マージン]200pxが返却される', () => {
      expect(tableHeight.value(200 + margin)).toBe('200px')
    })
    it('[高さが201+マージン]201pxが返却される', () => {
      expect(tableHeight.value(201 + margin)).toBe('201px')
    })
  })

  // タイムゾーンの差を返却 ex.'+09:00',
  const exceptTimeZoneOffset = '+09:00'
  describe('timeZoneOffset', () => {
    it(`${exceptTimeZoneOffset}が返却される`, () => {
      expect(timeZoneOffset.value()).toBe(exceptTimeZoneOffset)
    })
  })

  // タイムゾーンの略称を返却 ex.'JST'
  const exceptTimeZoneShortName = 'JST'
  describe('timeZoneShortName', () => {
    it(`${exceptTimeZoneShortName}が返却される`, () => {
      expect(timeZoneShortName.value()).toBe(exceptTimeZoneShortName)
    })
  })
})
