import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/sign_in.vue'

describe('sign_in.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthRedirect: null,
      navigateTo: vi.fn(),
      setData: vi.fn(),
      toast: helper.mockToast
    }
  })

  const mountFunction = (loggedIn: boolean, query = {}, values = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn,
        setData: mock.setData
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({
      query: { ...query }
    })))

    const wrapper: any = mount(Page, {
      global: {
        stubs: {
          AppLoading: true,
          AppProcessing: true,
          AppMessage: true,
          ActionLink: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    for (const [key, value] of Object.entries(values)) { wrapper.vm[key] = value }
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, data: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)

    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('sign_in')

    helper.messageTest(wrapper, AppMessage, data)
    helper.mockCalledTest(mock.navigateTo, data == null ? 0 : 1, {})
    expect(wrapper.vm.query).toEqual({ email: '', password: '' })
  }

  // テストケース
  it('[未ログイン]表示される', async () => {
    const wrapper: any = mountFunction(false)
    viewTest(wrapper, null)
    await flushPromises()

    // ログインボタン
    const button: any = wrapper.find('#sign_in_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(true) // 無効

    // 入力
    wrapper.find('#sign_in_email_text').setValue('user1@example.com')
    wrapper.find('#sign_in_password_text').setValue('abc12345')
    wrapper.vm.showPassword = true
    await flushPromises()

    // ログインボタン
    expect(button.element.disabled).toBe(false) // 有効
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true)
    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.already_authenticated })
    helper.mockCalledTest(mock.navigateTo, 1, '/')
  })

  describe('メールアドレス確認成功', () => {
    const query = Object.freeze({ account_confirmation_success: 'true', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, query)
      viewTest(wrapper, { alert: query.alert, notice: query.notice + helper.locales.auth.unauthenticated })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, { error: query.alert, info: query.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })

  describe('メールアドレス確認失敗', () => {
    const query = Object.freeze({ account_confirmation_success: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]メールアドレス確認ページにリダイレクトされる', () => {
      mountFunction(false, query)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/confirmation/resend', query: { alert: query.alert, notice: query.notice } })
    })
    it('[ログイン中]メールアドレス確認ページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/confirmation/resend', query: { alert: query.alert, notice: query.notice } })
    })
  })

  describe('アカウントロック解除成功', () => {
    const query = Object.freeze({ unlock: 'true', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, query)
      viewTest(wrapper, { alert: query.alert, notice: query.notice + helper.locales.auth.unauthenticated })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, { error: query.alert, info: query.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })

  describe('アカウントロック解除失敗', () => {
    const query = Object.freeze({ unlock: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, query)
      viewTest(wrapper, query)
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, { error: query.alert, info: query.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })

  describe('ログイン', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const params = Object.freeze({ email: 'user1@example.com', password: 'abc12345' })
    const apiCalledTest = (count: number) => {
      expect(mock.useApiRequest).toBeCalledTimes(count)
      if (count > 0) {
        expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.authSignInURL, 'POST', {
          ...params,
          unlock_redirect_url: helper.envConfig.frontBaseURL + helper.commonConfig.authRedirectSignInURL
        })
      }
    }

    let wrapper: any, button: any
    type Options = { keydown: boolean, isComposing: boolean | null }
    const beforeAction = async (options: Options = { keydown: false, isComposing: null }) => {
      wrapper = mountFunction(false, {}, { query: params })
      if (options.keydown) {
        const inputArea: any = wrapper.find('#sign_in_area')
        inputArea.trigger('keydown.enter', { isComposing: options.isComposing })
        inputArea.trigger('keyup.enter')
      } else {
        button = wrapper.find('#sign_in_btn')
        button.trigger('click')
      }
      await flushPromises()
    }

    it('[成功][ボタンクリック]ログイン状態になり、元のページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      mock.useAuthRedirect = { redirectUrl: ref('/users/update'), updateRedirectUrl: vi.fn() } // NOTE: URLがある場合
      await beforeAction()

      apiCalledTest(1)
      helper.mockCalledTest(mock.setData, 1, data)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/users/update') // NOTE: 保持されているURLに遷移
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, null)
    })
    it('[成功][Enter送信]ログイン状態になり、元のページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      mock.useAuthRedirect = { redirectUrl: ref(null), updateRedirectUrl: vi.fn() } // NOTE: URLがない場合
      await beforeAction({ keydown: true, isComposing: false })

      apiCalledTest(1)
      helper.mockCalledTest(mock.setData, 1, data)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectHomeURL) // NOTE: トップに遷移
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, null)
    })
    it('[成功][IME確定のEnter]APIリクエストされない', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction({ keydown: true, isComposing: true })

      apiCalledTest(0)
      helper.toastMessageTest(mock.toast, {})
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      apiCalledTest(1)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      apiCalledTest(1)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      apiCalledTest(1)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      apiCalledTest(1)
      helper.messageTest(wrapper, AppMessage, { alert: helper.locales.system.default })
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
  })
})
