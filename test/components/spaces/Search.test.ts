import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import Component from '~/components/spaces/Search.vue'

describe('Search.vue', () => {
  let optionQuery = {}
  if (helper.commonConfig.enablePublicSpace) {
    optionQuery = { public: true, private: true, join: true, nojoin: true }
  }
  const defaultQuery = Object.freeze({ text: '', option: false, ...optionQuery, active: true, destroy: false })
  const mountFunction = (loggedIn = false, query = defaultQuery) => {
    const wrapper = mount(Component, {
      global: {
        mocks: {
          $auth: {
            loggedIn
          }
        }
      },
      props: {
        processing: false,
        query: { ...query }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper: any, loggedIn: boolean) => {
    // 検索ボタン
    const button = wrapper.find('#space_search_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(true) // 無効

    // 検索オプション
    const optionBtn = wrapper.find('#space_search_option_btn')
    const optionItem = wrapper.find('#space_search_option_item')
    expect(optionBtn.exists()).toBe(loggedIn)
    expect(optionItem.exists()).toBe(loggedIn)
    if (loggedIn) {
      expect(optionItem.attributes('style')).toBe('display: none;') // 非表示 // NOTE: .isVisible()だとtrueになる為
      optionBtn.trigger('click')
      await flushPromises()

      expect(optionItem.isVisible()).toBe(true) // 表示
    }
  }

  // テストケース
  it('[未ログイン]表示される', async () => {
    const wrapper = mountFunction(false)
    await viewTest(wrapper, false)
  })
  it('[ログイン中]表示される', async () => {
    const wrapper = mountFunction(true)
    await viewTest(wrapper, true)
  })

  describe('検索', () => {
    let wrapper: any, button: any
    const beforeAction = async (options: any = { keydown: false, isComposing: null }) => {
      wrapper = mountFunction()

      // 入力
      wrapper.find('#space_search_text').setValue('a')
      await flushPromises()

      wrapper.vm.syncQuery = { ...wrapper.vm.syncQuery } // NOTE: setValueだとsyncQuery.setが呼ばれない為
      expect(wrapper.emitted()['update:query']).toEqual([[{ ...defaultQuery, text: 'a' }]])

      // 検索ボタン
      button = wrapper.find('#space_search_btn')
      expect(button.element.disabled).toBe(false) // 有効

      if (options.keydown) {
        const inputArea = wrapper.find('#space_search_area')
        inputArea.trigger('keydown.enter', { isComposing: options.isComposing })
        inputArea.trigger('keyup.enter')
      } else {
        button.trigger('click')
      }
      await flushPromises()
    }

    it('[ボタンクリック]検索される', async () => {
      await beforeAction()

      expect(wrapper.vm.$data.waiting).toBe(true)
      expect(wrapper.emitted().search).toEqual([[]]) // 検索

      // $refsで受け取り
      wrapper.vm.error()
      expect(wrapper.vm.$data.waiting).toBe(false)
    })
    it('[Enter送信]検索される', async () => {
      await beforeAction({ keydown: true, isComposing: false })

      expect(wrapper.vm.$data.waiting).toBe(true)
      expect(wrapper.emitted().search).toEqual([[]]) // 検索
    })
    it('[IME確定のEnter]検索されない', async () => {
      await beforeAction({ keydown: true, isComposing: true })

      expect(wrapper.vm.$data.waiting).toBe(false)
    })
  })

  describe('オプション', () => {
    let wrapper: any, button: any
    const beforeAction = async () => {
      wrapper = mountFunction(true)

      // 入力
      wrapper.find('#space_search_text').setValue('a')
      await flushPromises()

      // 検索ボタン
      button = wrapper.find('#space_search_btn')
      expect(button.element.disabled).toBe(false) // 有効
    }

    it('[公開・非公開]検索ボタンが無効になる', async () => {
      if (!helper.commonConfig.enablePublicSpace) { return }
      await beforeAction()

      // 公開・非公開
      wrapper.find('#space_search_public_check').setValue(false)
      wrapper.find('#space_search_private_check').setValue(false)
      await flushPromises()

      // 検索ボタン
      expect(button.element.disabled).toBe(true) // 無効
    })
    it('[参加・未参加]検索ボタンが無効になる', async () => {
      if (!helper.commonConfig.enablePublicSpace) { return }
      await beforeAction()

      // 参加・未参加
      wrapper.find('#space_search_join_check').setValue(false)
      wrapper.find('#space_search_nojoin_check').setValue(false)
      await flushPromises()

      // 検索ボタン
      expect(button.element.disabled).toBe(true) // 無効
    })
    it('[有効・削除予定]検索ボタンが無効になる', async () => {
      await beforeAction()

      // 有効・削除予定
      wrapper.find('#space_search_active_check').setValue(false)
      wrapper.find('#space_search_destroy_check').setValue(false)
      await flushPromises()

      // 検索ボタン
      expect(button.element.disabled).toBe(true) // 無効
    })
  })
})
