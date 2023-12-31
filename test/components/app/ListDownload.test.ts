import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppProcessing from '~/components/app/Processing.vue'
import Component from '~/components/app/ListDownload.vue'
import { detail as space } from '~/test/data/spaces'

describe('ListDownload.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      toast: helper.mockToast
    }
  })
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  const fullPath = `/members/${space.code}`
  const model = 'member'
  const items = helper.locales.items[model]

  const mountFunction = (admin = false, hiddenItems = [], selectItems: any = null, searchParams: any = null) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn: true
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({
      fullPath
    })))

    const wrapper = mount(Component, {
      global: {
        stubs: {
          AppProcessing: true
        }
      },
      props: {
        admin,
        model,
        space,
        hiddenItems,
        selectItems,
        searchParams
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const defaultChecked = { target: 'all', format: 'csv', charCode: 'sjis', newlineCode: 'crlf' }
  const defaultDisabled = { select: true, search: true, all: false, submit: false }
  const viewTest = async (wrapper: any, admin: boolean, checked = defaultChecked, disabled: any = defaultDisabled, hiddenItems: any = []) => {
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)

    // 表示ボタン
    const button = wrapper.find('#list_download_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await flushPromises()

    // ダウンロードダイアログ
    const dialog = wrapper.find('#list_download_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // ダウンロードボタン
    const submitButton = wrapper.find('#list_download_submit_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.element.disabled).toBe(false) // 有効

    // 対象
    for (const key in helper.locales.enums.download.target) {
      const target = wrapper.find(`#list_download_target_${key}`)
      expect(target.exists()).toBe(true)
      expect(target.element.checked).toBe(key === checked.target)
      expect(target.element.disabled).toBe(disabled[key])
    }

    // 形式
    for (const key in helper.locales.enums.download.format) {
      const format = wrapper.find(`#list_download_format_${key}`)
      expect(format.exists()).toBe(true)
      expect(format.element.checked).toBe(key === checked.format)
    }

    // 文字コード
    for (const key in helper.locales.enums.download.char_code) {
      const charCode = wrapper.find(`#list_download_char_code_${key}`)
      expect(charCode.exists()).toBe(true)
      expect(charCode.element.checked).toBe(key === checked.charCode)
    }

    // 改行コード
    for (const key in helper.locales.enums.download.newline_code) {
      const newlineCode = wrapper.find(`#list_download_newline_code_${key}`)
      expect(newlineCode.exists()).toBe(true)
      expect(newlineCode.element.checked).toBe(key === checked.newlineCode)
    }

    // 出力項目
    for (const item of items) {
      const outputItem = wrapper.find(`#list_download_output_item_${item.key.replace('.', '_')}`)
      if (!item.adminOnly || admin) {
        expect(outputItem.exists()).toBe(true)
        expect(outputItem.element.checked).toBe(!hiddenItems.includes(item.key))
      } else {
        expect(outputItem.exists()).toBe(false)
      }
    }
    await flushPromises()

    // ダウンロードボタン
    expect(submitButton.element.disabled).toBe(disabled.submit)

    // キャンセルボタン
    const cancelButton = wrapper.find('#list_download_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.element.disabled).toBe(false) // 有効
    cancelButton.trigger('click')
    await flushPromises()

    // ダウンロードダイアログ
    expect(dialog.isDisabled()).toBe(false) // 非表示
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
    const wrapper = mountFunction(false, [], ['code000000000000000000001'], { text: 'aaa' })
    await viewTest(wrapper, false, { ...defaultChecked, target: 'select' }, { ...defaultDisabled, select: false, search: false })
  })
  it('[選択項目あり]選択項目が選択され、検索は選択できない', async () => {
    const wrapper = mountFunction(false, [], ['code000000000000000000001'], {})
    await viewTest(wrapper, false, { ...defaultChecked, target: 'select' }, { ...defaultDisabled, select: false })
  })
  it('[検索パラメータあり]検索が選択され、選択項目は選択できない', async () => {
    const wrapper = mountFunction(false, [], [], { text: 'aaa' })
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
  it('[全解除→全選択ボタン]全て解除され、ダウンロードボタンが押せない。全て選択され、ダウンロードボタンが押せる', async () => {
    const wrapper: any = mountFunction(true)
    wrapper.find('#list_download_btn').trigger('click')
    await flushPromises()

    // ダウンロードダイアログ
    const dialog = wrapper.find('#list_download_dialog')
    expect(dialog.isVisible()).toBe(true) // 表示
    await flushPromises()

    // 全解除ボタン
    const clearBtn = wrapper.find('#list_download_output_items_clear_btn')
    expect(clearBtn.exists()).toBe(true)
    clearBtn.trigger('click')
    await flushPromises()

    // 全て解除
    expect(wrapper.vm.outputItems).toEqual([])

    // ダウンロードボタン
    const button: any = wrapper.find('#list_download_submit_btn')
    expect(button.element.disabled).toBe(true) // 無効

    // 全選択ボタン
    const setAllBtn = wrapper.find('#list_download_output_items_set_all_btn')
    expect(setAllBtn.exists()).toBe(true)
    setAllBtn.trigger('click')
    await flushPromises()

    // 全て選択
    const allItems = items.map(item => item.key)
    expect(wrapper.vm.outputItems).toEqual(allItems)

    // ダウンロードボタン
    expect(button.element.disabled).toBe(false) // 有効
  })

  describe('ダウンロード依頼', () => {
    const allItems = items.map(item => item.key)
    const selectItems = Object.freeze(['code000000000000000000001'])
    const searchParams = Object.freeze({ text: 'aaa' })
    const query = Object.freeze({
      target: 'select',
      format: 'csv',
      char_code: 'sjis',
      newline_code: 'crlf'
    })

    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.downloads.createUrl, 'POST', {
        download: {
          model,
          space_code: space.code,
          ...query,
          output_items: allItems,
          select_items: selectItems,
          search_params: searchParams
        }
      })
    }

    let wrapper: any, dialog: any, button: any
    const beforeAction = async () => {
      wrapper = mountFunction(true, [], selectItems, searchParams)
      wrapper.find('#list_download_btn').trigger('click')
      await flushPromises()

      // ダウンロードダイアログ
      dialog = wrapper.find('#list_download_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示
      await flushPromises()

      // ダウンロードボタン
      button = wrapper.find('#list_download_submit_btn')
      expect(button.element.disabled).toBe(false) // 有効
      button.trigger('click')
      await flushPromises()

      apiCalledTest()
    }

    it('[成功]ダウンロードページにリダイレクトされる', async () => {
      const data = Object.freeze({ ...messages, download: { id: '1' } })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      expect(localStorage.getItem('download.format')).toBe(query.format)
      expect(localStorage.getItem('download.char_code')).toBe(query.char_code)
      expect(localStorage.getItem('download.newline_code')).toBe(query.newline_code)
      expect(dialog.isDisabled()).toBe(false) // 非表示
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/downloads', query: { target_id: data.download.id } })
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー（メッセージなし）]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[権限エラー（メッセージなし）]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.forbidden })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[存在しない]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[存在しない（メッセージなし）]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.notfound })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { ...messages, errors: { output_items: ['errorメッセージ'] } }])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.default })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
  })
})