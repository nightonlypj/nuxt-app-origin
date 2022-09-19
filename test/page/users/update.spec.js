import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Message from '~/components/Message.vue'
import UpdateImage from '~/components/users/update/Image.vue'
import UpdateData from '~/components/users/update/Data.vue'
import Page from '~/pages/users/update.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('update.vue', () => {
  let axiosGetMock, authFetchUserMock, authRedirectMock, authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    authFetchUserMock = jest.fn()
    authRedirectMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
    nuxtErrorMock = jest.fn()
  })

  const mountFunction = (loggedIn, user) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        UpdateImage: true,
        UpdateData: true
      },
      mocks: {
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
        },
        $nuxt: {
          error: nuxtErrorMock
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const apiCalledTest = () => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userDetailUrl)
  }

  const viewTest = (wrapper, user, unconfirmed) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBeNull()
    expect(wrapper.findComponent(Message).vm.$props.notice).toBeNull()
    expect(wrapper.findComponent(UpdateImage).exists()).toBe(true)
    expect(wrapper.findComponent(UpdateData).exists()).toBe(true)
    expect(wrapper.findComponent(UpdateData).vm.$props.user).toBe(user)

    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/users/confirmation/resend')).toBe(unconfirmed) // [メールアドレス変更中]メールアドレス確認
    expect(links.includes('/users/delete')).toBe(true) // アカウント削除
  }

  // テストケース
  it('[未ログイン]ログインにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, {})
    helper.loadingTest(wrapper, Loading)

    await helper.sleep(1)
    helper.mockCalledTest(authFetchUserMock, 1)
    helper.mockCalledTest(authLogoutMock, 0)
    helper.mockCalledTest(toastedErrorMock, 0)
    helper.mockCalledTest(toastedInfoMock, 1, locales.auth.unauthenticated)
    helper.mockCalledTest(authRedirectMock, 1, 'login')
  })
  it('[ログイン中]表示される', async () => {
    const user = Object.freeze({ email: 'user1@example.com', unconfirmed_email: null })
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { user } }))
    const wrapper = mountFunction(true, { destroy_schedule_at: null })
    helper.loadingTest(wrapper, Loading)

    await helper.sleep(1)
    helper.mockCalledTest(authFetchUserMock, 1)
    helper.mockCalledTest(authLogoutMock, 0)
    apiCalledTest()
    viewTest(wrapper, user, false)
  })
  it('[ログイン中（メールアドレス変更中）]表示される', async () => {
    const user = Object.freeze({ email: 'user1@example.com', unconfirmed_email: 'new@example.com' })
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { user } }))
    const wrapper = mountFunction(true, { destroy_schedule_at: null })
    helper.loadingTest(wrapper, Loading)

    await helper.sleep(1)
    helper.mockCalledTest(authFetchUserMock, 1)
    helper.mockCalledTest(authLogoutMock, 0)
    apiCalledTest()
    viewTest(wrapper, user, true)
  })
  it('[ログイン中（削除予約済み）]トップページにリダイレクトされる', async () => {
    const wrapper = mountFunction(true, { destroy_schedule_at: '2021-01-08T09:00:00+09:00' })
    helper.loadingTest(wrapper, Loading)

    await helper.sleep(1)
    helper.mockCalledTest(authFetchUserMock, 1)
    helper.mockCalledTest(authLogoutMock, 0)
    helper.mockCalledTest(toastedErrorMock, 1, locales.auth.destroy_reserved)
    helper.mockCalledTest(toastedInfoMock, 0)
    helper.mockCalledTest(routerPushMock, 1, { path: '/' })
  })

  describe('トークン検証', () => {
    const user = Object.freeze({ destroy_schedule_at: null })
    it('[接続エラー]エラーページが表示される', async () => {
      authFetchUserMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      helper.mockCalledTest(authFetchUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: locales.network.failure })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      helper.mockCalledTest(authFetchUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, locales.auth.unauthenticated)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      helper.mockCalledTest(authFetchUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: locales.network.error })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      const wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      helper.mockCalledTest(authFetchUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: locales.system.default })
    })
  })

  describe('登録情報詳細', () => {
    const user = Object.freeze({ destroy_schedule_at: null })
    it('[データなし]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: locales.system.error })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: locales.network.failure })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, locales.auth.unauthenticated)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: locales.network.error })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      const wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: locales.system.default })
    })
  })
})
