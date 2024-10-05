import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Component from '~/components/app/ListSetting.vue'

const $config = config.global.mocks.$config

describe('ListSetting.vue', () => {
  const model = 'member'
  const headers = $config.public.members.headers
  const allItems = headers.filter((item: any) => item.title != null).map((item: any) => item)
  const allItemKeys = allItems.map((item: any) => item.key)
  const requiredItemKeys = allItems.filter((item: any) => item.required).map((item: any) => item.key)
  const optionalItemKeys = allItems.filter((item: any) => !item.required).map((item: any) => item.key)
  const defaultShowItemKeys = allItems.filter((item: any) => !item.defaultHidden).map((item: any) => item.key)

  const mountFunction = (admin: boolean, hiddenItems = []) => {
    const wrapper = mount(Component, {
      props: {
        admin,
        model,
        headers,
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

    // ダイアログ
    const dialog = wrapper.find('#list_setting_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // 表示項目
    for (const item of allItems) {
      const showItem = wrapper.find(`#list_setting_show_item_${item.key.replace('.', '_')}`)
      if (!item.adminOnly || admin) {
        expect(showItem.exists()).toBe(true)
        expect(showItem.element.disabled).toBe(item.required || false)
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

    // ダイアログ
    expect(dialog.isDisabled()).toBe(false) // 無効（非表示）
  }

  const updateViewTest = async (wrapper: any, dialog: any, hiddenItems: any, showItems: any) => {
    // 入力
    for (const item of allItems) {
      const showItem = wrapper.find(`#list_setting_show_item_${item.key.replace('.', '_')}`)
      showItem.setValue(showItems.includes(item.key))
      await flushPromises()

      expect(showItem.element.checked).toBe(showItems.includes(item.key))
    }

    // 変更ボタン
    const button = wrapper.find('#list_setting_submit_btn')
    expect(button.element.disabled).toBe(false) // 有効
    button.trigger('click')
    await flushPromises()

    // ダイアログ
    expect(dialog.isDisabled()).toBe(false) // 無効（非表示）

    expect(localStorage.getItem(`${model}.show-items`)).toEqual(showItems.toString())
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
  it('[全解除→全選択→初期値ボタン]必須項目のみ選択される。全て選択される。初期値のみ選択される', async () => {
    const wrapper: any = mountFunction(true)
    wrapper.find('#list_setting_btn').trigger('click')
    await flushPromises()

    // ダイアログ
    const dialog = wrapper.find('#list_setting_dialog')
    expect(dialog.isVisible()).toBe(true) // 表示
    await flushPromises()

    // 全解除ボタン
    const clearBtn = wrapper.find('#list_setting_show_items_clear_btn')
    expect(clearBtn.exists()).toBe(true)
    clearBtn.trigger('click')
    await flushPromises()

    // 必須項目のみ選択
    expect(wrapper.vm.showItems).toEqual(requiredItemKeys)

    // 全選択ボタン
    const setAllBtn = wrapper.find('#list_setting_show_items_set_all_btn')
    expect(setAllBtn.exists()).toBe(true)
    setAllBtn.trigger('click')
    await flushPromises()

    // 全て選択
    expect(wrapper.vm.showItems).toEqual(allItemKeys)

    // 全選択ボタン
    const setDefaultBtn = wrapper.find('#list_setting_show_items_set_default_btn')
    expect(setDefaultBtn.exists()).toBe(true)
    setDefaultBtn.trigger('click')
    await flushPromises()

    // 初期値のみ選択
    expect(wrapper.vm.showItems).toEqual(defaultShowItemKeys)
  })

  describe('変更', () => {
    let wrapper: any, dialog: any
    const beforeAction = async (hiddenItems: any, showItems: any) => {
      wrapper = mountFunction(true, hiddenItems)
      wrapper.find('#list_setting_btn').trigger('click')
      await flushPromises()

      // 表示項目
      expect(wrapper.vm.showItems).toEqual(showItems)

      // ダイアログ
      dialog = wrapper.find('#list_setting_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示
    }

    it('[全て選択→全て未選択]非表示項目が任意項目のみに変更される', async () => {
      await beforeAction([], allItemKeys)
      await updateViewTest(wrapper, dialog, optionalItemKeys, requiredItemKeys)
    })
    it('[全て未選択→全て選択]非表示項目が空に変更される', async () => {
      await beforeAction(allItemKeys, requiredItemKeys) // NOTE: 必須のみ
      await updateViewTest(wrapper, dialog, [], allItemKeys)
    })
  })
})
