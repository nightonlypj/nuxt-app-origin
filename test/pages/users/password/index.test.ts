import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { apiRequestURL } from '~/utils/api'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/password/index.vue'

const $config = config.global.mocks.$config
const $t = config.global.mocks.$t

describe('index.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      navigateTo: vi.fn(),
      setData: vi.fn(),
      toast: helper.mockToast
    }
  })
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })

  const mountFunction = (loggedIn: boolean, query = {}, values = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
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
  const viewTest = (wrapper: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('password')

    helper.messageTest(wrapper, AppMessage, null)
    expect(wrapper.vm.query).toEqual({ password: '', password_confirmation: '' })
  }

  // テストケース
  it('[未ログイン]表示される', async () => {
    const query = Object.freeze({ reset_password_token: 'token' })
    const wrapper = mountFunction(false, query)
    viewTest(wrapper)
    await flushPromises()

    // 変更ボタン
    const button: any = wrapper.find('#password_update_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(true) // 無効

    // 入力
    wrapper.find('#password_update_password_text').setValue('abc12345')
    wrapper.find('#password_update_password_confirmation_text').setValue('abc12345')
    wrapper.vm.showPassword = true
    await flushPromises()

    // 変更ボタン
    expect(button.element.disabled).toBe(false) // 有効
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true)
    helper.toastMessageTest(mock.toast, { info: $t('auth.already_authenticated') })
    helper.mockCalledTest(mock.navigateTo, 1, '/')
  })

  describe('トークンエラー', () => {
    const query = Object.freeze({ reset_password: 'false', ...messages })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/password/reset', query: messages })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, { info: $t('auth.already_authenticated') })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })

  describe('トークンnull', () => {
    const query = Object.freeze({ reset_password_token: null })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/password/reset', query: { alert: $t('auth.reset_password_token_blank') } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, { info: $t('auth.already_authenticated') })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })
  describe('トークンなし', () => {
    const query = Object.freeze({ reset_password_token: '' })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/password/reset', query: { alert: $t('auth.reset_password_token_blank') } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, { info: $t('auth.already_authenticated') })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })

  describe('パスワード再設定', () => {
    const params = Object.freeze({ reset_password_token: 'token', password: 'abc12345', password_confirmation: 'abc12345' })
    const apiCalledTest = (count: number, params = {}) => {
      expect(mock.useApiRequest).toBeCalledTimes(count)
      if (count > 0) {
        expect(mock.useApiRequest).nthCalledWith(1, apiRequestURL.value(helper.locale, $config.public.passwordUpdateUrl), 'POST', {
          ...params
        })
      }
    }

    let wrapper: any, button: any
    type Options = { keydown: boolean, isComposing: boolean | null }
    const beforeAction = async (changeSignIn = false, options: Options = { keydown: false, isComposing: null }) => {
      wrapper = mountFunction(false, { reset_password_token: params.reset_password_token }, { query: params })
      if (options.keydown) {
        const inputArea: any = wrapper.find('#password_update_area')
        inputArea.trigger('keydown.enter', { isComposing: options.isComposing })
        inputArea.trigger('keyup.enter')
      } else {
        button = wrapper.find('#password_update_btn')
        button.trigger('click')
      }
      if (changeSignIn) { wrapper.vm.$auth.loggedIn = true } // NOTE: 状態変更（Mockでは実行されない為）
      await flushPromises()
    }

    it('[成功][ボタンクリック]ログイン状態になり、トップページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, messages])
      await beforeAction(true)

      apiCalledTest(1, params)
      helper.mockCalledTest(mock.setData, 1, messages)
      helper.toastMessageTest(mock.toast, { error: messages.alert, success: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
    it('[成功][Enter送信]ログイン状態になり、トップページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, messages])
      await beforeAction(true, { keydown: true, isComposing: false })

      apiCalledTest(1, params)
      helper.mockCalledTest(mock.setData, 1, messages)
      helper.toastMessageTest(mock.toast, { error: messages.alert, success: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
    it('[成功][IME確定のEnter]APIリクエストされない', async () => {
      mock.useApiRequest = vi.fn()
      await beforeAction(false, { keydown: true, isComposing: true })

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
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { ...messages, errors: { password: ['errorメッセージ'] } }])
      await beforeAction()

      apiCalledTest(1, params)
      helper.messageTest(wrapper, AppMessage, messages)
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[入力エラー（メッセージなし）]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { errors: { password: ['errorメッセージ'] } }])
      await beforeAction()

      apiCalledTest(1, params)
      helper.messageTest(wrapper, AppMessage, { alert: $t('system.default') })
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[その他エラー]パスワード再設定（メールアドレス入力）ページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/password/reset', query: { alert: $t('system.default') } })
    })
  })
})
