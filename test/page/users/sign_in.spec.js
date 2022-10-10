import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/sign_in.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('sign_in.vue', () => {
  let authLoginWithMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    authLoginWithMock = null
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (loggedIn, query = null, values = null) => {
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
        $auth: {
          loggedIn,
          loginWith: authLoginWithMock
        },
        $route: {
          path: '/users/sign_in',
          query: { ...query }
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
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
  const viewTest = (wrapper, data) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('sign_in')

    helper.messageTest(wrapper, Message, data)
    if (data == null) {
      helper.mockCalledTest(routerPushMock, 0)
    } else {
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/sign_in' })
    }
    expect(wrapper.vm.$data.email).toBe('')
    expect(wrapper.vm.$data.password).toBe('')
  }

  const apiCalledTest = (values) => {
    expect(authLoginWithMock).toBeCalledTimes(1)
    expect(authLoginWithMock).nthCalledWith(1, 'local', {
      data: {
        email: values.email,
        password: values.password,
        unlock_redirect_url: helper.envConfig.frontBaseURL + helper.commonConfig.authRedirectSignInURL
      }
    })
  }

  // テストケース
  it('[未ログイン]表示される', async () => {
    const wrapper = mountFunction(false)
    viewTest(wrapper, null)

    // ログインボタン
    const button = wrapper.find('#sign_in_btn')
    expect(button.exists()).toBe(true)
    await helper.waitChangeDisabled(button, true)
    expect(button.vm.disabled).toBe(true) // 無効

    // 入力
    wrapper.vm.$data.email = 'user1@example.com'
    wrapper.vm.$data.password = 'abc12345'

    // ログインボタン
    await helper.waitChangeDisabled(button, false)
    expect(button.vm.disabled).toBe(false) // 有効
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true)
    helper.mockCalledTest(toastedErrorMock, 0)
    helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.already_authenticated)
    helper.mockCalledTest(routerPushMock, 1, { path: '/' })
  })

  describe('メールアドレス確認成功', () => {
    const query = Object.freeze({ account_confirmation_success: 'true', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, query)
      viewTest(wrapper, { alert: query.alert, notice: query.notice + helper.locales.auth.unauthenticated })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.mockCalledTest(toastedErrorMock, 1, query.alert)
      helper.mockCalledTest(toastedInfoMock, 1, query.notice)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })
  })

  describe('メールアドレス確認失敗', () => {
    const query = Object.freeze({ account_confirmation_success: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]メールアドレス確認にリダイレクトされる', () => {
      mountFunction(false, query)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/confirmation/resend', query: { alert: query.alert, notice: query.notice } })
    })
    it('[ログイン中]メールアドレス確認にリダイレクトされる', () => {
      mountFunction(true, query)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/confirmation/resend', query: { alert: query.alert, notice: query.notice } })
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
      helper.mockCalledTest(toastedErrorMock, 1, query.alert)
      helper.mockCalledTest(toastedInfoMock, 1, query.notice)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
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
      helper.mockCalledTest(toastedErrorMock, 1, query.alert)
      helper.mockCalledTest(toastedInfoMock, 1, query.notice)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })
  })

  describe('ログイン', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ email: 'user1@example.com', password: 'abc12345' })

    let wrapper, button
    const beforeAction = async (options = { keydown: false, isComposing: null }) => {
      wrapper = mountFunction(false, null, values)
      if (options.keydown) {
        const inputArea = wrapper.find('#input_area')
        inputArea.trigger('keydown.enter', { isComposing: options.isComposing })
        inputArea.trigger('keyup.enter')
      } else {
        button = wrapper.find('#sign_in_btn')
        button.trigger('click')
      }

      await helper.sleep(1)
    }

    it('[成功][ボタンクリック]ログイン状態になり、元のページにリダイレクトされる', async () => {
      authLoginWithMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[成功][Enter送信]ログイン状態になり、元のページにリダイレクトされる', async () => {
      authLoginWithMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction({ keydown: true, isComposing: false })

      apiCalledTest(values)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[成功][IME確定のEnter]APIリクエストされない', async () => {
      authLoginWithMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction({ keydown: true, isComposing: true })

      expect(authLoginWithMock).toBeCalledTimes(0)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      authLoginWithMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      authLoginWithMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      authLoginWithMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      authLoginWithMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      apiCalledTest(values)
      helper.messageTest(wrapper, Message, { alert: helper.locales.system.default })
      helper.disabledTest(wrapper, Processing, button, true)
    })
  })
})
