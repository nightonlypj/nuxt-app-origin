import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/confirmation/new.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('new.vue', () => {
  const localVue = createLocalVue()
  let axiosPostMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosPostMock = null
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (loggedIn, query, values = null) => {
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      mocks: {
        $config: {
          apiBaseURL: 'https://example.com',
          confirmationNewUrl: '/users/auth/confirmation.json',
          frontBaseURL: 'https://front.example.com',
          confirmationSuccessUrl: '/users/sign_in'
        },
        $axios: {
          post: axiosPostMock
        },
        $auth: {
          loggedIn
        },
        $route: {
          path: '/users/confirmation/new',
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
  const commonViewTest = (wrapper, loggedIn, alert, notice) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    commonMessageTest(wrapper, alert, notice)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(!loggedIn)
    if (!loggedIn) {
      expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('confirmation')
    }
    expect(routerPushMock).toBeCalledTimes(1)
    expect(routerPushMock).toBeCalledWith({ path: '/users/confirmation/new' })

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
    expect(axiosPostMock).toBeCalledWith('https://example.com/users/auth/confirmation.json', {
      email: values.email,
      redirect_url: 'https://front.example.com/users/sign_in'
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
    commonViewTest(wrapper, false, query.alert, query.notice)

    // 送信ボタン
    const button = wrapper.find('#confirmation_new_btn')
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
  it('[ログイン中]表示される', () => {
    const query = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const wrapper = mountFunction(true, query)
    commonViewTest(wrapper, true, query.alert, query.notice)
  })

  describe('メールアドレス確認API', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ email: 'user1@example.com' })
    it('[成功][未ログイン]ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false, {}, values)

      await helper.sleep(1)
      const button = wrapper.find('#confirmation_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonRedirectTest(null, null, { path: '/users/sign_in', query: data }, 2)
    })
    it('[成功][ログイン中]トップページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, {}, values)

      await helper.sleep(1)
      const button = wrapper.find('#confirmation_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonRedirectTest(data.alert, data.notice, { path: '/' }, 2)
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { email: ['errorメッセージ'] } }, data) } }))
      const wrapper = mountFunction(false, {}, values)

      await helper.sleep(1)
      const button = wrapper.find('#confirmation_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, true)
    })
    it('[連携エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: null }, data) } }))
      const wrapper = mountFunction(false, {}, values)

      await helper.sleep(1)
      const button = wrapper.find('#confirmation_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, false)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(false, {}, values)

      await helper.sleep(1)
      const button = wrapper.find('#confirmation_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.network.failure, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(false, {}, values)

      await helper.sleep(1)
      const button = wrapper.find('#confirmation_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.network.error, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(false, {}, values)

      await helper.sleep(1)
      const button = wrapper.find('#confirmation_new_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.system.error, null)
      commonDisabledTest(wrapper, button, false)
    })
  })
})
