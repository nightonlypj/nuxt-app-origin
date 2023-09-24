import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/sign_up.vue'

describe('sign_up.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      navigateTo: vi.fn(),
      toast: helper.mockToast
    }
  })

  const fullPath = '/users/sign_up'
  const mountFunction = (loggedIn: boolean, values = {}, query = {}) => {
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
  const viewTest = (wrapper: any, query = {}) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)

    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('sign_up')

    helper.messageTest(wrapper, AppMessage, null)
    expect(wrapper.vm.$data.query).toEqual({ name: '', email: '', password: '', password_confirmation: '', ...query })
  }

  // テストケース
  it('[未ログイン]表示される', async () => {
    const wrapper = mountFunction(false)
    viewTest(wrapper)

    // 登録ボタン
    const button: any = wrapper.find('#sign_up_btn')
    expect(button.exists()).toBe(true)
    await helper.waitChangeDisabled(button, true)
    expect(button.element.disabled).toBe(true) // 無効

    // 入力
    wrapper.find('#input_name').setValue('user1の氏名')
    wrapper.find('#input_email').setValue('user1@example.com')
    wrapper.find('#input_password').setValue('abc12345')
    wrapper.find('#input_password_confirmation').setValue('abc12345')
    wrapper.vm.$data.showPassword = true

    // 登録ボタン
    await helper.waitChangeDisabled(button, false)
    expect(button.element.disabled).toBe(false) // 有効
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true)
    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.already_authenticated })
    helper.mockCalledTest(mock.navigateTo, 1, '/')
  })

  describe('招待情報取得', () => {
    const invitation = Object.freeze({ code: 'invitation000000000000001' })
    let wrapper
    const beforeAction = async () => {
      wrapper = mountFunction(false, {}, invitation)
      await helper.sleep(1)

      apiCalledTest()
    }
    const apiCalledTest = () => {
      expect(axiosGetMock).toBeCalledTimes(1)
      expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userInvitationUrl, { params: { code: invitation.code } })
    }

    it('[メールアドレスあり]表示される', async () => {
      const email = 'user1@example.com'
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { invitation: { email } } }))
      await beforeAction()

      viewTest(wrapper, { email })
    })
    it('[ドメインあり]表示される', async () => {
      const domains = Object.freeze(['a.example.com', 'b.example.com'])
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { invitation: { domains } } }))
      await beforeAction()

      viewTest(wrapper, { email_domain: domains[0], email_local: '' })
    })
    it('[データなし]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
    })
    it('[メールアドレス・ドメインなし]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { invitation: { email: null, domains: null } } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.network.failure })
    })
    it('[存在しない]エラーページが表示される', async () => {
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 404, data } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 404, alert: data.alert, notice: data.notice })
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: helper.locales.network.error })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: helper.locales.system.default })
    })
  })

  describe('アカウント登録', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const params = Object.freeze({ name: 'user1の氏名', email: 'user1@example.com', password: 'abc12345', password_confirmation: 'abc12345' })
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.singUpUrl, 'POST', {
        ...params,
        confirm_success_url: helper.envConfig.frontBaseURL + helper.commonConfig.authRedirectSignInURL
      })
    }

    let wrapper: any, button: any
    const beforeAction = async () => {
      wrapper = mountFunction(false, { query: params })
      button = wrapper.find('#sign_up_btn')
      button.trigger('click')
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[成功]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { ...data, errors: { email: ['errorメッセージ'] } }])
      await beforeAction()

      helper.messageTest(wrapper, AppMessage, data)
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.messageTest(wrapper, AppMessage, { alert: helper.locales.system.default })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
