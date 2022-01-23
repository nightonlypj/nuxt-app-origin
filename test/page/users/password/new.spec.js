import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/password/new.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('new.vue', () => {
  let axiosPostMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosPostMock = null
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
          passwordNewUrl: '/users/auth/password.json',
          frontBaseURL: 'https://front.example.com',
          passwordRedirectUrl: '/users/password'
        },
        $axios: {
          post: axiosPostMock
        },
        $auth: {
          loggedIn
        },
        $route: {
          path: '/users/password/new',
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
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('password')

    expect(wrapper.vm.$data.email).toBe('')
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
  const commonRedirectTest = (alert, notice, url, count = 1) => {
    commonToastedTest(alert, notice)
    expect(routerPushMock).toBeCalledTimes(count)
    expect(routerPushMock).toBeCalledWith(url)
  }
  const commonApiCalledTest = (values) => {
    expect(axiosPostMock).toBeCalledTimes(1)
    expect(axiosPostMock).toBeCalledWith('https://example.com/users/auth/password.json', {
      email: values.email,
      redirect_url: 'https://front.example.com/users/password'
    })
  }
  const commonDisabledTest = (wrapper, button, disabled) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(button.vm.disabled).toBe(disabled)
  }

  it('[未ログイン]表示される', async () => {
    const query = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const wrapper = mountFunction(false, query)
    commonViewTest(wrapper, query.alert, query.notice)

    // 送信ボタン
    const button = wrapper.find('#password_new_btn')
    expect(button.exists()).toBe(true)
    for (let i = 0; i < 100; i++) {
      await helper.sleep(10)
      if (button.vm.disabled) { break }
    }
    expect(button.vm.disabled).toBe(true) // 無効

    // 入力
    wrapper.vm.$data.email = 'user1@example.com'

    // 送信ボタン
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

  describe('パスワード再設定API', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ email: 'user1@example.com' })
    it('[成功]ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false, {}, values)
      const button = wrapper.find('#password_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonRedirectTest(null, null, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } }, 2)
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { email: ['errorメッセージ'] } }, data) } }))
      const wrapper = mountFunction(false, {}, values)
      const button = wrapper.find('#password_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, true)
    })
    it('[連携エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: null }, data) } }))
      const wrapper = mountFunction(false, {}, values)
      const button = wrapper.find('#password_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, false)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(false, {}, values)
      const button = wrapper.find('#password_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.network.failure, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(false, {}, values)
      const button = wrapper.find('#password_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.network.error, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(false, {}, values)
      const button = wrapper.find('#password_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.system.error, null)
      commonDisabledTest(wrapper, button, false)
    })
  })
})
