import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/ListSetting.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('ListSetting.vue', () => {
  const model = 'member'
  const items = helper.locales.items[model]
  const mountFunction = (admin, hiddenItems = []) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        admin,
        model,
        hiddenItems
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper, admin) => {
    // 表示ボタン
    const button = wrapper.find('#setting_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await helper.sleep(1)

    // 変更ダイアログ
    const dialog = wrapper.find('#setting_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // 表示項目
    for (const item of items) {
      const showItem = wrapper.find(`#setting_show_item_${item.value.replace('.', '_')}`)
      if (!item.adminOnly || admin) {
        expect(showItem.exists()).toBe(true)
        expect(showItem.element.disabled).toBe(item.required)
        expect(showItem.element.checked).toBe(true)
      } else {
        expect(showItem.exists()).toBe(false)
      }
    }
    await helper.sleep(1)

    // 変更ボタン
    const submitButton = wrapper.find('#setting_submit_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.vm.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#setting_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.vm.disabled).toBe(false) // 有効
    cancelButton.trigger('click')
    await helper.sleep(1)

    // 変更ダイアログ
    expect(dialog.isVisible()).toBe(false) // 非表示
  }

  const updateViewTest = async (wrapper, dialog, hiddenItems) => {
    // 変更
    for (const item of items) {
      const showItem = wrapper.find(`#setting_show_item_${item.value.replace('.', '_')}`)
      showItem.trigger('change')
      await helper.sleep(1)
    }

    // 変更ボタン
    const button = wrapper.find('#setting_submit_btn')
    expect(button.vm.disabled).toBe(false) // 有効
    button.trigger('click')
    await helper.sleep(1)

    // 変更ダイアログ
    expect(dialog.isVisible()).toBe(false) // 非表示

    expect(localStorage.getItem(`${model}.hidden-items`)).toEqual(hiddenItems.toString())
    expect(wrapper.emitted()['update:hiddenItems']).toEqual([[hiddenItems]])
  }

  // テストケース
  it('[管理者]全て表示される', async () => {
    const wrapper = mountFunction(true)
    await viewTest(wrapper, true)
  })
  it('[管理者以外]管理者のみの項目以外が表示される', async () => {
    const wrapper = mountFunction(false)
    await viewTest(wrapper, false)
  })

  describe('変更', () => {
    const allItems = items.map(item => item.value)
    const requiredItems = items.filter(item => item.required).map(item => item.value)
    const optionalItems = items.filter(item => !item.required).map(item => item.value)

    let wrapper, dialog
    const beforeAction = async (hiddenItems, showItems) => {
      wrapper = mountFunction(true, hiddenItems)
      wrapper.find('#setting_btn').trigger('click')

      // 表示項目
      expect(wrapper.vm.$data.showItems).toEqual(showItems)
      await helper.sleep(1)

      // 変更ダイアログ
      dialog = wrapper.find('#setting_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示
    }

    it('[全て選択→全て未選択]非表示項目が任意項目のみに変更される', async () => {
      await beforeAction([], allItems)
      await updateViewTest(wrapper, dialog, optionalItems)
    })
    it('[全て未選択→全て選択]非表示項目が空に変更される', async () => {
      await beforeAction(allItems, requiredItems)
      await updateViewTest(wrapper, dialog, [])
    })
  })
})
