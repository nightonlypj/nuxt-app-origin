import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Component from '~/components/members/Search.vue'

const $t = config.global.mocks.$t
const $tm = config.global.mocks.$tm

describe('Search.vue', () => {
  const power: any = {}
  for (const key in $tm('enums.member.power')) {
    power[key] = true
  }
  const query = Object.freeze({ text: '', option: false, power: Object.freeze({ ...power }), active: true, destroy: true })

  const mountFunction = (admin = false) => {
    const wrapper = mount(Component, {
      props: {
        processing: false,
        query: { ...query, power: { ...power } }, // NOTE: 他のテストの影響を受ける為
        admin
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper: any, admin: boolean) => {
    const text = wrapper.find('#member_search_text')
    expect(text.element.attributes[0].value).toBe($t(admin ? 'ユーザー名やメールアドレスを入力' : 'ユーザー名を入力'))

    // 検索ボタン
    const button = wrapper.find('#member_search_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(true) // 無効

    // 検索オプション
    const optionBtn = wrapper.find('#member_search_option_btn')
    const optionItem = wrapper.find('#member_search_option_item')
    expect(optionBtn.exists()).toBe(true)
    expect(optionItem.exists()).toBe(true)
    expect(optionItem.attributes('style')).toBe('display: none;') // 非表示 // NOTE: .isVisible()だとtrueになる為
    optionBtn.trigger('click')
    await flushPromises()

    expect(optionItem.isVisible()).toBe(true) // 表示
  }

  // テストケース
  it('[管理者]表示される', async () => {
    const wrapper = mountFunction(true)
    await viewTest(wrapper, true)
  })
  it('[管理者以外]表示される', async () => {
    const wrapper = mountFunction(false)
    await viewTest(wrapper, false)
  })

  describe('検索', () => {
    let wrapper: any, button: any
    const beforeAction = async (options: any = { keydown: false, isComposing: null }) => {
      wrapper = mountFunction()

      // 入力
      wrapper.find('#member_search_text').setValue('a')
      await flushPromises()

      wrapper.vm.syncQuery = { ...wrapper.vm.syncQuery } // NOTE: setValueだとsyncQuery.setが呼ばれない為
      expect(wrapper.emitted()['update:query']).toEqual([[{ ...query, text: 'a' }]])

      // 検索ボタン
      button = wrapper.find('#member_search_btn')
      expect(button.element.disabled).toBe(false) // 有効

      if (options.keydown) {
        const inputArea = wrapper.find('#member_search_area')
        inputArea.trigger('keydown.enter', { isComposing: options.isComposing })
        inputArea.trigger('keyup.enter')
      } else {
        button.trigger('click')
      }
      await flushPromises()
    }

    it('[ボタンクリック]検索される', async () => {
      await beforeAction()

      expect(wrapper.vm.waiting).toBe(true)
      expect(wrapper.emitted().search).toEqual([[]]) // 検索

      wrapper.vm.updateWaiting(false) // $refsで受け取る
      expect(wrapper.vm.waiting).toBe(false)
    })
    it('[Enter送信]検索される', async () => {
      await beforeAction({ keydown: true, isComposing: false })

      expect(wrapper.vm.waiting).toBe(true)
      expect(wrapper.emitted().search).toEqual([[]]) // 検索
    })
    it('[IME確定のEnter]検索されない', async () => {
      await beforeAction({ keydown: true, isComposing: true })

      expect(wrapper.vm.waiting).toBe(false)
    })
  })

  describe('オプション', () => {
    let wrapper: any, button: any
    const beforeAction = async () => {
      wrapper = mountFunction(true)

      // 入力
      wrapper.find('#member_search_text').setValue('a')
      await flushPromises()

      // 検索ボタン
      button = wrapper.find('#member_search_btn')
      expect(button.element.disabled).toBe(false) // 有効
    }

    it('[権限]検索ボタンが無効になる', async () => {
      await beforeAction()

      // 権限
      for (const key in $tm('enums.member.power')) {
        wrapper.find(`#member_search_power_${key}_check`).setValue(false)
      }
      await flushPromises()

      // 検索ボタン
      expect(button.element.disabled).toBe(true) // 無効
    })
    it('[状態]検索ボタンが無効になる', async () => {
      await beforeAction()

      // 有効・削除予定
      wrapper.find('#member_search_active_check').setValue(false)
      wrapper.find('#member_search_destroy_check').setValue(false)
      await flushPromises()

      // 検索ボタン
      expect(button.element.disabled).toBe(true) // 無効
    })
  })
})
