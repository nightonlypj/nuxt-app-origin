import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppMessage from '~/components/app/Message.vue'
import UpdateImage from '~/components/users/update/Image.vue'
import UpdateData from '~/components/users/update/Data.vue'
import Page from '~/pages/users/update.vue'
import { activeUser, destroyUser } from '~/test/data/user'

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
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  const fullPath = '/users/update'

  const mountFunction = (loggedIn = true, user: object | null = activeUser) => {
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
      fullPath
    })))

    const wrapper = mount(Page, {
      global: {
        stubs: {
          AppLoading: true,
          AppMessage: true,
          UpdateImage: true,
          UpdateData: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const apiCalledTest = () => {
    expect(mock.useApiRequest).toBeCalledTimes(1)
    expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userDetailUrl)
  }

  const viewTest = (wrapper: any, user: object) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    helper.messageTest(wrapper, AppMessage, null)
    expect(wrapper.findComponent(UpdateImage).exists()).toBe(true)
    expect(wrapper.findComponent(UpdateData).exists()).toBe(true)
    expect(wrapper.findComponent(UpdateData).vm.$props.user).toBe(user)

    const links = helper.getLinks(wrapper)
    expect(links.includes('/users/delete')).toBe(true) // アカウント削除
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, null)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
    helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
    helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
  })
  it('[ログイン中]表示される', async () => {
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user: activeUser }])
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { user: activeUser }])
    const wrapper = mountFunction(true, activeUser)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.mockCalledTest(mock.useAuthSignOut, 0)
    apiCalledTest()
    viewTest(wrapper, activeUser)
  })
  it('[ログイン中（削除予約済み）]トップページにリダイレクトされる', async () => {
    mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, { user: destroyUser }])
    const wrapper = mountFunction(true, destroyUser)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.mockCalledTest(mock.useAuthSignOut, 0)
    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
    helper.mockCalledTest(mock.navigateTo, 1, '/')
  })

  describe('ユーザー情報更新', () => {
    let wrapper: any
    const beforeAction = async () => {
      wrapper = mountFunction()
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

  describe('ユーザー情報詳細取得', () => {
    let wrapper: any
    const beforeAction = async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: true, status: 200 }, activeUser])
      wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
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
})
