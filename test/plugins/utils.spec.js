import { createLocalVue, mount } from '@vue/test-utils'

describe('utils.js', () => {
  const localVue = createLocalVue()

  // 日付/時間を言語のフォーマットで返却
  describe('dateFormat/timeFormat', () => {
    const mountFunction = (value, locales, defaultValue = null) => {
      return mount({
        mounted () {
          this.dateFormat = this.$dateFormat(value, locales, defaultValue)
          this.timeFormat = this.$timeFormat(value, locales, defaultValue)
        },
        template: '<div />'
      }, { localVue })
    }

    it('[null]nullが返却される', () => {
      const wrapper = mountFunction(null, 'ja')
      expect(wrapper.vm.dateFormat).toBeNull()
      expect(wrapper.vm.timeFormat).toBeNull()
    })
    it('[null/デフォルトあり]デフォルト値が返却される', () => {
      const wrapper = mountFunction(null, 'ja', 'N/A')
      expect(wrapper.vm.dateFormat).toBe('N/A')
      expect(wrapper.vm.timeFormat).toBe('N/A')
    })
    it('[なし]nullが返却される', () => {
      const wrapper = mountFunction('', 'ja')
      expect(wrapper.vm.dateFormat).toBeNull()
      expect(wrapper.vm.timeFormat).toBeNull()
    })
    it('[なし/デフォルトあり]デフォルト値が返却される', () => {
      const wrapper = mountFunction('', 'ja', 'N/A')
      expect(wrapper.vm.dateFormat).toBe('N/A')
      expect(wrapper.vm.timeFormat).toBe('N/A')
    })
    it('[あり]日付が返却される', () => {
      const wrapper = mountFunction('2000-01-02T12:34:56+09:00', 'ja')
      expect(wrapper.vm.dateFormat).toBe('2000/01/02')
      expect(wrapper.vm.timeFormat).toBe('2000/01/02 12:34')
    })
  })

  // ページの最初/最後の番号を返却
  describe('pageFirstNumber/pageLastNumber', () => {
    const mountFunction = (info) => {
      return mount({
        mounted () {
          this.pageFirstNumber = this.$pageFirstNumber(info)
          this.pageLastNumber = this.$pageLastNumber(info)
        },
        template: '<div />'
      }, { localVue })
    }

    it('[null]nullが返却される', () => {
      const wrapper = mountFunction(null)
      expect(wrapper.vm.pageFirstNumber).toBeNull()
      expect(wrapper.vm.pageLastNumber).toBeNull()
    })
    it('[なし]nullが返却される', () => {
      const wrapper = mountFunction({})
      expect(wrapper.vm.pageFirstNumber).toBeNull()
      expect(wrapper.vm.pageLastNumber).toBeNull()
    })
    it('[0件]1-0が返却される', () => {
      const info = Object.freeze({
        total_count: 0,
        current_page: 1,
        total_pages: 0,
        limit_value: 25
      })
      const wrapper = mountFunction(info)
      expect(wrapper.vm.pageFirstNumber).toBe(1)
      expect(wrapper.vm.pageLastNumber).toBe(0)
    })
    it('[2頁中1頁]1-25が返却される', () => {
      const info = Object.freeze({
        total_count: 26,
        current_page: 1,
        total_pages: 2,
        limit_value: 25
      })
      const wrapper = mountFunction(info)
      expect(wrapper.vm.pageFirstNumber).toBe(1)
      expect(wrapper.vm.pageLastNumber).toBe(25)
    })
    it('[2頁中2頁]26-26が返却される', () => {
      const info = Object.freeze({
        total_count: 26,
        current_page: 2,
        total_pages: 2,
        limit_value: 25
      })
      const wrapper = mountFunction(info)
      expect(wrapper.vm.pageFirstNumber).toBe(26)
      expect(wrapper.vm.pageLastNumber).toBe(26)
    })
  })

  // 数値を言語のフォーマットで返却
  describe('localeString', () => {
    const mountFunction = (value, defaultValue = null) => {
      return mount({
        mounted () {
          this.localeString = this.$localeString(value, defaultValue)
        },
        template: '<div />'
      }, { localVue })
    }

    it('[null]nullが返却される', () => {
      const wrapper = mountFunction(null)
      expect(wrapper.vm.localeString).toBeNull()
    })
    it('[null/デフォルトあり]デフォルト値が返却される', () => {
      const wrapper = mountFunction(null, 'N/A')
      expect(wrapper.vm.localeString).toBe('N/A')
    })
    it('[なし]nullが返却される', () => {
      const wrapper = mountFunction('')
      expect(wrapper.vm.localeString).toBeNull()
    })
    it('[なし/デフォルトあり]デフォルト値が返却される', () => {
      const wrapper = mountFunction('', 'N/A')
      expect(wrapper.vm.localeString).toBe('N/A')
    })
    it('[数値]値が返却される', () => {
      const wrapper = mountFunction('1000')
      expect(wrapper.vm.localeString).toBe('1000') // NOTE: Jestだとカンマ区切りにならない
    })
  })
})
