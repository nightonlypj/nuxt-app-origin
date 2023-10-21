import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/password/index.vue'

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

  const fullPath = '/users/password'
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
            loggedIn,
            setData: mock.setData
          },
          $route: {
            fullPath,
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
  const viewTest = (wrapper: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('password')

    helper.messageTest(wrapper, AppMessage, null)
    expect(wrapper.vm.$data.query).toEqual({ password: '', password_confirmation: '' })
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
    wrapper.vm.$data.showPassword = true
    await flushPromises()

    // 変更ボタン
    expect(button.element.disabled).toBe(false) // 有効
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true)
    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.already_authenticated })
    helper.mockCalledTest(mock.navigateTo, 1, '/')
  })

  describe('トークンエラー', () => {
    const query = Object.freeze({ reset_password: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/password/reset', query: { alert: query.alert, notice: query.notice } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.already_authenticated })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })

  describe('トークンnull', () => {
    const query = Object.freeze({ reset_password_token: null })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/password/reset', query: { alert: helper.locales.auth.reset_password_token_blank } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.already_authenticated })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })
  describe('トークンなし', () => {
    const query = Object.freeze({ reset_password_token: '' })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/password/reset', query: { alert: helper.locales.auth.reset_password_token_blank } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.already_authenticated })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
  })

  describe('パスワード再設定', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', user: { name: 'user1の氏名' } })
    const params = Object.freeze({ reset_password_token: 'token', password: 'abc12345', password_confirmation: 'abc12345' })
    const apiCalledTest = (count: number, params = {}) => {
      expect(mock.useApiRequest).toBeCalledTimes(count)
      if (count > 0) {
        expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.passwordUpdateUrl, 'POST', {
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
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction(true)

      apiCalledTest(1, params)
      helper.mockCalledTest(mock.setData, 1, data)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
    it('[成功][Enter送信]ログイン状態になり、トップページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction(true, { keydown: true, isComposing: false })

      apiCalledTest(1, params)
      helper.mockCalledTest(mock.setData, 1, data)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
    it('[成功][IME確定のEnter]APIリクエストされない', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction(false, { keydown: true, isComposing: true })

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
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { ...data, errors: { password: ['errorメッセージ'] } }])
      await beforeAction()

      apiCalledTest(1, params)
      helper.messageTest(wrapper, AppMessage, data)
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[その他エラー]パスワード再設定（メールアドレス入力）ページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      apiCalledTest(1, params)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/password/reset', query: { alert: helper.locales.system.default } })
    })
  })
})
