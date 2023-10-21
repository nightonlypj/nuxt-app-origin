import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import Component from '~/components/app/ListSetting.vue'

describe('ListSetting.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      setItem: vi.fn()
    }
  })

  const model = 'member'
  const items = helper.locales.items[model]
  const mountFunction = (admin: boolean, hiddenItems = []) => {
    vi.stubGlobal('localStorage', { setItem: mock.setItem })

    const wrapper = mount(Component, {
      props: {
        admin,
        model,
        hiddenItems
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper: any, admin: boolean) => {
    // 表示ボタン
    const button = wrapper.find('#list_setting_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await flushPromises()

    // 変更ダイアログ
    const dialog = wrapper.find('#list_setting_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // 表示項目
    for (const item of items) {
      const showItem = wrapper.find(`#list_setting_show_item_${item.key.replace('.', '_')}`)
      if (!item.adminOnly || admin) {
        expect(showItem.exists()).toBe(true)
        expect(showItem.element.disabled).toBe(item.required)
        expect(showItem.element.checked).toBe(true)
      } else {
        expect(showItem.exists()).toBe(false)
      }
    }
    await flushPromises()

    // 変更ボタン
    const submitButton = wrapper.find('#list_setting_submit_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.element.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#list_setting_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.element.disabled).toBe(false) // 有効
    cancelButton.trigger('click')
    await flushPromises()

    // 変更ダイアログ
    expect(dialog.isDisabled()).toBe(false) // 非表示
  }

  const updateViewTest = async (wrapper: any, dialog: any, hiddenItems: any, displayItems: any) => {
    // 入力
    for (const item of items) {
      const showItem = wrapper.find(`#list_setting_show_item_${item.key.replace('.', '_')}`)
      showItem.setValue(displayItems.includes(item.key))
      await flushPromises()

      expect(showItem.element.checked).toBe(displayItems.includes(item.key))
    }
    await flushPromises()

    // 変更ボタン
    const button = wrapper.find('#list_setting_submit_btn')
    expect(button.element.disabled).toBe(false) // 有効
    button.trigger('click')
    await flushPromises()

    // 変更ダイアログ
    expect(dialog.isDisabled()).toBe(false) // 非表示

    helper.mockCalledTest(mock.setItem, 1, `${model}.hidden-items`, hiddenItems.toString())
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
  it('[全解除→全選択ボタン]必須項目のみ選択される。全て選択される', async () => {
    const wrapper = mountFunction(true)
    wrapper.find('#list_setting_btn').trigger('click')
    await flushPromises()

    // 変更ダイアログ
    const dialog = wrapper.find('#list_setting_dialog')
    expect(dialog.isVisible()).toBe(true) // 表示
    await flushPromises()

    // 全解除ボタン
    const clearBtn = wrapper.find('#list_setting_show_items_clear_btn')
    expect(clearBtn.exists()).toBe(true)
    clearBtn.trigger('click')
    await flushPromises()

    // 必須項目のみ選択
    const requiredItems = items.filter(item => item.required).map(item => item.key)
    expect(wrapper.vm.$data.showItems).toEqual(requiredItems)

    // 全選択ボタン
    const setAllBtn = wrapper.find('#list_setting_show_items_set_all_btn')
    expect(setAllBtn.exists()).toBe(true)
    setAllBtn.trigger('click')
    await flushPromises()

    // 全て選択
    const allItems = items.map(item => item.key)
    expect(wrapper.vm.$data.showItems).toEqual(allItems)
  })

  describe('変更', () => {
    const allItems = items.map(item => item.key)
    const requiredItems = items.filter(item => item.required).map(item => item.key)
    const optionalItems = items.filter(item => !item.required).map(item => item.key)

    let wrapper: any, dialog: any
    const beforeAction = async (hiddenItems: any, showItems: any) => {
      wrapper = mountFunction(true, hiddenItems)
      wrapper.find('#list_setting_btn').trigger('click')

      // 表示項目
      expect(wrapper.vm.$data.showItems).toEqual(showItems)
      await flushPromises()

      // 変更ダイアログ
      dialog = wrapper.find('#list_setting_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示
    }

    it('[全て選択→全て未選択]非表示項目が任意項目のみに変更される', async () => {
      await beforeAction([], allItems)
      await updateViewTest(wrapper, dialog, optionalItems, requiredItems)
    })
    it('[全て未選択→全て選択]非表示項目が空に変更される', async () => {
      await beforeAction(allItems, requiredItems) // NOTE: 必須のみ
      await updateViewTest(wrapper, dialog, [], allItems)
    })
  })
})
