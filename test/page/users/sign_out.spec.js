import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
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
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // ログアウトボタン
    const button = wrapper.find('#sign_out_btn')
    expect(button.exists()).toBe(true)
    expect(button.vm.disabled).toBe(false) // 有効
  }

  const updateViewTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(true)
  }

  // テストケース
  it('[未ログイン]トップページにリダイレクトされる', () => {
    mountFunction(false)
    helper.mockCalledTest(toastedErrorMock, 0)
    helper.mockCalledTest(toastedInfoMock, 1, locales.auth.already_signed_out)
    helper.mockCalledTest(routerPushMock, 1, { path: '/' })
  })
  it('[ログイン中]表示される', () => {
    const wrapper = mountFunction(true)
    viewTest(wrapper)
  })

  describe('ログアウト', () => {
    it('[成功]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      authLogoutMock = jest.fn()
      const wrapper = mountFunction(true)

      // Devise Token Auth
      localStorage.setItem('token-type', 'Bearer')
      localStorage.setItem('uid', '101')
      localStorage.setItem('client', 'abc')
      localStorage.setItem('access-token', 'token')
      localStorage.setItem('expiry', '123')

      const button = wrapper.find('#sign_out_btn')
      button.trigger('click')

      await helper.sleep(1)
      updateViewTest(wrapper)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, locales.auth.signed_out)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）

      // Devise Token Auth
      expect(localStorage.getItem('token-type')).toBe(null)
      expect(localStorage.getItem('uid')).toBe(null)
      expect(localStorage.getItem('client')).toBe(null)
      expect(localStorage.getItem('access-token')).toBe(null)
      expect(localStorage.getItem('expiry')).toBe(null)
    })

    it('[接続エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => { // Tips: エラーでもフロントは未ログイン状態になる
      authLogoutMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true)
      const button = wrapper.find('#sign_out_btn')
      button.trigger('click')

      await helper.sleep(1)
      updateViewTest(wrapper)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 1, locales.auth.signed_out)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => { // Tips: エラーでもフロントは未ログイン状態になる
      authLogoutMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(true)
      const button = wrapper.find('#sign_out_btn')
      button.trigger('click')

      await helper.sleep(1)
      updateViewTest(wrapper)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 1, locales.auth.signed_out)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[その他エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => { // Tips: エラーでもフロントは未ログイン状態になる
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      authLogoutMock = jest.fn(() => Promise.reject({ response: { status: 422, data } }))
      const wrapper = mountFunction(true)
      const button = wrapper.find('#sign_out_btn')
      button.trigger('click')

      await helper.sleep(1)
      updateViewTest(wrapper)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, locales.auth.signed_out)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
  })
})
