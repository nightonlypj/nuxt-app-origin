import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/members/Search.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Search.vue', () => {
  const power = {}
  for (const key in helper.locales.enums.member.power) {
    power[key] = true
  }
  const query = Object.freeze({ text: '', option: false, power })

  const mountFunction = (admin = false) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        processing: false,
        query: { ...query },
        admin
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper, admin) => {
    if (admin) {
      expect(wrapper.vm.textPlaceholder).toMatch('メールアドレス')
    } else {
      expect(wrapper.vm.textPlaceholder).not.toMatch('メールアドレス')
    }

    // 検索ボタン
    const button = wrapper.find('#search_btn')
    expect(button.exists()).toBe(true)
    expect(button.vm.disabled).toBe(true) // 無効

    // 検索オプション
    const optionBtn = wrapper.find('#option_btn')
    const optionItem = wrapper.find('#option_item')
    expect(optionBtn.exists()).toBe(true)
    expect(optionItem.exists()).toBe(true)
    expect(optionItem.isVisible()).toBe(false) // 非表示
    optionBtn.trigger('click')
    await helper.sleep(1)

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
