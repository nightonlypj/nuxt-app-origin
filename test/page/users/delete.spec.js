import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Page from '~/pages/users/delete.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('delete.vue', () => {
  let authFetchUserMock, authRedirectMock, authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
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
      mocks: {
        $auth: {
          loggedIn,
          user,
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
  const commonViewTest = (wrapper, user) => {
    expect(authFetchUserMock).toBeCalledTimes(1)

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(String(user.destroy_schedule_days)) // アカウント削除の猶予期間
  }
  const commonRedirectTest = (alert, notice, mock, url) => {
    expect(authFetchUserMock).toBeCalledTimes(1)
    expect(toastedErrorMock).toBeCalledTimes(alert !== null ? 1 : 0)
    if (alert !== null) {
      expect(toastedErrorMock).toBeCalledWith(alert)
    }
    expect(toastedInfoMock).toBeCalledTimes(notice !== null ? 1 : 0)
    if (notice !== null) {
      expect(toastedInfoMock).toBeCalledWith(notice)
    }
    expect(mock).toBeCalledTimes(1)
    expect(mock).toBeCalledWith(url)
  }
  const commonLogoutTest = () => {
    expect(authFetchUserMock).toBeCalledTimes(1)
    expect(authLogoutMock).toBeCalledTimes(1)
    expect(toastedErrorMock).toBeCalledTimes(0)
    expect(toastedInfoMock).toBeCalledTimes(1)
    expect(toastedInfoMock).toBeCalledWith(locales.auth.unauthenticated)
  }

  it('[未ログイン]ログインにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, {})
    commonLoadingTest(wrapper)

    await helper.sleep(1)
    commonRedirectTest(null, locales.auth.unauthenticated, authRedirectMock, 'login')
  })
  it('[ログイン中]表示される', async () => {
    const user = { destroy_schedule_at: null, destroy_schedule_days: 789 }
    const wrapper = mountFunction(true, user)
    commonLoadingTest(wrapper)

    await helper.sleep(1)
    commonViewTest(wrapper, user)
  })
  it('[ログイン中（削除予約済み）]トップページにリダイレクトされる', async () => {
    const wrapper = mountFunction(true, { destroy_schedule_at: '2021-01-08T09:00:00+09:00' })
    commonLoadingTest(wrapper)

    await helper.sleep(1)
    commonRedirectTest(locales.auth.destroy_reserved, null, routerPushMock, { path: '/' })
  })

  describe('トークン検証API', () => {
    it('[接続エラー]トップページにリダイレクトされる', async () => {
      authFetchUserMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true, { destroy_schedule_at: null })
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.network.failure, null, routerPushMock, { path: '/' })
    })
    it('[レスポンスエラー]トップページにリダイレクトされる', async () => {
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 404 } }))
      const wrapper = mountFunction(true, { destroy_schedule_at: null })
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.network.error, null, routerPushMock, { path: '/' })
    })
    it('[認証エラー]ログアウトされる', async () => {
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true, { destroy_schedule_at: null })
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonLogoutTest()
    })
  })

  // TODO: onUserDelete
})
