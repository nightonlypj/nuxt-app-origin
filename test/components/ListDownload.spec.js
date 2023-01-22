import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Processing from '~/components/Processing.vue'
import Component from '~/components/ListDownload.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('ListDownload.vue', () => {
  let axiosPostMock, authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosPostMock = null
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const model = 'member'
  const items = helper.locales.items[model]
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
        $auth: {
          loggedIn: true,
          logout: authLogoutMock
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
  const defaultChecked = { target: 'all', format: 'csv', charCode: 'sjis', newlineCode: 'crlf' }
  const defaultDisabled = { select: true, search: true, all: false, submit: false }
  const viewTest = async (wrapper, admin, checked = defaultChecked, disabled = defaultDisabled, hiddenItems = []) => {
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // 表示ボタン
    const button = wrapper.find('#download_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await helper.sleep(1)

    // ダウンロードダイアログ
    const dialog = wrapper.find('#download_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // ダウンロードボタン
    const submitButton = wrapper.find('#download_submit_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.vm.disabled).toBe(false) // 有効

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
    for (const key in helper.locales.enums.download.charCode) {
      const charCode = wrapper.find(`#download_char_code_${key}`)
      expect(charCode.exists()).toBe(true)
      expect(charCode.element.checked).toBe(key === checked.charCode)
    }

    // 改行コード
    for (const key in helper.locales.enums.download.newlineCode) {
      const newlineCode = wrapper.find(`#download_newline_code_${key}`)
      expect(newlineCode.exists()).toBe(true)
      expect(newlineCode.element.checked).toBe(key === checked.newlineCode)
    }

    // 出力項目
    for (const item of items) {
      const outputItem = wrapper.find(`#download_output_item_${item.value.replace('.', '_')}`)
      if (!item.adminOnly || admin) {
        expect(outputItem.exists()).toBe(true)
        expect(outputItem.element.checked).toBe(!hiddenItems.includes(item.value))
      } else {
        expect(outputItem.exists()).toBe(false)
      }
    }

    // ダウンロードボタン
    await helper.waitChangeDisabled(submitButton, disabled.submit)
    expect(submitButton.vm.disabled).toBe(disabled.submit)

    // キャンセルボタン
    const cancelButton = wrapper.find('#download_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.vm.disabled).toBe(false) // 有効
    cancelButton.trigger('click')
    await helper.sleep(1)

    // ダウンロードダイアログ
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
    const searchParams = Object.freeze({ text: 'aaa' })
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
    const searchParams = Object.freeze({ text: 'aaa' })
    const wrapper = mountFunction(false, [], selectItems, searchParams)
    await viewTest(wrapper, false, { ...defaultChecked, target: 'search' }, { ...defaultDisabled, search: false })
  })
  it('[存在する形式・文字コード・改行コードがlocalStorageにある]localStorageの値が選択される', async () => {
    localStorage.setItem('download.format', 'tsv')
    localStorage.setItem('download.char_code', 'utf8')
    localStorage.setItem('download.newline_code', 'lf')
    const wrapper = mountFunction(false)
    await viewTest(wrapper, false, { ...defaultChecked, format: 'tsv', charCode: 'utf8', newlineCode: 'lf' })
  })
  it('[存在しない形式・文字コード・改行コードがlocalStorageにある]デフォルトが選択される', async () => {
    localStorage.setItem('download.format', 'not')
    localStorage.setItem('download.char_code', 'not')
    localStorage.setItem('download.newline_code', 'not')
    const wrapper = mountFunction(false)
    await viewTest(wrapper, false)
  })
  it('[出力項目なし]ダウンロードボタンが押せない', async () => {
    const hiddenItems = items.map(item => item.value)
    const wrapper = mountFunction(false, hiddenItems)
    await viewTest(wrapper, false, defaultChecked, { ...defaultDisabled, submit: true }, hiddenItems)
  })

  describe('ダウンロード依頼', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', download: { id: 1 } })
    const outputItems = items.map(item => item.value)
    const selectItems = Object.freeze(['code000000000000000000001'])
    const searchParams = Object.freeze({ text: 'aaa' })

    const query = {
      target: 'select',
      format: 'csv',
      char_code: 'sjis',
      newline_code: 'crlf'
    }
    const apiCalledTest = () => {
      expect(axiosPostMock).toBeCalledTimes(1)
      expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.downloads.createUrl, {
        download: {
          model,
          space_code: space.code || null,
          ...query,
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
      await helper.sleep(1)

      // ダウンロードダイアログ
      dialog = wrapper.find('#download_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // ダウンロードボタン
      button = wrapper.find('#download_submit_btn')
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
      expect(localStorage.getItem('download.format')).toBe(query.format)
      expect(localStorage.getItem('download.char_code')).toBe(query.char_code)
      expect(localStorage.getItem('download.newline_code')).toBe(query.newline_code)
      expect(dialog.isVisible()).toBe(false) // 非表示
      helper.mockCalledTest(routerPushMock, 1, { path: '/downloads', query: { target_id: data.download.id } })
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 403 } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.forbidden)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[存在しない]エラーページが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 404 } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.notfound)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
  })
})
