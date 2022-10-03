import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/spaces/Setting.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Setting.vue', () => {
  const selectShowItem = 'description'
  const allShowItems = Object.freeze(['name', selectShowItem, 'action'])
  const requiredShowItems = Object.freeze(['name', 'action'])

  const mountFunction = (showItems = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        showItems
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper) => {
    // 表示項目変更ボタン
    const button = wrapper.find('#space_setting_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')

    // 表示項目変更ダイアログ
    await helper.sleep(1)
    const dialog = wrapper.find('#space_setting_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // 表示項目
    for (const key of allShowItems) {
      const showItem = wrapper.find('#show_item_' + key)
      expect(showItem.exists()).toBe(true)
      expect(showItem.element.disabled).toBe(requiredShowItems.includes(key))
    }

    // 変更ボタン
    const submitButton = wrapper.find('#space_setting_submit_btn')
    expect(submitButton.exists()).toBe(true)
    await helper.waitChangeDisabled(submitButton, true)
    expect(submitButton.vm.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#space_setting_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.vm.disabled).toBe(false) // 有効
    cancelButton.trigger('click')

    // 表示項目変更ダイアログ
    await helper.sleep(1)
    expect(dialog.isVisible()).toBe(false) // 非表示
  }

  const updateViewTest = async (wrapper, dialog, selectShowItem, newShowItems) => {
    // 変更
    wrapper.find('#show_item_' + selectShowItem).trigger('change')

    // 変更ボタン
    const button = wrapper.find('#space_setting_submit_btn')
    expect(button.exists()).toBe(true)
    await helper.waitChangeDisabled(button, false)
    expect(button.vm.disabled).toBe(false) // 有効
    button.trigger('click')

    // 表示項目変更ダイアログ
    await helper.sleep(1)
    expect(dialog.isVisible()).toBe(false) // 非表示

    expect(localStorage.getItem('spaces.show-items')).toEqual(newShowItems.toString())
    expect(wrapper.emitted()['update:showItems']).toEqual([[newShowItems]])
  }

  // テストケース
  it('表示される', async () => {
    const wrapper = mountFunction()
    await viewTest(wrapper)
  })

  describe('変更', () => {
    let wrapper, dialog
    const beforeAction = async (showItems, newShowItems) => {
      wrapper = mountFunction(showItems)
      wrapper.find('#space_setting_btn').trigger('click')

      // 表示項目
      expect(wrapper.vm.$data.newShowItems).toEqual(newShowItems)

      // 表示項目変更ダイアログ
      await helper.sleep(1)
      dialog = wrapper.find('#space_setting_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示
    }

    it('[未設定]全て選択され、変更が保存される', async () => {
      await beforeAction(null, allShowItems)
      await updateViewTest(wrapper, dialog, selectShowItem, allShowItems.filter(item => item !== selectShowItem))
    })
    it('[全て選択]全て選択され、変更が保存される', async () => {
      await beforeAction(allShowItems, allShowItems)
      await updateViewTest(wrapper, dialog, selectShowItem, allShowItems.filter(item => item !== selectShowItem))
    })
    it('[全て未選択]必須項目のみ選択され、変更が保存される', async () => {
      await beforeAction([], requiredShowItems)
      await updateViewTest(wrapper, dialog, selectShowItem, requiredShowItems.concat([selectShowItem]))
    })
  })
})
