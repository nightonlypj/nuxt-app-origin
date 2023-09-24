import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppMessage from '~/components/app/Message.vue'
import UpdateImage from '~/components/users/update/Image.vue'
import UpdateData from '~/components/users/update/Data.vue'
import Page from '~/pages/users/update.vue'

describe('update.vue', () => {
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

  const fullPath = '/users/update'
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
          AppMessage: true,
          UpdateImage: true,
          UpdateData: true
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

  const userDestroy = Object.freeze({
    destroy_requested_at: '2000-01-01T12:34:56+09:00',
    destroy_schedule_at: '2000-01-08T12:34:56+09:00'
  })

  // テスト内容
  const apiCalledTest = () => {
    expect(mock.useApiRequest).toBeCalledTimes(1)
    expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userDetailUrl)
  }

  const viewTest = (wrapper: any, user: object, unconfirmed: boolean) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    helper.messageTest(wrapper, AppMessage, null)
    expect(wrapper.findComponent(UpdateImage).exists()).toBe(true)
    expect(wrapper.findComponent(UpdateData).exists()).toBe(true)
    expect(wrapper.findComponent(UpdateData).vm.$props.user).toBe(user)

    const links = helper.getLinks(wrapper)
    expect(links.includes('/users/confirmation/resend')).toBe(unconfirmed) // [メールアドレス変更中]メールアドレス確認
    expect(links.includes('/users/delete')).toBe(true) // アカウント削除
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
    const user = Object.freeze({ email: 'user1@example.com', unconfirmed_email: null })
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user }])
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { user }])
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, AppLoading)
    await helper.sleep(1)

    helper.mockCalledTest(mock.useAuthSignOut, 0)
    apiCalledTest()
    viewTest(wrapper, user, false)
  })
  it('[ログイン中（メールアドレス変更中）]表示される', async () => {
    const user = Object.freeze({ email: 'user1@example.com', unconfirmed_email: 'new@example.com' })
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user }])
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { user }])
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, AppLoading)
    await helper.sleep(1)

    helper.mockCalledTest(mock.useAuthSignOut, 0)
    apiCalledTest()
    viewTest(wrapper, user, true)
  })
  it('[ログイン中（削除予約済み）]トップページにリダイレクトされる', async () => {
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user: userDestroy }])
    const wrapper = mountFunction(true, userDestroy)
    helper.loadingTest(wrapper, AppLoading)
    await helper.sleep(1)

    helper.mockCalledTest(mock.useAuthSignOut, 0)
    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
    helper.mockCalledTest(mock.navigateTo, 1, '/')
  })

  describe('ユーザー情報更新', () => {
    let wrapper: any
    const beforeAction = async () => {
      wrapper = mountFunction(true, {})
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

  describe('ユーザー情報詳細取得', () => {
    let wrapper: any
    const beforeAction = async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, {}])
      wrapper = mountFunction(true, {})
      helper.loadingTest(wrapper, AppLoading)
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[データなし]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error, notice: null } })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure, notice: null } })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error, notice: null } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default, notice: null } })
    })
  })
})
