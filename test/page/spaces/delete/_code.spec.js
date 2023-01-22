import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Page from '~/pages/spaces/delete/_code.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('_code.vue', () => {
  let axiosGetMock, axiosPostMock, authFetchUserMock, authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    axiosPostMock = null
    authFetchUserMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
    nuxtErrorMock = jest.fn()
  })

  const space = Object.freeze({
    code: 'code0001',
    destroy_schedule_days: 789
  })
  const spaceAdmin = Object.freeze({
    ...space,
    current_member: {
      power: 'admin'
    }
  })
  const mountFunction = (loggedIn = true, user = null) => {
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
        $axios: {
          get: axiosGetMock,
          post: axiosPostMock
        },
        $auth: {
          loggedIn,
          user: { ...user },
          fetchUser: authFetchUserMock,
          logout: authLogoutMock
        },
        $route: {
          params: {
            code: space.code
          }
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
  const viewTest = (wrapper) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.text()).toMatch(String(space.destroy_schedule_days)) // スペース削除の猶予期間
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', () => {
    const wrapper = mountFunction(false)
    helper.loadingTest(wrapper, Loading)
    expect(wrapper.findComponent(Loading).exists()).toBe(true) // NOTE: Jestでmiddlewareが実行されない為
  })
  it('[ログイン中（管理者）]表示される', async () => {
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { space: spaceAdmin } }))
    const user = Object.freeze({ destroy_schedule_at: null })
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, Loading)
    await helper.sleep(1)

    viewTest(wrapper)

    // 削除ボタン
    const button = wrapper.find('#space_delete_btn')
    expect(button.exists()).toBe(true)
    expect(button.vm.disabled).toBe(false) // 有効
    button.trigger('click')
    await helper.sleep(1)

    // 確認ダイアログ
    const dialog = wrapper.find('#space_delete_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // はいボタン
    const yesButton = wrapper.find('#space_delete_yes_btn')
    expect(yesButton.exists()).toBe(true)
    expect(yesButton.vm.disabled).toBe(false) // 有効

    // いいえボタン
    const noButton = wrapper.find('#space_delete_no_btn')
    expect(noButton.exists()).toBe(true)
    expect(noButton.vm.disabled).toBe(false) // 有効
    noButton.trigger('click')
    await helper.sleep(1)

    // 確認ダイアログ
    expect(dialog.isVisible()).toBe(false) // 非表示
  })
  it('[ログイン中（管理者以外）]スペーストップにリダイレクトされる', async () => {
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { space } }))
    const user = Object.freeze({ destroy_schedule_at: null })
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, Loading)
    await helper.sleep(1)

    helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.forbidden)
    helper.mockCalledTest(toastedInfoMock, 0)
    helper.mockCalledTest(routerPushMock, 1, { path: `/-/${space.code}` })
  })
  it('[ログイン中][スペース削除予定]スペーストップにリダイレクトされる', async () => {
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { space: { ...spaceAdmin, destroy_schedule_at: '2000-01-08T12:34:56+09:00' } } }))
    const user = Object.freeze({ destroy_schedule_at: null })
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, Loading)
    await helper.sleep(1)

    helper.mockCalledTest(toastedErrorMock, 1, helper.locales.alert.space.destroy_reserved)
    helper.mockCalledTest(toastedInfoMock, 0)
    helper.mockCalledTest(routerPushMock, 1, { path: `/-/${space.code}` })
  })
  it('[ログイン中（削除予約済み）]スペーストップにリダイレクトされる', async () => {
    const user = Object.freeze({ destroy_schedule_at: '2000-01-08T12:34:56+09:00' })
    const wrapper = mountFunction(true, user)
    helper.loadingTest(wrapper, Loading)
    await helper.sleep(1)

    helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
    helper.mockCalledTest(toastedInfoMock, 0)
    helper.mockCalledTest(routerPushMock, 1, { path: `/-/${space.code}` })
  })

  describe('スペース詳細取得', () => {
    const beforeAction = async () => {
      mountFunction()
      await helper.sleep(1)

      apiCalledTest()
    }
    const apiCalledTest = () => {
      expect(axiosGetMock).toBeCalledTimes(1)
      expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaces.detailUrl.replace(':code', space.code))
    }

    it('[データなし]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.network.failure })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: helper.locales.network.error })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: helper.locales.system.default })
    })
  })

  describe('スペース削除', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const apiCalledTest = () => {
      expect(axiosPostMock).toBeCalledTimes(1)
      expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaces.deleteUrl.replace(':code', space.code))
    }

    let wrapper, button
    const beforeAction = async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { space: spaceAdmin } }))
      wrapper = mountFunction()
      await helper.sleep(1)

      // 削除ボタン
      button = wrapper.find('#space_delete_btn')
      button.trigger('click')
      await helper.sleep(1)

      // はいボタン
      wrapper.find('#space_delete_yes_btn').trigger('click')
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[成功]スペーストップにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.mockCalledTest(routerPushMock, 1, { path: `/-/${space.code}` })
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 406 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
  })
})
