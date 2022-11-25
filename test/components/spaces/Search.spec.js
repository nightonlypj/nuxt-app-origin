import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/spaces/Search.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Search.vue', () => {
  const query = Object.freeze({ text: '', option: false, exclude: false })

  const mountFunction = (loggedIn = false) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        processing: false,
        query: { ...query }
      },
      mocks: {
        $auth: {
          loggedIn
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper, loggedIn) => {
    // 検索ボタン
    const button = wrapper.find('#search_btn')
    expect(button.exists()).toBe(true)
    expect(button.vm.disabled).toBe(true) // 無効

    // 検索オプション
    const optionBtn = wrapper.find('#option_btn')
    const optionItem = wrapper.find('#option_item')
    expect(optionBtn.exists()).toBe(loggedIn)
    expect(optionItem.exists()).toBe(loggedIn)
    if (loggedIn) {
      expect(optionItem.isVisible()).toBe(false) // 非表示
      optionBtn.trigger('click')

      await helper.sleep(1)
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
    let wrapper, button
    const beforeAction = async (options = { keydown: false, isComposing: null }) => {
      wrapper = mountFunction()

      // 入力
      wrapper.find('#search_text').trigger('input')

      // 検索ボタン
      button = wrapper.find('#search_btn')
      await helper.waitChangeDisabled(button, false)
      expect(button.vm.disabled).toBe(false) // 有効

      if (options.keydown) {
        const inputArea = wrapper.find('#input_area')
        inputArea.trigger('keydown.enter', { isComposing: options.isComposing })
        inputArea.trigger('keyup.enter')
      } else {
        button.trigger('click')
      }

      await helper.sleep(1)
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
})
