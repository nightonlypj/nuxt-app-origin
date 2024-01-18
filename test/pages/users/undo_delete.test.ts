import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import Page from '~/pages/users/undo_delete.vue'
import { activeUser, destroyUser } from '~/test/data/user'

describe('undo_delete.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthUser: null,
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      showError: vi.fn(),
      setData: vi.fn(),
      toast: helper.mockToast
    }
  })
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  const fullPath = '/users/undo_delete'

  const mountFunction = (loggedIn: boolean, user: object | null = null) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthUser', mock.useAuthUser)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn,
        user,
        setData: mock.setData
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({
      fullPath
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
  const viewTest = (wrapper: any, user: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.text()).toMatch(wrapper.vm.dateFormat('ja', user.destroy_schedule_at)) // 削除予定日
    if (user.destroy_requested_at != null) {
      expect(wrapper.text()).toMatch(wrapper.vm.dateTimeFormat('ja', user.destroy_requested_at)) // 削除依頼日時
    }
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
    helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
    helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
  })
  it('[ログイン中]トップページにリダイレクトされる', async () => {
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user: activeUser }])
    const wrapper = mountFunction(true, activeUser)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.mockCalledTest(mock.useAuthSignOut, 0)
    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.not_destroy_reserved })
    helper.mockCalledTest(mock.navigateTo, 1, '/')
  })
  it('[ログイン中（削除予約済み）]表示される', async () => {
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user: destroyUser }])
    const wrapper = mountFunction(true, destroyUser)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.mockCalledTest(mock.useAuthSignOut, 0)
    viewTest(wrapper, destroyUser)

    // 取り消しボタン
    const button: any = wrapper.find('#user_undo_delete_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(false) // 有効
    button.trigger('click')
    await flushPromises()

    // 確認ダイアログ
    const dialog: any = wrapper.find('#user_undo_delete_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // はいボタン
    const yesButton: any = wrapper.find('#user_undo_delete_yes_btn')
    expect(yesButton.exists()).toBe(true)
    expect(yesButton.element.disabled).toBe(false) // 有効

    // いいえボタン
    const noButton: any = wrapper.find('#user_undo_delete_no_btn')
    expect(noButton.exists()).toBe(true)
    expect(noButton.element.disabled).toBe(false) // 有効
    noButton.trigger('click')
    await flushPromises()

    // 確認ダイアログ
    expect(dialog.isDisabled()).toBe(false) // 無効（非表示）
  })
  it('[ログイン中（削除予約済み、削除依頼日時なし）]表示される', async () => {
    const user = Object.freeze({ ...destroyUser, destroy_requested_at: null })
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user }])
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    viewTest(wrapper, user)
  })

  describe('ユーザー情報更新', () => {
    let wrapper: any
    const beforeAction = async () => {
      wrapper = mountFunction(true, destroyUser)
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()
    }

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure } })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: false, status: 401 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー（メッセージなし）]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default } })
    })
  })

  describe('アカウント削除取り消し', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userUndoDeleteUrl, 'POST')
    }

    let wrapper: any, button: any
    const beforeAction = async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user: destroyUser }])
      wrapper = mountFunction(true, destroyUser)
      await flushPromises()

      // 取り消しボタン
      button = wrapper.find('#user_undo_delete_btn')
      button.trigger('click')
      await flushPromises()

      // はいボタン
      wrapper.find('#user_undo_delete_yes_btn').trigger('click')
      await flushPromises()

      apiCalledTest()
    }

    it('[成功]トップページにリダイレクトされる', async () => {
      const data = Object.freeze({ ...messages, user: activeUser })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.mockCalledTest(mock.setData, 1, data)
      helper.toastMessageTest(mock.toast, { error: messages.alert, success: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
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
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[その他エラー（メッセージなし）]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.default })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
