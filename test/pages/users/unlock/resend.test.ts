import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/unlock/resend.vue'

describe('resend.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      navigateTo: vi.fn(),
      toast: helper.mockToast
    }
  })

  const path = '/users/unlock/resend'
  const mountFunction = (loggedIn: boolean, query = {}, values = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('navigateTo', mock.navigateTo)

    const wrapper = mount(Page, {
      global: {
        stubs: {
          AppLoading: true,
          AppProcessing: true,
          AppMessage: true,
          ActionLink: true
        },
        mocks: {
          $auth: {
            loggedIn
          },
          $route: {
            path,
            query: { ...query }
          },
          $toast: mock.toast
        }
      },
      data () {
        return values
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, data: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('unlock')

    helper.messageTest(wrapper, AppMessage, data)
    helper.mockCalledTest(mock.navigateTo, data == null ? 0 : 1, path) // NOTE: URLパラメータを消す為
    expect(wrapper.vm.$data.query).toEqual({ email: '' })
  }

  // テストケース
  describe('パラメータなし', () => {
    const query = Object.freeze({})
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, query)
      viewTest(wrapper, null)
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.already_authenticated })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })
  describe('パラメータあり', () => {
    const query = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]表示される', async () => {
      const wrapper = mountFunction(false, query)
      viewTest(wrapper, query)
      await flushPromises()

      // 送信ボタン
      const button: any = wrapper.find('#unlock_reset_btn')
      expect(button.exists()).toBe(true)
      expect(button.element.disabled).toBe(true) // 無効

      // 入力
      wrapper.find('#unlock_reset_email_text').setValue('user1@example.com')
      await flushPromises()

      // 送信ボタン
      expect(button.element.disabled).toBe(false) // 有効
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.already_authenticated })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })

  describe('アカウントロック解除', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const params = Object.freeze({ email: 'user1@example.com' })
    const apiCalledTest = (count: number, params = {}) => {
      expect(mock.useApiRequest).toBeCalledTimes(count)
      if (count > 0) {
        expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.unlockUrl, 'POST', {
          ...params,
          redirect_url: helper.envConfig.frontBaseURL + helper.commonConfig.authRedirectSignInURL
        })
      }
    }

    let wrapper: any, button: any
    type Options = { keydown: boolean, isComposing: boolean | null }
    const beforeAction = async (options: Options = { keydown: false, isComposing: null }) => {
      wrapper = mountFunction(false, {}, { query: params })
      if (options.keydown) {
        const inputArea: any = wrapper.find('#unlock_reset_area')
        inputArea.trigger('keydown.enter', { isComposing: options.isComposing })
        inputArea.trigger('keyup.enter')
      } else {
        button = wrapper.find('#unlock_reset_btn')
        button.trigger('click')
      }
      await flushPromises()
    }

    it('[成功][ボタンクリック]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
    })
    it('[成功][Enter送信]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction({ keydown: true, isComposing: false })

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
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
