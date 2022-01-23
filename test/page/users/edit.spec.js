import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Message from '~/components/Message.vue'
import ImageEdit from '~/components/users/edit/ImageEdit.vue'
import InfoEdit from '~/components/users/edit/InfoEdit.vue'
import Page from '~/pages/users/edit.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('edit.vue', () => {
  let axiosGetMock, authFetchUserMock, authRedirectMock, authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosGetMock = jest.fn()
    authFetchUserMock = jest.fn()
    authRedirectMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (loggedIn, user) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        ImageEdit: true,
        InfoEdit: true
      },
      mocks: {
        $config: {
          apiBaseURL: 'https://example.com',
          userShowUrl: '/users/auth/show.json'
        },
        $axios: {
          get: axiosGetMock
        },
        $auth: {
          loggedIn,
          user: { ...user },
          fetchUser: authFetchUserMock,
          redirect: authRedirectMock,
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

  const commonLoadingTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(true)
  }
  const commonFetchUserCalledTest = (logoutCalled) => {
    expect(authFetchUserMock).toBeCalledTimes(1)
    expect(authLogoutMock).toBeCalledTimes(logoutCalled)
  }
  const commonApiCalledTest = (logoutCalled) => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).toBeCalledWith('https://example.com/users/auth/show.json')
    expect(authLogoutMock).toBeCalledTimes(logoutCalled)
  }
  const commonViewTest = (wrapper, user, unconfirmed) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBe(null)
    expect(wrapper.findComponent(Message).vm.$props.notice).toBe(null)
    expect(wrapper.findComponent(ImageEdit).exists()).toBe(true)
    expect(wrapper.findComponent(InfoEdit).exists()).toBe(true)
    expect(wrapper.findComponent(InfoEdit).vm.$props.user).toBe(user)

    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/users/confirmation/new')).toBe(unconfirmed) // [メールアドレス変更中]メールアドレス確認
    expect(links.includes('/users/delete')).toBe(true) // アカウント削除
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
  const commonRedirectTest = (alert, notice, url, mock = routerPushMock) => {
    commonToastedTest(alert, notice)
    expect(mock).toBeCalledTimes(1)
    expect(mock).toBeCalledWith(url)
  }

  it('[未ログイン]ログインにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, {})
    commonLoadingTest(wrapper)

    await helper.sleep(1)
    commonFetchUserCalledTest(0)
    commonRedirectTest(null, locales.auth.unauthenticated, 'login', authRedirectMock)
  })
  it('[ログイン中]表示される', async () => {
    const user = Object.freeze({ email: 'user1@example.com', unconfirmed_email: null })
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { user } }))
    const wrapper = mountFunction(true, { destroy_schedule_at: null })
    commonLoadingTest(wrapper)

    await helper.sleep(1)
    commonFetchUserCalledTest(0)
    commonApiCalledTest(0)
    commonViewTest(wrapper, user, false)
  })
  it('[ログイン中（メールアドレス変更中）]表示される', async () => {
    const user = Object.freeze({ email: 'user1@example.com', unconfirmed_email: 'new@example.com' })
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { user } }))
    const wrapper = mountFunction(true, { destroy_schedule_at: null })
    commonLoadingTest(wrapper)

    await helper.sleep(1)
    commonFetchUserCalledTest(0)
    commonApiCalledTest(0)
    commonViewTest(wrapper, user, true)
  })
  it('[ログイン中（削除予約済み）]トップページにリダイレクトされる', async () => {
    const wrapper = mountFunction(true, { destroy_schedule_at: '2021-01-08T09:00:00+09:00' })
    commonLoadingTest(wrapper)

    await helper.sleep(1)
    commonFetchUserCalledTest(0)
    commonRedirectTest(locales.auth.destroy_reserved, null, { path: '/' })
  })

  describe('トークン検証API', () => {
    const user = Object.freeze({ destroy_schedule_at: null })
    it('[接続エラー]トップページにリダイレクトされる', async () => {
      authFetchUserMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true, user)
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonFetchUserCalledTest(0)
      commonRedirectTest(locales.network.failure, null, { path: '/' })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true, user)
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonFetchUserCalledTest(1)
      commonToastedTest(null, locales.auth.unauthenticated)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]トップページにリダイレクトされる', async () => {
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(true, user)
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonFetchUserCalledTest(0)
      commonRedirectTest(locales.network.error, null, { path: '/' })
    })
  })

  describe('登録情報詳細API', () => {
    const user = Object.freeze({ destroy_schedule_at: null })
    it('[接続エラー]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true, user)
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest(0)
      commonRedirectTest(locales.network.failure, null, { path: '/' })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true, user)
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest(1)
      commonToastedTest(null, locales.auth.unauthenticated)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(true, user)
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest(0)
      commonRedirectTest(locales.network.error, null, { path: '/' })
    })
    it('[データなし]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(true, user)
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest(0)
      commonRedirectTest(locales.system.error, null, { path: '/' })
    })
  })
})
