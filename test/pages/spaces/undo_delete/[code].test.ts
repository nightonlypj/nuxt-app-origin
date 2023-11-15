import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import Page from '~/pages/spaces/undo_delete/[code].vue'

describe('[code].vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthUser: vi.fn(),
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      showError: vi.fn(),
      toast: helper.mockToast
    }
  })

  const space = Object.freeze({
    code: 'code0001',
    destroy_requested_at: '2000-01-01T12:34:56+09:00',
    destroy_schedule_at: '2000-01-08T12:34:56+09:00'
  })
  const spaceAdmin = Object.freeze({
    ...space,
    current_member: {
      power: 'admin'
    }
  })

  const fullPath = '/spaces/undo_delete/code0001'
  const mountFunction = (loggedIn = true, user: object | null = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthUser', mock.useAuthUser)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn,
        user
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({
      fullPath,
      params: {
        code: space.code
      }
    })))

    const wrapper = mount(Page, {
      global: {
        stubs: {
          AppLoading: true,
          AppProcessing: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.text()).toMatch(wrapper.vm.dateTimeFormat('ja', space.destroy_requested_at)) // 削除依頼日時
    expect(wrapper.text()).toMatch(wrapper.vm.dateFormat('ja', space.destroy_schedule_at)) // 削除予定日
  }

  // テストケース
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, null)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
    helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
    helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
  })
  it('[ログイン中（管理者）]表示される', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: spaceAdmin }])
    const user = Object.freeze({ destroy_schedule_at: null })
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    viewTest(wrapper)

    // 削除取り消しボタン
    const button: any = wrapper.find('#space_undo_delete_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(false) // 有効
    button.trigger('click')
    await flushPromises()

    // 確認ダイアログ
    const dialog: any = wrapper.find('#space_undo_delete_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // はいボタン
    const yesButton: any = wrapper.find('#space_undo_delete_yes_btn')
    expect(yesButton.exists()).toBe(true)
    expect(yesButton.element.disabled).toBe(false) // 有効

    // いいえボタン
    const noButton: any = wrapper.find('#space_undo_delete_no_btn')
    expect(noButton.exists()).toBe(true)
    expect(noButton.element.disabled).toBe(false) // 有効
    noButton.trigger('click')
    await flushPromises()

    // 確認ダイアログ
    expect(dialog.isDisabled()).toBe(false) // 非表示
  })
  it('[ログイン中（管理者以外）]スペーストップにリダイレクトされる', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space }])
    const user = Object.freeze({ destroy_schedule_at: null })
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.forbidden })
    helper.mockCalledTest(mock.navigateTo, 1, `/-/${space.code}`)
  })
  it('[ログイン中][スペース削除予定なし]スペーストップにリダイレクトされる', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: { ...spaceAdmin, destroy_schedule_at: null } }])
    const user = Object.freeze({ destroy_schedule_at: null })
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: helper.locales.alert.space.not_destroy_reserved })
    helper.mockCalledTest(mock.navigateTo, 1, `/-/${space.code}`)
  })
  it('[ログイン中（削除予約済み）]スペーストップにリダイレクトされる', async () => {
    const user = Object.freeze({ destroy_schedule_at: '2000-01-08T12:34:56+09:00' })
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
    helper.mockCalledTest(mock.navigateTo, 1, `/-/${space.code}`)
  })

  describe('スペース詳細取得', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaces.detailUrl.replace(':code', space.code))
    }

    const beforeAction = async () => {
      mountFunction()
      await flushPromises()

      apiCalledTest()
    }

    it('[データなし]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error } })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure } })
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
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: messages })
    })
    it('[権限エラー（メッセージなし）]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: { alert: helper.locales.auth.forbidden } })
    })
    it('[存在しない]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: messages })
    })
    it('[存在しない（メッセージなし）]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: {} })
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default } })
    })
  })

  describe('スペース削除取り消し', () => {
    const data = Object.freeze({ ...messages, space: {} })
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(2)
      const url = helper.commonConfig.spaces.undoDeleteUrl.replace(':code', space.code)
      expect(mock.useApiRequest).nthCalledWith(2, helper.envConfig.apiBaseURL + url, 'POST')
    }

    let wrapper: any, button: any
    const beforeAction = async (undoDeleteResponse: any) => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200 }, { space: spaceAdmin }])
        .mockImplementationOnce(() => undoDeleteResponse)
      wrapper = mountFunction()
      await flushPromises()

      // 削除取り消しボタン
      button = wrapper.find('#space_undo_delete_btn')
      button.trigger('click')
      await flushPromises()

      // はいボタン
      wrapper.find('#space_undo_delete_yes_btn').trigger('click')
      await flushPromises()

      apiCalledTest()
    }

    it('[成功]スペーストップにリダイレクトされる', async () => {
      await beforeAction([{ ok: true, status: 200 }, data])

      helper.mockCalledTest(mock.useAuthUser, 1)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, success: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, `/-/${space.code}`)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: true, status: 200 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: null }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      await beforeAction([{ ok: false, status: 401 }, messages])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー（メッセージなし）]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      await beforeAction([{ ok: false, status: 401 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 403 }, messages])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[権限エラー（メッセージなし）]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 403 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.forbidden })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[存在しない]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 404 }, messages])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[存在しない（メッセージなし）]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 404 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.notfound })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 406 }, messages])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[削除予約済み（メッセージなし）]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 406 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 500 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 400 }, {}])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.default })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
