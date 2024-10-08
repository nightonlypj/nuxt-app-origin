import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { apiRequestURL } from '~/utils/api'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/password/reset.vue'

const $config = config.global.mocks.$config
const $t = config.global.mocks.$t

describe('reset.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      navigateTo: vi.fn(),
      toast: helper.mockToast
    }
  })
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })

  const mountFunction = (loggedIn: boolean, query = {}, values = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({ query: { ...query } })))

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
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('password')

    helper.messageTest(wrapper, AppMessage, data)
    helper.mockCalledTest(mock.navigateTo, data == null ? 0 : 1, {}) // NOTE: URLパラメータを消す為
    expect(wrapper.vm.query).toEqual({ email: '' })
  }

  // テストケース
  describe('パラメータなし', () => {
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, {})
      viewTest(wrapper, null)
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, {})
      helper.toastMessageTest(mock.toast, { info: $t('auth.already_authenticated') })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })
  describe('パラメータあり', () => {
    it('[未ログイン]表示される', async () => {
      const wrapper = mountFunction(false, messages)
      viewTest(wrapper, messages)
      await flushPromises()

      // 送信ボタン
      const button: any = wrapper.find('#password_reset_btn')
      expect(button.exists()).toBe(true)
      expect(button.element.disabled).toBe(true) // 無効

      // 入力
      wrapper.find('#password_reset_email_text').setValue('user1@example.com')
      await flushPromises()

      // 送信ボタン
      expect(button.element.disabled).toBe(false) // 有効
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, messages)
      helper.toastMessageTest(mock.toast, { info: $t('auth.already_authenticated') })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })

  describe('パスワード再設定', () => {
    const params = Object.freeze({ email: 'user1@example.com' })
    const apiCalledTest = (count: number, params = {}) => {
      expect(mock.useApiRequest).toBeCalledTimes(count)
      if (count > 0) {
        expect(mock.useApiRequest).nthCalledWith(1, apiRequestURL(helper.locale, $config.public.passwordUrl), 'POST', {
          ...params,
          redirect_url: $config.public.frontBaseURL + $config.public.passwordRedirectUrl
        })
      }
    }

    let wrapper: any, button: any
    type Options = { keydown: boolean, isComposing: boolean | null }
    const beforeAction = async (options: Options = { keydown: false, isComposing: null }) => {
      wrapper = mountFunction(false, {}, { query: params })
      if (options.keydown) {
        const inputArea: any = wrapper.find('#password_reset_area')
        inputArea.trigger('keydown.enter', { isComposing: options.isComposing })
        inputArea.trigger('keyup.enter')
      } else {
        button = wrapper.find('#password_reset_btn')
        button.trigger('click')
      }
      await flushPromises()
    }

    it('[成功][ボタンクリック]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, messages])
      await beforeAction()

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/sign_in', query: messages })
    })
    it('[成功][Enter送信]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, messages])
      await beforeAction({ keydown: true, isComposing: false })

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/sign_in', query: messages })
    })
    it('[成功][IME確定のEnter]APIリクエストされない', async () => {
      mock.useApiRequest = vi.fn()
      await beforeAction({ keydown: true, isComposing: true })

      apiCalledTest(0)
      helper.toastMessageTest(mock.toast, {})
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, { error: $t('system.error') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, { error: $t('network.failure') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, { error: $t('network.error') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { ...messages, errors: { email: ['errorメッセージ'] } }])
      await beforeAction()

      apiCalledTest(1, params)
      helper.messageTest(wrapper, AppMessage, messages)
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      apiCalledTest(1, params)
      helper.messageTest(wrapper, AppMessage, { alert: $t('system.default') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
