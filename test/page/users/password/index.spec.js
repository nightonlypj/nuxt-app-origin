import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/password/index.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('index.vue', () => {
  let axiosPostMock, authSetUserMock, setUniversalMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosPostMock = null
    authSetUserMock = jest.fn()
    setUniversalMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const fullPath = '/users/password'
  const mountFunction = (loggedIn, query, values = null) => {
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
          post: axiosPostMock
        },
        $auth: {
          loggedIn,
          setUser: authSetUserMock,
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
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('password')

    helper.messageTest(wrapper, Message, null)
    expect(wrapper.vm.$data.query).toEqual({ password: '', password_confirmation: '' })
  }

  // テストケース
  it('[未ログイン]表示される', async () => {
    const query = Object.freeze({ reset_password_token: 'token' })
    const wrapper = mountFunction(false, query)
    viewTest(wrapper)

    // 変更ボタン
    const button = wrapper.find('#password_update_btn')
    expect(button.exists()).toBe(true)
    await helper.waitChangeDisabled(button, true)
    expect(button.vm.disabled).toBe(true) // 無効

    // 入力
    wrapper.vm.$data.query = { password: 'abc12345', password_confirmation: 'abc12345' }

    // 変更ボタン
    await helper.waitChangeDisabled(button, false)
    expect(button.vm.disabled).toBe(false) // 有効
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true, {})
    helper.mockCalledTest(toastedErrorMock, 0)
    helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.already_authenticated)
    helper.mockCalledTest(routerPushMock, 1, { path: '/' })
  })

  describe('トークンエラー', () => {
    const query = Object.freeze({ reset_password: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/password/reset', query: { alert: query.alert, notice: query.notice } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.already_authenticated)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })
  })

  describe('トークンnull', () => {
    const query = Object.freeze({ reset_password_token: null })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/password/reset', query: { alert: helper.locales.auth.reset_password_token_blank } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.already_authenticated)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })
  })
  describe('トークンなし', () => {
    const query = Object.freeze({ reset_password_token: '' })
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, query)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/password/reset', query: { alert: helper.locales.auth.reset_password_token_blank } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, query)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.already_authenticated)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })
  })

  describe('パスワード再設定', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', user: { name: 'user1の氏名' } })
    const params = Object.freeze({ reset_password_token: 'token', password: 'abc12345', password_confirmation: 'abc12345' })
    const apiCalledTest = (count, params = null) => {
      expect(axiosPostMock).toBeCalledTimes(count)
      if (count > 0) {
        expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.passwordUpdateUrl, {
          ...params
        })
      }
    }

    let wrapper, button
    const beforeAction = async (changeSignIn = false, options = { keydown: false, isComposing: null }) => {
      wrapper = mountFunction(false, { reset_password_token: params.reset_password_token }, { query: params })
      if (options.keydown) {
        const inputArea = wrapper.find('#input_area')
        inputArea.trigger('keydown.enter', { isComposing: options.isComposing })
        inputArea.trigger('keyup.enter')
      } else {
        button = wrapper.find('#password_update_btn')
        button.trigger('click')
      }
      if (changeSignIn) { wrapper.vm.$auth.loggedIn = true } // NOTE: 状態変更（Mockでは実行されない為）
      await helper.sleep(1)
    }

    it('[成功][ボタンクリック]ログイン状態になり、トップページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction(true)

      apiCalledTest(1, params)
      helper.mockCalledTest(authSetUserMock, 1, { name: 'user1の氏名' })
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })
    it('[成功][Enter送信]ログイン状態になり、トップページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction(true, { keydown: true, isComposing: false })

      apiCalledTest(1, params)
      helper.mockCalledTest(authSetUserMock, 1, { name: 'user1の氏名' })
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })
    it('[成功][IME確定のEnter]APIリクエストされない', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction(false, { keydown: true, isComposing: true })

      apiCalledTest(0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, true) // 無効
    })
    it('[成功]ログイン状態にならなかった場合は、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      apiCalledTest(1, params)
      helper.mockCalledTest(authSetUserMock, 1, { name: 'user1の氏名' })
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(setUniversalMock, 1, 'redirect', fullPath)
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      apiCalledTest(1, params)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      apiCalledTest(1, params)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      apiCalledTest(1, params)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { password: ['errorメッセージ'] } }, data) } }))
      await beforeAction()

      apiCalledTest(1, params)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.messageTest(wrapper, Message, data)
      helper.disabledTest(wrapper, Processing, button, true) // 無効
    })
    it('[その他エラー]パスワード再設定（メールアドレス入力）ページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      apiCalledTest(1, params)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/password/reset', query: { alert: helper.locales.system.default } })
    })
  })
})
