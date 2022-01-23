import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
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

  const mountFunction = (loggedIn, query, values = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      mocks: {
        $config: {
          frontBaseURL: 'https://front.example.com',
          unlockRedirectUrl: '/users/sign_in'
        },
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

  const commonMessageTest = (wrapper, alert, notice) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBe(alert)
    expect(wrapper.findComponent(Message).vm.$props.notice).toBe(notice)
  }
  const commonViewTest = (wrapper, alert, notice) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    commonMessageTest(wrapper, alert, notice)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('sign_in')
    expect(routerPushMock).toBeCalledTimes(1)
    expect(routerPushMock).toBeCalledWith({ path: '/users/sign_in' })

    expect(wrapper.vm.$data.email).toBe('')
    expect(wrapper.vm.$data.password).toBe('')
  }
  const commonToastedTest = (alert, notice) => {
    expect(toastedErrorMock).toBeCalledTimes(alert !== null ? 1 : 0)
    if (alert !== null) {
      expect(toastedErrorMock).toBeCalledWith(alert)
    }
    expect(toastedInfoMock).toBeCalledTimes(notice !== null ? 1 : 0)
    if (notice !== null) {
      expect(toastedInfoMock).toBeCalledWith(notice)
    }
  }
  const commonRedirectTest = (alert, notice, url) => {
    commonToastedTest(alert, notice)
    expect(routerPushMock).toBeCalledTimes(1)
    expect(routerPushMock).toBeCalledWith(url)
  }
  const commonApiCalledTest = (values) => {
    expect(authLoginWithMock).toBeCalledTimes(1)
    expect(authLoginWithMock).toBeCalledWith('local', {
      data: {
        email: values.email,
        password: values.password,
        unlock_redirect_url: 'https://front.example.com/users/sign_in'
      }
    })
  }
  const commonDisabledTest = (wrapper, button, disabled) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(button.vm.disabled).toBe(disabled)
  }

  it('[未ログイン]表示される', async () => {
    const wrapper = mountFunction(false, {})
    commonViewTest(wrapper, null, null)

    // ログインボタン
    const button = wrapper.find('#sign_in_btn')
    expect(button.exists()).toBe(true)
    for (let i = 0; i < 100; i++) {
      await helper.sleep(10)
      if (button.vm.disabled) { break }
    }
    expect(button.vm.disabled).toBe(true) // 無効

    // 入力
    wrapper.vm.$data.email = 'user1@example.com'
    wrapper.vm.$data.password = 'abc12345'

    // ログインボタン
    for (let i = 0; i < 100; i++) {
      await helper.sleep(10)
      if (!button.vm.disabled) { break }
    }
    expect(button.vm.disabled).toBe(false) // 有効
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true, {})
    commonRedirectTest(null, locales.auth.already_authenticated, { path: '/' })
  })

  describe('メールアドレス確認成功', () => {
    const query = Object.freeze({ account_confirmation_success: 'true', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, query)
      commonViewTest(wrapper, query.alert, query.notice + locales.auth.unauthenticated)
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      commonRedirectTest(query.alert, query.notice, { path: '/' })
    })
  })

  describe('メールアドレス確認失敗', () => {
    const query = Object.freeze({ account_confirmation_success: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]メールアドレス確認にリダイレクトされる', () => {
      mountFunction(false, query)
      commonRedirectTest(null, null, { path: '/users/confirmation/new', query: { alert: query.alert, notice: query.notice } })
    })
    it('[ログイン中]メールアドレス確認にリダイレクトされる', () => {
      mountFunction(true, query)
      commonRedirectTest(null, null, { path: '/users/confirmation/new', query: { alert: query.alert, notice: query.notice } })
    })
  })

  describe('アカウントロック解除成功', () => {
    const query = Object.freeze({ unlock: 'true', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, query)
      commonViewTest(wrapper, query.alert, query.notice + locales.auth.unauthenticated)
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      commonRedirectTest(query.alert, query.notice, { path: '/' })
    })
  })

  describe('アカウントロック解除失敗', () => {
    const query = Object.freeze({ unlock: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, query)
      commonViewTest(wrapper, query.alert, query.notice)
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      commonRedirectTest(query.alert, query.notice, { path: '/' })
    })
  })

  describe('ログインAPI', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ email: 'user1@example.com', password: 'abc12345' })
    it('[成功]ログイン状態になり、元のページにリダイレクトされる', async () => {
      authLoginWithMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false, {}, values)
      const button = wrapper.find('#sign_in_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(data.alert, data.notice)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[入力・連携エラー]エラーメッセージが表示される', async () => {
      authLoginWithMock = jest.fn(() => Promise.reject({ response: { status: 422, data } }))
      const wrapper = mountFunction(false, {}, values)
      const button = wrapper.find('#sign_in_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, true)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      authLoginWithMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(false, {}, values)
      const button = wrapper.find('#sign_in_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.network.failure, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      authLoginWithMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(false, {}, values)
      const button = wrapper.find('#sign_in_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.network.error, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      authLoginWithMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(false, {}, values)
      const button = wrapper.find('#sign_in_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.system.error, null)
      commonDisabledTest(wrapper, button, false)
    })
  })
})
