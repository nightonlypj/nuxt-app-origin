import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { apiRequestURL } from '~/utils/api'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/sign_up.vue'
import { activeUser } from '~/test/data/user'

const $config = config.global.mocks.$config
const $t = config.global.mocks.$t

describe('sign_up.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      navigateTo: vi.fn(),
      showError: vi.fn(),
      toast: helper.mockToast
    }
  })
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })

  const mountFunction = (loggedIn: boolean, values = {}, query = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)
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
  const viewTest = (wrapper: any, query = {}) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)

    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('sign_up')

    helper.messageTest(wrapper, AppMessage, null)
    expect(wrapper.vm.query).toEqual({ name: '', email: '', email_domain: '', email_local: '', password: '', password_confirmation: '', ...query })
  }

  // テストケース
  it('[未ログイン]表示される', async () => {
    const wrapper = mountFunction(false)
    viewTest(wrapper)
    await flushPromises()

    // 登録ボタン
    const button: any = wrapper.find('#sign_up_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(true) // 無効

    // 入力
    wrapper.find('#sign_up_name_text').setValue('user1の氏名')
    wrapper.find('#sign_up_email_text').setValue('user1@example.com')
    wrapper.find('#sign_up_password_text').setValue('abc12345')
    wrapper.find('#sign_up_password_confirmation_text').setValue('abc12345')
    wrapper.vm.showPassword = true
    await flushPromises()

    // 登録ボタン
    expect(button.element.disabled).toBe(false) // 有効
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true)
    helper.toastMessageTest(mock.toast, { info: $t('auth.already_authenticated') })
    helper.mockCalledTest(mock.navigateTo, 1, '/')
  })

  describe('招待情報取得', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, apiRequestURL.value(helper.locale, $config.public.userInvitationUrl), 'GET', {
        code: invitation.code
      })
    }

    const invitation = Object.freeze({ code: 'invitation000000000000001' })
    let wrapper: any
    const beforeAction = async () => {
      wrapper = mountFunction(false, {}, invitation)
      await flushPromises()

      apiCalledTest()
    }

    it('[メールアドレスあり]表示される', async () => {
      const email = 'user1@example.com'
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { email } }])
      await beforeAction()

      viewTest(wrapper, { email })

      // 入力（sign_up_email_text除く）
      wrapper.find('#sign_up_name_text').setValue('user1の氏名')
      wrapper.find('#sign_up_password_text').setValue('abc12345')
      wrapper.find('#sign_up_password_confirmation_text').setValue('abc12345')
      await flushPromises()

      // 登録ボタン
      const button: any = wrapper.find('#sign_up_btn')
      expect(button.element.disabled).toBe(false) // 有効
    })
    it('[ドメインあり]表示される', async () => {
      const domains = Object.freeze(['a.example.com', 'b.example.com'])
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { domains } }])
      await beforeAction()

      viewTest(wrapper, { email_domain: domains[0], email_local: '' })

      // 入力（sign_up_email_text除く）
      wrapper.find('#sign_up_name_text').setValue('user1の氏名')
      wrapper.find('#sign_up_email_local_text').setValue('user1')
      wrapper.find('#sign_up_password_text').setValue('abc12345')
      wrapper.find('#sign_up_password_confirmation_text').setValue('abc12345')
      await flushPromises()

      // 登録ボタン
      const button: any = wrapper.find('#sign_up_btn')
      expect(button.element.disabled).toBe(false) // 有効
    })
    it('[データなし]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: $t('system.error') } })
    })
    it('[メールアドレス・ドメインなし]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { email: null, domains: null } }])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: $t('system.error') } })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: $t('network.failure') } })
    })
    it('[存在しない]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, messages])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: { alert: messages.alert, notice: messages.notice } })
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: $t('network.error') } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: $t('system.default') } })
    })
  })

  describe('アカウント登録', () => {
    const params = Object.freeze({ name: 'user1の氏名', email: 'user1@example.com', password: 'abc12345', password_confirmation: 'abc12345' })
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, apiRequestURL.value(helper.locale, $config.public.singUpUrl), 'POST', {
        ...params,
        confirm_success_url: $config.public.frontBaseURL + $config.public.authRedirectSignInURL
      })
    }

    let wrapper: any, button: any
    const beforeAction = async () => {
      wrapper = mountFunction(false, { query: params })
      button = wrapper.find('#sign_up_btn')
      button.trigger('click')
      await flushPromises()

      apiCalledTest()
    }

    it('[成功]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { ...messages, user: activeUser }])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/sign_in', query: messages })
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, { error: $t('system.error') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, { error: $t('network.failure') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, { error: $t('network.error') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { ...messages, errors: { email: ['errorメッセージ'] } }])
      await beforeAction()

      helper.messageTest(wrapper, AppMessage, messages)
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.messageTest(wrapper, AppMessage, { alert: $t('system.default') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
