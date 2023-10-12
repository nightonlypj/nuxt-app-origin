import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import Page from '~/pages/users/undo_delete.vue'

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

  const fullPath = '/users/undo_delete'
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
            user,
            setData: mock.setData
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

  const userDestroy = Object.freeze({
    destroy_requested_at: '2000-01-01T12:34:56+09:00',
    destroy_schedule_at: '2000-01-08T12:34:56+09:00'
  })

  // テスト内容
  const viewTest = (wrapper: any, user: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.text()).toMatch(wrapper.vm.$timeFormat('ja', user.destroy_requested_at)) // 削除依頼日時
    expect(wrapper.text()).toMatch(wrapper.vm.$dateFormat('ja', user.destroy_schedule_at)) // 削除予定日
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
    const user = Object.freeze({})
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user }])
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.mockCalledTest(mock.useAuthSignOut, 0)
    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.not_destroy_reserved })
    helper.mockCalledTest(mock.navigateTo, 1, '/')
  })
  it('[ログイン中（削除予約済み）]表示される', async () => {
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user: userDestroy }])
    const wrapper = mountFunction(true, userDestroy)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.mockCalledTest(mock.useAuthSignOut, 0)
    viewTest(wrapper, userDestroy)

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
    expect(dialog.isDisabled()).toBe(false) // 非表示
  })

  describe('ユーザー情報更新', () => {
    let wrapper: any
    const beforeAction = async () => {
      wrapper = mountFunction(true, userDestroy)
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()
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
  })

  describe('アカウント削除取り消し', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', user: { name: 'user1の氏名' } })
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userUndoDeleteUrl, 'POST')
    }

    let wrapper: any, button: any
    const beforeAction = async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user: userDestroy }])
      wrapper = mountFunction(true, userDestroy)
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
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.mockCalledTest(mock.setData, 1, data)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
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
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.default })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
