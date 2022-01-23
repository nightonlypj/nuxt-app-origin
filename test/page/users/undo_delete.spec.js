import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Page from '~/pages/users/undo_delete.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('undo_delete.vue', () => {
  let axiosPostMock, authFetchUserMock, authSetUserMock, authRedirectMock, authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosPostMock = null
    authFetchUserMock = jest.fn()
    authSetUserMock = jest.fn()
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
        $config: {
          apiBaseURL: 'https://example.com',
          userUndoDeleteUrl: '/users/auth/undo_delete.json'
        },
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
  const commonViewTest = (wrapper, destroyRequestedTime, destroyScheduleDate) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(destroyRequestedTime) // 削除依頼日時
    expect(wrapper.text()).toMatch(destroyScheduleDate) // 削除予定日
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
  const commonApiCalledTest = (setUserCalled, logoutCalled) => {
    expect(axiosPostMock).toBeCalledTimes(1)
    expect(axiosPostMock).toBeCalledWith('https://example.com/users/auth/undo_delete.json')
    expect(authSetUserMock).toBeCalledTimes(setUserCalled)
    expect(authLogoutMock).toBeCalledTimes(logoutCalled)
  }
  const commonDisabledTest = (wrapper, button, disabled) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(button.vm.disabled).toBe(disabled)
  }

  it('[未ログイン]ログインにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, {})
    commonLoadingTest(wrapper)

    await helper.sleep(1)
    commonFetchUserCalledTest(0)
    commonRedirectTest(null, locales.auth.unauthenticated, 'login', authRedirectMock)
  })
  it('[ログイン中]トップページにリダイレクトされる', async () => {
    const user = Object.freeze({ destroy_schedule_at: null })
    const wrapper = mountFunction(true, user)
    commonLoadingTest(wrapper)

    await helper.sleep(1)
    commonFetchUserCalledTest(0)
    commonRedirectTest(locales.auth.not_destroy_reserved, null, { path: '/' })
  })
  it('[ログイン中（削除予約済み）]表示される', async () => {
    const user = Object.freeze({ destroy_requested_at: '2021-01-01T09:00:00+09:00', destroy_schedule_at: '2021-01-08T09:00:00+09:00' })
    const wrapper = mountFunction(true, user)
    commonLoadingTest(wrapper)

    await helper.sleep(1)
    commonFetchUserCalledTest(0)
    commonViewTest(wrapper, '2021/01/01 09:00', '2021/01/08')

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

  describe('トークン検証API', () => {
    const user = Object.freeze({ destroy_requested_at: '2021-01-01T09:00:00+09:00', destroy_schedule_at: '2021-01-08T09:00:00+09:00' })
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

  describe('アカウント削除取り消しAPI', () => {
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
      commonApiCalledTest(1, 0)
      commonRedirectTest(data.alert, data.notice, { path: '/' })
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
      commonApiCalledTest(1, 0)
      commonRedirectTest(null, null, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
    })
    it('[連携エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data } }))
      const wrapper = mountFunction(true, user)

      await helper.sleep(1)
      const button = wrapper.find('#user_undo_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_undo_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(0, 0)
      commonToastedTest(data.alert, data.notice)
      commonDisabledTest(wrapper, button, false)
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
      commonApiCalledTest(0, 0)
      commonToastedTest(locales.network.failure, null)
      commonDisabledTest(wrapper, button, false)
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
      commonApiCalledTest(0, 1)
      commonToastedTest(null, locales.auth.unauthenticated)
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
      commonApiCalledTest(0, 0)
      commonToastedTest(locales.network.error, null)
      commonDisabledTest(wrapper, button, false)
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
      commonApiCalledTest(0, 0)
      commonToastedTest(locales.system.error, null)
      commonDisabledTest(wrapper, button, false)
    })
  })
})
