import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Processing from '~/components/Processing.vue'
import Component from '~/components/ListDownload.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('ListDownload.vue', () => {
  let axiosPostMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosPostMock = null
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const model = 'member'
  const space = Object.freeze({ code: 'code0001' })
  const mountFunction = (admin, hiddenItems = [], selectItems = null, searchParams = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        Processing: true
      },
      propsData: {
        admin,
        model,
        space,
        hiddenItems,
        selectItems,
        searchParams
      },
      mocks: {
        $axios: {
          post: axiosPostMock
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        },
        $router: {
          push: routerPushMock
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const defaultChecked = { target: 'all', format: 'csv', char: 'sjis', newline: 'crlf' }
  const defaultDisabled = { select: true, search: true, all: false, submit: false }
  const viewTest = async (wrapper, admin, checked = defaultChecked, disabled = defaultDisabled, hiddenItems = []) => {
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // 表示ボタン
    const button = wrapper.find('#download_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')

    // ダイアログ
    await helper.sleep(1)
    const dialog = wrapper.find('#download_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // 対象
    for (const key in helper.locales.enums.download.target) {
      const target = wrapper.find(`#download_target_${key}`)
      expect(target.exists()).toBe(true)
      expect(target.element.checked).toBe(key === checked.target)
      expect(target.element.disabled).toBe(disabled[key])
    }

    // 形式
    for (const key in helper.locales.enums.download.format) {
      const format = wrapper.find(`#download_format_${key}`)
      expect(format.exists()).toBe(true)
      expect(format.element.checked).toBe(key === checked.format)
    }

    // 文字コード
    for (const key in helper.locales.enums.download.char) {
      const char = wrapper.find(`#download_char_${key}`)
      expect(char.exists()).toBe(true)
      expect(char.element.checked).toBe(key === checked.char)
    }

    // 改行コード
    for (const key in helper.locales.enums.download.newline) {
      const newline = wrapper.find(`#download_newline_${key}`)
      expect(newline.exists()).toBe(true)
      expect(newline.element.checked).toBe(key === checked.newline)
    }

    // 出力項目
    for (const item of helper.locales.items[model]) {
      const outputItem = wrapper.find(`#download_output_item_${item.value.replace('.', '_')}`)
      if (!item.adminOnly || admin) {
        expect(outputItem.exists()).toBe(true)
        expect(outputItem.element.checked).toBe(!hiddenItems.includes(item.value))
      } else {
        expect(outputItem.exists()).toBe(false)
      }
    }

    // ダウンロードボタン
    const submitButton = wrapper.find('#download_submit_btn')
    expect(submitButton.exists()).toBe(true)
    await helper.waitChangeDisabled(submitButton, true)
    expect(submitButton.vm.disabled).toBe(disabled.submit)

    // キャンセルボタン
    const cancelButton = wrapper.find('#download_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.vm.disabled).toBe(false) // 有効
    cancelButton.trigger('click')

    // ダイアログ
    await helper.sleep(1)
    expect(dialog.isVisible()).toBe(false) // 非表示
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
  it('[選択項目・検索パラメータあり]選択項目が選択され、検索も選択できる', async () => {
    const selectItems = Object.freeze(['code000000000000000000001'])
    const searchParams = Object.freeze({ text: 'test' })
    const wrapper = mountFunction(false, [], selectItems, searchParams)
    await viewTest(wrapper, false, { ...defaultChecked, target: 'select' }, { ...defaultDisabled, select: false, search: false })
  })
  it('[選択項目あり]選択項目が選択され、検索は選択できない', async () => {
    const selectItems = Object.freeze(['code000000000000000000001'])
    const searchParams = Object.freeze({})
    const wrapper = mountFunction(false, [], selectItems, searchParams)
    await viewTest(wrapper, false, { ...defaultChecked, target: 'select' }, { ...defaultDisabled, select: false })
  })
  it('[検索パラメータあり]検索が選択され、選択項目は選択できない', async () => {
    const selectItems = Object.freeze([])
    const searchParams = Object.freeze({ text: 'test' })
    const wrapper = mountFunction(false, [], selectItems, searchParams)
    await viewTest(wrapper, false, { ...defaultChecked, target: 'search' }, { ...defaultDisabled, search: false })
  })
  it('[存在する形式・文字コード・改行コードがlocalStorageにある]localStorageの値が選択される', async () => {
    localStorage.setItem('download.format', 'tsv')
    localStorage.setItem('download.char', 'utf8')
    localStorage.setItem('download.newline', 'lf')
    const wrapper = mountFunction(false)
    await viewTest(wrapper, false, { ...defaultChecked, format: 'tsv', char: 'utf8', newline: 'lf' })
  })
  it('[存在しない形式・文字コード・改行コードがlocalStorageにある]デフォルトが選択される', async () => {
    localStorage.setItem('download.format', 'not')
    localStorage.setItem('download.char', 'not')
    localStorage.setItem('download.newline', 'not')
    const wrapper = mountFunction(false)
    await viewTest(wrapper, false)
  })
  it('[出力項目なし]ダウンロードボタンが押せない', async () => {
    const hiddenItems = []
    for (const item of helper.locales.items[model]) {
      hiddenItems.push(item.value)
    }
    const wrapper = mountFunction(false, hiddenItems)
    await viewTest(wrapper, false, defaultChecked, { ...defaultDisabled, submit: true }, hiddenItems)
  })

  describe('ダウンロード依頼', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', download: { id: 1 } })
    const outputItems = []
    for (const item of helper.locales.items[model]) {
      outputItems.push(item.value)
    }
    const selectItems = Object.freeze(['code000000000000000000001'])
    const searchParams = Object.freeze({ text: 'test' })

    const format = 'csv'
    const char = 'sjis'
    const newline = 'crlf'
    const apiCalledTest = () => {
      expect(axiosPostMock).toBeCalledTimes(1)
      expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.downloadCreateUrl, {
        download: {
          model,
          space_code: space.code || null,
          target: 'select',
          format,
          char,
          newline,
          output_items: outputItems,
          select_items: selectItems,
          search_params: searchParams
        }
      })
    }

    let wrapper, dialog, button
    const beforeAction = async () => {
      wrapper = mountFunction(true, [], selectItems, searchParams)
      wrapper.find('#download_btn').trigger('click')

      // ダイアログ
      await helper.sleep(1)
      dialog = wrapper.find('#download_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // ダウンロードボタン
      button = wrapper.find('#download_submit_btn')
      await helper.waitChangeDisabled(button, false)
      expect(button.vm.disabled).toBe(false) // 有効
      button.trigger('click')

      await helper.sleep(1)
      apiCalledTest()
    }

    it('[成功]ダウンロードページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      expect(localStorage.getItem('download.format')).toBe(format)
      expect(localStorage.getItem('download.char')).toBe(char)
      expect(localStorage.getItem('download.newline')).toBe(newline)
      expect(dialog.isVisible()).toBe(false) // 非表示
      helper.mockCalledTest(routerPushMock, 1, { path: '/downloads', query: { id: data.download.id } })
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 403 } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.forbidden)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[存在しない]エラーページが表示される', async () => {
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 404, data } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
  })
})
