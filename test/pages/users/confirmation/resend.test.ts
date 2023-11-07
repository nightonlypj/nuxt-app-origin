import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/confirmation/resend.vue'

describe('resend.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      navigateTo: vi.fn(),
      toast: helper.mockToast
    }
  })

  const mountFunction = (loggedIn: boolean, query = {}, values = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn
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
  const viewTest = (wrapper: any, loggedIn: boolean, data: object | null) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(!loggedIn)
    if (!loggedIn) {
      expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('confirmation')
    }

    helper.messageTest(wrapper, AppMessage, data)
    helper.mockCalledTest(mock.navigateTo, data == null ? 0 : 1, {}) // NOTE: URLパラメータを消す為
    expect(wrapper.vm.query).toEqual({ email: '' })
  }

  // テストケース
  describe('パラメータなし', () => {
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, {})
      viewTest(wrapper, false, null)
    })
    it('[ログイン中]表示される', () => {
      const wrapper = mountFunction(true, {})
      viewTest(wrapper, true, null)
    })
  })
  describe('パラメータあり', () => {
    const query = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]表示される', async () => {
      const wrapper = mountFunction(false, query)
      viewTest(wrapper, false, query)
      await flushPromises()

      // 送信ボタン
      const button: any = wrapper.find('#confirmation_resend_btn')
      expect(button.exists()).toBe(true)
      expect(button.element.disabled).toBe(true) // 無効

      // 入力
      wrapper.find('#confirmation_resend_email_text').setValue('user1@example.com')
      await flushPromises()

      // 送信ボタン
      expect(button.element.disabled).toBe(false) // 有効
    })
    it('[ログイン中]表示される', () => {
      const wrapper = mountFunction(true, query)
      viewTest(wrapper, true, query)
    })
  })

  describe('メールアドレス確認', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const params = Object.freeze({ email: 'user1@example.com' })
    const apiCalledTest = (count: number, params = {}) => {
      expect(mock.useApiRequest).toBeCalledTimes(count)
      if (count > 0) {
        expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.confirmationUrl, 'POST', {
          ...params,
          redirect_url: helper.envConfig.frontBaseURL + helper.commonConfig.authRedirectSignInURL
        })
      }
    }

    let wrapper: any, button: any
    type Options = { keydown: boolean, isComposing: boolean | null }
    const beforeAction = async (loggedIn = false, options: Options = { keydown: false, isComposing: null }) => {
      wrapper = mountFunction(loggedIn, {}, { query: params })

      if (options.keydown) {
        const inputArea: any = wrapper.find('#confirmation_resend_area')
        inputArea.trigger('keydown.enter', { isComposing: options.isComposing })
        inputArea.trigger('keyup.enter')
      } else {
        button = wrapper.find('#confirmation_resend_btn')
        button.trigger('click')
      }
      await flushPromises()
    }

    it('[成功][未ログイン][ボタンクリック]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction(false)

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/sign_in', query: data })
    })
    it('[成功][未ログイン][Enter送信]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction(false, { keydown: true, isComposing: false })

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/sign_in', query: data })
    })
    it('[成功][未ログイン][IME確定のEnter]APIリクエストされない', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction(false, { keydown: true, isComposing: true })

      apiCalledTest(0)
      helper.toastMessageTest(mock.toast, {})
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[成功][ログイン中]トップページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction(true)

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { ...data, errors: { email: ['errorメッセージ'] } }])
      await beforeAction()

      apiCalledTest(1, params)
      helper.messageTest(wrapper, AppMessage, data)
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      apiCalledTest(1, params)
      helper.messageTest(wrapper, AppMessage, { alert: helper.locales.system.default })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
