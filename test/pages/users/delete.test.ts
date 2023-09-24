import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import Page from '~/pages/users/delete.vue'

describe('delete.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthUser: null,
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      showError: vi.fn(),
      toast: helper.mockToast
    }
  })

  const fullPath = '/users/delete'
  const mountFunction = (loggedIn: boolean, user: object | null = null) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthUser', mock.useAuthUser)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)

    const wrapper = mount(Page, {
      global: {
        stubs: {
          AppLoading: true,
          AppProcessing: true
        },
        mocks: {
          $auth: {
            loggedIn,
            user
          },
          $route: {
            fullPath
          },
          $toast: mock.toast
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
    expect(wrapper.text()).toMatch(String(user.destroy_schedule_days)) // アカウント削除の猶予期間
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false)
    helper.loadingTest(wrapper, AppLoading)
    await helper.sleep(1)

    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
    helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
    helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
  })
  it('[ログイン中]表示される', async () => {
    const user = Object.freeze({ destroy_schedule_at: null, destroy_schedule_days: 789 })
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user }])
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, AppLoading)
    await helper.sleep(1)

    helper.mockCalledTest(mock.useAuthSignOut, 0)
    viewTest(wrapper, user)

    // 削除ボタン
    const button: any = wrapper.find('#user_delete_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(false) // 有効
    button.trigger('click')
    await helper.sleep(1)

    // 確認ダイアログ
    const dialog: any = wrapper.find('#user_delete_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // はいボタン
    const yesButton: any = wrapper.find('#user_delete_yes_btn')
    expect(yesButton.exists()).toBe(true)
    expect(yesButton.element.disabled).toBe(false) // 有効

    // いいえボタン
    const noButton: any = wrapper.find('#user_delete_no_btn')
    expect(noButton.exists()).toBe(true)
    expect(noButton.element.disabled).toBe(false) // 有効
    noButton.trigger('click')
    await helper.sleep(1)

    // 確認ダイアログ
    expect(dialog.isDisabled()).toBe(false) // 非表示
  })
  it('[ログイン中（削除予約済み）]トップページにリダイレクトされる', async () => {
    const user = Object.freeze({ destroy_schedule_at: '2000-01-08T12:34:56+09:00' })
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user }])
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, AppLoading)
    await helper.sleep(1)

    helper.mockCalledTest(mock.useAuthSignOut, 0)
    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
    helper.mockCalledTest(mock.navigateTo, 1, '/')
  })

  describe('ユーザー情報更新', () => {
    let wrapper: any
    const beforeAction = async () => {
      const user = Object.freeze({ destroy_schedule_at: null, destroy_schedule_days: 789 })
      wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, AppLoading)
      await helper.sleep(1)
    }

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure, notice: null } })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
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
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error, notice: null } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default, notice: null } })
    })
  })

  describe('アカウント削除', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userDeleteUrl, 'POST', {
        undo_delete_url: helper.envConfig.frontBaseURL + helper.commonConfig.userSendUndoDeleteUrl
      })
    }

    let wrapper: any, button: any
    const beforeAction = async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, {}])
      wrapper = mountFunction(true, {})
      await helper.sleep(1)

      // 削除ボタン
      button = wrapper.find('#user_delete_btn')
      button.trigger('click')
      await helper.sleep(1)

      // はいボタン
      wrapper.find('#user_delete_yes_btn').trigger('click')
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[成功]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 0)
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
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 406 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.default })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
