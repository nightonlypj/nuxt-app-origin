import { config } from '@vue/test-utils'
import { dateFormat, dateTimeFormat, pageFirstNumber, pageLastNumber, localeString, textTruncate, timeZoneOffset, timeZoneShortName, tableHiddenItems, tableHeaders } from '~/utils/display'
import helper from '~/test/helper'

const $t = config.global.mocks.$t

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

  // タイムゾーンの差を返却 ex.'+09:00',
  const exceptTimeZoneOffset = '+09:00'
  describe('timeZoneOffset', () => {
    it(`${exceptTimeZoneOffset}が返却される`, () => {
      expect(timeZoneOffset.value).toBe(exceptTimeZoneOffset)
    })
  })

  // タイムゾーンの略称を返却 ex.'JST'
  const exceptTimeZoneShortName = 'JST'
  describe('timeZoneShortName', () => {
    it(`${exceptTimeZoneShortName}が返却される`, () => {
      expect(timeZoneShortName.value).toBe(exceptTimeZoneShortName)
    })
  })

  // 非表示項目をlocalStorageまたはheadersから取得して返却（追加項目はdefaultHiddenで判断）
  describe('tableHiddenItems', () => {
    const model = 'name'
    const headers = [
      { key: 'show1' },
      { key: 'show2' },
      { key: 'show_add' },
      { key: 'hidden1', defaultHidden: true },
      { key: 'hidden2', defaultHidden: true },
      { key: 'hidden_add', defaultHidden: true }
    ]

    describe('localStorageのhidden-itemsがない', () => {
      it('デフォルト非表示の項目が返却される', () => {
        expect(tableHiddenItems.value(model, headers)).toEqual(['hidden1', 'hidden2', 'hidden_add'])
      })
    })
    describe('localStorageのhidden-itemsが空', () => {
      it('デフォルト非表示の項目が返却される', () => {
        localStorage.setItem(`${model}.hidden-items`, '')
        expect(tableHiddenItems.value(model, headers)).toEqual(['hidden1', 'hidden2', 'hidden_add'])
      })
    })
    describe('localStorageのhidden-itemsがある（追加項目なし）', () => {
      describe('localStorageのshow-itemsがない', () => {
        it('非表示設定項目と非表示追加項目が返却される', () => {
          localStorage.setItem(`${model}.hidden-items`, 'hidden1,hidden2')
          expect(tableHiddenItems.value(model, headers)).toEqual(['hidden1', 'hidden2', 'hidden_add'])
        })
      })
      describe('localStorageのshow-itemsが空', () => {
        it('非表示設定項目と非表示追加項目が返却される', () => {
          localStorage.setItem(`${model}.hidden-items`, 'show1,show2,hidden1,hidden2')
          localStorage.setItem(`${model}.show-items`, '')
          expect(tableHiddenItems.value(model, headers)).toEqual(['show1', 'show2', 'hidden1', 'hidden2', 'hidden_add'])
        })
      })
      describe('localStorageのshow-itemsがある（追加項目なし）', () => {
        it('非表示設定項目と非表示追加項目が返却される', () => {
          localStorage.setItem(`${model}.hidden-items`, 'hidden1,hidden2')
          localStorage.setItem(`${model}.show-items`, 'show1,show2')
          expect(tableHiddenItems.value(model, headers)).toEqual(['hidden1', 'hidden2', 'hidden_add'])
        })
      })
    })
    describe('localStorageのhidden-itemsがある（追加項目あり）', () => {
      describe('localStorageのshow-itemsがない', () => {
        it('非表示設定項目が返却される', () => {
          localStorage.setItem(`${model}.hidden-items`, 'hidden1,hidden2,hidden_add')
          expect(tableHiddenItems.value(model, headers)).toEqual(['hidden1', 'hidden2', 'hidden_add'])
        })
      })
      describe('localStorageのshow-itemsが空', () => {
        it('非表示設定項目が返却される', () => {
          localStorage.setItem(`${model}.hidden-items`, 'show1,show2,show_add,hidden1,hidden2,hidden_add')
          localStorage.setItem(`${model}.show-items`, '')
          expect(tableHiddenItems.value(model, headers)).toEqual(['show1', 'show2', 'show_add', 'hidden1', 'hidden2', 'hidden_add'])
        })
      })
      describe('localStorageのshow-itemsがある（追加項目あり）', () => {
        it('非表示設定項目が返却される', () => {
          localStorage.setItem(`${model}.hidden-items`, 'hidden1,hidden2,hidden_add')
          localStorage.setItem(`${model}.show-items`, 'show1,show2,show_add')
          expect(tableHiddenItems.value(model, headers)).toEqual(['hidden1', 'hidden2', 'hidden_add'])
        })
      })
    })
  })

  // テーブルのヘッダ情報を返却
  describe('tableHeaders', () => {
    const headers = [
      { key: 'data-table-select', adminOnly: true },
      { title: '必須', key: 'required', required: true },
      { key: 'hidden' },
      { key: 'sortable', sortable: false },
      { key: 'align-end', align: 'end' },
      { key: 'align-center', align: 'center' },
      { key: 'header-props', headerProps: { class: 'px-2 text-no-wrap' } },
      { key: 'cell-props', cellProps: { class: 'px-1 py-2 text-no-wrap' } },
      { key: 'width', width: 100 }
    ]
    const hiddenItems = [
      'required', // NOTE: 表示される事を確認
      'hidden'
    ]
    const defaultResponse = { title: '', sortable: true, headerProps: { class: 'text-no-wrap' }, cellProps: { class: 'px-1 py-2' } }
    const expectResponse = [
      { ...defaultResponse, title: $t('必須'), key: 'required' },
      { ...defaultResponse, key: 'sortable', sortable: false },
      { ...defaultResponse, key: 'align-end', cellProps: { class: 'pl-1 pr-6 py-2' }, align: 'end' },
      { ...defaultResponse, key: 'align-center', align: 'center' },
      { ...defaultResponse, key: 'header-props', headerProps: { class: 'px-2 text-no-wrap' } },
      { ...defaultResponse, key: 'cell-props', cellProps: { class: 'px-1 py-2 text-no-wrap' } },
      { ...defaultResponse, key: 'width', width: 100 }
    ]
    const expectResponseAdmin = [
      { ...defaultResponse, key: 'data-table-select', headerProps: { class: 'px-0' }, cellProps: { class: 'px-0 py-2' } },
      ...expectResponse
    ]

    describe('adminが未指定', () => {
      it('期待値が返却される', () => {
        expect(tableHeaders.value($t, headers, hiddenItems)).toEqual(expectResponse)
      })
    })
    describe('adminがfalse', () => {
      it('期待値が返却される', () => {
        expect(tableHeaders.value($t, headers, hiddenItems, false)).toEqual(expectResponse)
      })
    })
    describe('adminがtrue', () => {
      it('期待値（管理者）が返却される', () => {
        expect(tableHeaders.value($t, headers, hiddenItems, true)).toEqual(expectResponseAdmin)
      })
    })
  })
})
