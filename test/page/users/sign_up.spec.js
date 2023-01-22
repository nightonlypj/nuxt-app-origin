import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/sign_up.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('sign_up.vue', () => {
  let axiosGetMock, axiosPostMock, setUniversalMock, toastedErrorMock, toastedInfoMock, nuxtErrorMock, routerPushMock

  beforeEach(() => {
    axiosGetMock = null
    axiosPostMock = null
    setUniversalMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    nuxtErrorMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const fullPath = '/users/sign_up'
  const mountFunction = (loggedIn, values = null, query = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        Loading: true,
        Processing: true,
        Message: true,
        ActionLink: true
      },
      mocks: {
        $axios: {
          get: axiosGetMock,
          post: axiosPostMock
        },
        $auth: {
          loggedIn,
          $storage: {
            setUniversal: setUniversalMock
          }
        },
        $route: {
          fullPath,
          query: { ...query }
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        },
        $nuxt: {
          error: nuxtErrorMock
        },
        $router: {
          push: routerPushMock
        }
      },
      data () {
        return { ...values }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, query = null) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('sign_up')

    helper.messageTest(wrapper, Message, null)
    expect(wrapper.vm.$data.query).toEqual({ name: '', email: '', password: '', password_confirmation: '', ...query })
  }

  // テストケース
  it('[未ログイン]表示される', async () => {
    const wrapper = mountFunction(false)
    viewTest(wrapper)

    // 登録ボタン
    const button = wrapper.find('#sign_up_btn')
    expect(button.exists()).toBe(true)
    await helper.waitChangeDisabled(button, true)
    expect(button.vm.disabled).toBe(true) // 無効

    // 入力
    wrapper.vm.$data.query = { name: 'user1の氏名', email: 'user1@example.com', password: 'abc12345', password_confirmation: 'abc12345' }

    // 登録ボタン
    await helper.waitChangeDisabled(button, false)
    expect(button.vm.disabled).toBe(false) // 有効
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true)
    helper.mockCalledTest(toastedErrorMock, 0)
    helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.already_authenticated)
    helper.mockCalledTest(routerPushMock, 1, { path: '/' })
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
      expect(axiosPostMock).toBeCalledTimes(1)
      expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.singUpUrl, {
        ...params,
        confirm_success_url: helper.envConfig.frontBaseURL + helper.commonConfig.authRedirectSignInURL
      })
    }

    let wrapper, button
    const beforeAction = async () => {
      wrapper = mountFunction(false, { query: params })
      button = wrapper.find('#sign_up_btn')
      button.trigger('click')
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[成功]ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(setUniversalMock, 1, 'redirect', fullPath)
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { email: ['errorメッセージ'] } }, data) } }))
      await beforeAction()

      helper.messageTest(wrapper, Message, data)
      helper.disabledTest(wrapper, Processing, button, true) // 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.messageTest(wrapper, Message, { alert: helper.locales.system.default })
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
  })
})
