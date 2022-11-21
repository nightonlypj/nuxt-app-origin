import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Page from '~/pages/users/sign_out.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('sign_out.vue', () => {
  let authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    authLogoutMock = null
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (loggedIn) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        Loading: true,
        Processing: true
      },
      mocks: {
        $auth: {
          loggedIn,
          logout: authLogoutMock
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        },
        $router: {
          push: routerPushMock
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // ログアウトボタン
    const button = wrapper.find('#sign_out_btn')
    expect(button.exists()).toBe(true)
    expect(button.vm.disabled).toBe(false) // 有効
  }

  const updateViewTest = (wrapper) => {
    expect(wrapper.findComponent(Processing).exists()).toBe(true)

    // Devise Token Auth
    expect(localStorage.getItem('token-type')).toBeNull()
    expect(localStorage.getItem('uid')).toBeNull()
    expect(localStorage.getItem('client')).toBeNull()
    expect(localStorage.getItem('access-token')).toBeNull()
    expect(localStorage.getItem('expiry')).toBeNull()

    // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
  }

  // テストケース
  it('[未ログイン]トップページにリダイレクトされる', () => {
    mountFunction(false)
    helper.mockCalledTest(toastedErrorMock, 0)
    helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.already_signed_out)
    helper.mockCalledTest(routerPushMock, 1, { path: '/' })
  })
  it('[ログイン中]表示される', () => {
    const wrapper = mountFunction(true)
    viewTest(wrapper)
  })

  describe('ログアウト', () => {
    let wrapper
    const beforeAction = async () => {
      // Devise Token Auth
      localStorage.setItem('token-type', 'Bearer')
      localStorage.setItem('uid', '101')
      localStorage.setItem('client', 'abc')
      localStorage.setItem('access-token', 'token')
      localStorage.setItem('expiry', '123')

      wrapper = mountFunction(true)
      wrapper.find('#sign_out_btn').trigger('click')

      await helper.sleep(1)
      updateViewTest(wrapper)
    }

    it('[成功]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      authLogoutMock = jest.fn()
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.signed_out)
    })

    it('[接続エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => { // NOTE: エラーでもフロントは未ログイン状態になる
      authLogoutMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.signed_out)
    })
    it('[レスポンスエラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => { // NOTE: エラーでもフロントは未ログイン状態になる
      authLogoutMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.signed_out)
    })
    it('[その他エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => { // NOTE: エラーでもフロントは未ログイン状態になる
      authLogoutMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.signed_out)
    })
  })
})
