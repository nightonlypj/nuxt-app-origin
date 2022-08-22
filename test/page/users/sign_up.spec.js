import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/sign_up.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('sign_up.vue', () => {
  let axiosPostMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosPostMock = null
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (loggedIn, values = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      mocks: {
        $axios: {
          post: axiosPostMock
        },
        $auth: {
          loggedIn
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
  const viewTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('sign_up')

    helper.messageTest(wrapper, Message, null)
    expect(wrapper.vm.$data.name).toBe('')
    expect(wrapper.vm.$data.email).toBe('')
    expect(wrapper.vm.$data.password).toBe('')
    expect(wrapper.vm.$data.password_confirmation).toBe('')
  }

  const apiCalledTest = (values) => {
    expect(axiosPostMock).toBeCalledTimes(1)
    expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.singUpUrl, {
      name: values.name,
      email: values.email,
      password: values.password,
      password_confirmation: values.password_confirmation,
      confirm_success_url: helper.envConfig.frontBaseURL + helper.commonConfig.authRedirectSignInURL
    })
  }

  // テストケース
  it('[未ログイン]表示される', async () => {
    const wrapper = mountFunction(false)
    viewTest(wrapper)

    // 登録ボタン
    const button = wrapper.find('#sign_up_btn')
    expect(button.exists()).toBe(true)
    for (let i = 0; i < 100; i++) {
      await helper.sleep(10)
      if (button.vm.disabled) { break }
    }
    expect(button.vm.disabled).toBe(true) // 無効

    // 入力
    wrapper.vm.$data.name = 'user1の氏名'
    wrapper.vm.$data.email = 'user1@example.com'
    wrapper.vm.$data.password = 'abc12345'
    wrapper.vm.$data.password_confirmation = 'abc12345'

    // 登録ボタン
    for (let i = 0; i < 100; i++) {
      await helper.sleep(10)
      if (!button.vm.disabled) { break }
    }
    expect(button.vm.disabled).toBe(false) // 有効
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true)
    helper.mockCalledTest(toastedErrorMock, 0)
    helper.mockCalledTest(toastedInfoMock, 1, locales.auth.already_authenticated)
    helper.mockCalledTest(routerPushMock, 1, { path: '/' })
  })

  describe('アカウント登録', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ name: 'user1の氏名', email: 'user1@example.com', password: 'abc12345', password_confirmation: 'abc12345' })
    it('[成功]ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      apiCalledTest(values)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      apiCalledTest(values)
      helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      apiCalledTest(values)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      apiCalledTest(values)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { email: ['errorメッセージ'] } }, data) } }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      apiCalledTest(values)
      helper.messageTest(wrapper, Message, data)
      helper.disabledTest(wrapper, Processing, button, true)
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data } }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      apiCalledTest(values)
      helper.messageTest(wrapper, Message, data)
      helper.disabledTest(wrapper, Processing, button, false)
    })
  })
})
