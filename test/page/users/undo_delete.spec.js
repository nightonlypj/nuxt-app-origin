import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Page from '~/pages/users/undo_delete.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('undo_delete.vue', () => {
  let axiosPostMock, authFetchUserMock, authSetUserMock, authRedirectMock, authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock, nuxtErrorMock

  beforeEach(() => {
    axiosPostMock = null
    authFetchUserMock = jest.fn()
    authSetUserMock = jest.fn()
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
      mocks: {
        $axios: {
          post: axiosPostMock
        },
        $auth: {
          loggedIn,
          user: { ...user },
          fetchUser: authFetchUserMock,
          setUser: authSetUserMock,
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
  const viewTest = (wrapper, destroyRequestedTime, destroyScheduleDate) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(destroyRequestedTime) // 削除依頼日時
    expect(wrapper.text()).toMatch(destroyScheduleDate) // 削除予定日
  }

  const apiCalledTest = () => {
    expect(axiosPostMock).toBeCalledTimes(1)
    expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userUndoDeleteUrl)
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
  it('[ログイン中]トップページにリダイレクトされる', async () => {
    const user = Object.freeze({ destroy_schedule_at: null })
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, Loading)

    await helper.sleep(1)
    helper.mockCalledTest(authFetchUserMock, 1)
    helper.mockCalledTest(authLogoutMock, 0)
    helper.mockCalledTest(toastedErrorMock, 1, locales.auth.not_destroy_reserved)
    helper.mockCalledTest(toastedInfoMock, 0)
    helper.mockCalledTest(routerPushMock, 1, { path: '/' })
  })
  it('[ログイン中（削除予約済み）]表示される', async () => {
    const user = Object.freeze({ destroy_requested_at: '2021-01-01T09:00:00+09:00', destroy_schedule_at: '2021-01-08T09:00:00+09:00' })
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, Loading)

    await helper.sleep(1)
    helper.mockCalledTest(authFetchUserMock, 1)
    helper.mockCalledTest(authLogoutMock, 0)
    viewTest(wrapper, '2021/01/01 09:00', '2021/01/08')

    // 取り消しボタン
    const button = wrapper.find('#user_undo_delete_btn')
    expect(button.exists()).toBe(true)
    expect(button.vm.disabled).toBe(false) // 有効
    button.trigger('click')

    // 確認ダイアログ
    await helper.sleep(1)
    const dialog = wrapper.find('#user_undo_delete_dialog')
    expect(dialog.exists()).toBe(true)

    // いいえボタン
    const noButton = wrapper.find('#user_undo_delete_no_btn')
    expect(noButton.exists()).toBe(true)
    expect(noButton.vm.disabled).toBe(false) // 有効
    noButton.trigger('click')
  })

  describe('トークン検証', () => {
    const user = Object.freeze({ destroy_requested_at: '2021-01-01T09:00:00+09:00', destroy_schedule_at: '2021-01-08T09:00:00+09:00' })
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
  })

  describe('アカウント削除取り消し', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const user = Object.freeze({ destroy_requested_at: '2021-01-01T09:00:00+09:00', destroy_schedule_at: '2021-01-08T09:00:00+09:00' })
    it('[成功]トップページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, user)

      await helper.sleep(1)
      const button = wrapper.find('#user_undo_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_undo_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authSetUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })
    it('[成功]未ログイン状態になってしまった場合は、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, user)

      await helper.sleep(1)
      const button = wrapper.find('#user_undo_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      wrapper.vm.$auth.loggedIn = false // Tips: 状態変更（Mockでは実行されない為）
      const yesButton = wrapper.find('#user_undo_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authSetUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(true, user)

      await helper.sleep(1)
      const button = wrapper.find('#user_undo_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_undo_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true, user)

      await helper.sleep(1)
      const button = wrapper.find('#user_undo_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_undo_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true, user)

      await helper.sleep(1)
      const button = wrapper.find('#user_undo_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_undo_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, locales.auth.unauthenticated)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(true, user)

      await helper.sleep(1)
      const button = wrapper.find('#user_undo_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_undo_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      const wrapper = mountFunction(true, user)

      await helper.sleep(1)
      const button = wrapper.find('#user_undo_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_undo_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, locales.system.default)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
  })
})
