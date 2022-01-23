import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/password/index.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('index.vue', () => {
  let axiosPostMock, authSetUserMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosPostMock = null
    authSetUserMock = jest.fn()
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
          apiBaseURL: 'https://example.com',
          passwordUpdateUrl: '/users/auth/password/update.json'
        },
        $axios: {
          post: axiosPostMock
        },
        $auth: {
          loggedIn,
          setUser: authSetUserMock
        },
        $route: {
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
  const commonViewTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    commonMessageTest(wrapper, null, null)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('password')

    expect(wrapper.vm.$data.password).toBe('')
    expect(wrapper.vm.$data.password_confirmation).toBe('')
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
  const commonApiCalledTest = (values, setUserCalled) => {
    expect(axiosPostMock).toBeCalledTimes(1)
    expect(axiosPostMock).toBeCalledWith('https://example.com/users/auth/password/update.json', {
      reset_password_token: values.reset_password_token,
      password: values.password,
      password_confirmation: values.password_confirmation
    })
    expect(authSetUserMock).toBeCalledTimes(setUserCalled)
  }
  const commonDisabledTest = (wrapper, button, disabled) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(button.vm.disabled).toBe(disabled)
  }

  it('[未ログイン]表示される', async () => {
    const query = Object.freeze({ reset_password_token: 'token' })
    const wrapper = mountFunction(false, query)
    commonViewTest(wrapper)

    // 変更ボタン
    const button = wrapper.find('#password_update_btn')
    expect(button.exists()).toBe(true)
    for (let i = 0; i < 100; i++) {
      await helper.sleep(10)
      if (button.vm.disabled) { break }
    }
    expect(button.vm.disabled).toBe(true) // 無効

    // 入力
    wrapper.vm.$data.password = 'abc12345'
    wrapper.vm.$data.password_confirmation = 'abc12345'

    // 変更ボタン
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

  describe('トークンエラー', () => {
    const query = Object.freeze({ reset_password: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      commonRedirectTest(null, null, { path: '/users/password/new', query: { alert: query.alert, notice: query.notice } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      commonRedirectTest(null, locales.auth.already_authenticated, { path: '/' })
    })
  })

  describe('トークンnull', () => {
    const query = Object.freeze({ reset_password_token: null })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      commonRedirectTest(null, null, { path: '/users/password/new', query: { alert: locales.auth.reset_password_token_blank } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      commonRedirectTest(null, locales.auth.already_authenticated, { path: '/' })
    })
  })
  describe('トークンなし', () => {
    const query = Object.freeze({ reset_password_token: '' })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      commonRedirectTest(null, null, { path: '/users/password/new', query: { alert: locales.auth.reset_password_token_blank } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      commonRedirectTest(null, locales.auth.already_authenticated, { path: '/' })
    })
  })

  describe('パスワード再設定API', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const query = Object.freeze({ reset_password_token: 'token' })
    const values = Object.freeze({ reset_password_token: 'token', password: 'abc12345', password_confirmation: 'abc12345' })
    it('[成功]ログイン状態になり、トップページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false, query, values)
      const button = wrapper.find('#password_update_btn')
      button.trigger('click')
      wrapper.vm.$auth.loggedIn = true // Tips: 状態変更（Mockでは実行されない為）

      await helper.sleep(1)
      commonApiCalledTest(values, 1)
      commonRedirectTest(data.alert, data.notice, { path: '/' })
    })
    it('[成功]ログイン状態にならなかった場合は、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false, query, values)
      const button = wrapper.find('#password_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 1)
      commonRedirectTest(null, null, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { password: ['errorメッセージ'] } }, data) } }))
      const wrapper = mountFunction(false, query, values)
      const button = wrapper.find('#password_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 0)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, true)
    })
    it('[連携エラー]パスワード再設定（メールアドレス入力）にリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: null }, data) } }))
      const wrapper = mountFunction(false, query, values)
      const button = wrapper.find('#password_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 0)
      commonRedirectTest(null, null, { path: '/users/password/new', query: { alert: data.alert, notice: data.notice } })
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(false, query, values)
      const button = wrapper.find('#password_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 0)
      commonToastedTest(locales.network.failure, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(false, query, values)
      const button = wrapper.find('#password_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 0)
      commonToastedTest(locales.network.error, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(false, query, values)
      const button = wrapper.find('#password_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 0)
      commonToastedTest(locales.system.error, null)
      commonDisabledTest(wrapper, button, false)
    })
  })
})
