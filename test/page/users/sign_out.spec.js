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

  const commonViewTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // ログアウトボタン
    const button = wrapper.find('#sign_out_btn')
    expect(button.exists()).toBe(true)
    expect(button.vm.disabled).toBe(false) // 有効
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
  const commonProcessingTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(true)
  }
  const commonApiCalledTest = () => {
    expect(authLogoutMock).toBeCalledTimes(1)
  }

  it('[未ログイン]トップページにリダイレクトされる', () => {
    mountFunction(false)
    commonRedirectTest(null, locales.auth.already_signed_out, { path: '/' })
  })
  it('[ログイン中]表示される', () => {
    const wrapper = mountFunction(true)
    commonViewTest(wrapper)
  })

  describe('ログアウトAPI', () => {
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
      commonProcessingTest(wrapper)
      commonApiCalledTest()
      commonToastedTest(null, locales.auth.signed_out)
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
      commonProcessingTest(wrapper)
      commonApiCalledTest()
      commonToastedTest(locales.network.failure, locales.auth.signed_out)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => { // Tips: エラーでもフロントは未ログイン状態になる
      authLogoutMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(true)
      const button = wrapper.find('#sign_out_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonProcessingTest(wrapper)
      commonApiCalledTest()
      commonToastedTest(locales.network.error, locales.auth.signed_out)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
  })
})
