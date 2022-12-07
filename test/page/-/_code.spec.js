import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import SpacesIcon from '~/components/spaces/Icon.vue'
import Page from '~/pages/-/_code.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('_code.vue', () => {
  let axiosGetMock, authLogoutMock, setUniversalMock, toastedErrorMock, toastedInfoMock, routerPushMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    authLogoutMock = jest.fn()
    setUniversalMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
    nuxtErrorMock = jest.fn()
  })

  const params = Object.freeze({ code: 'code0001' })
  const fullPath = `/-/${params.code}`
  const mountFunction = (loggedIn) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        Loading: true,
        SpacesIcon: true
      },
      mocks: {
        $axios: {
          get: axiosGetMock
        },
        $auth: {
          loggedIn,
          logout: authLogoutMock,
          $storage: {
            setUniversal: setUniversalMock
          }
        },
        $route: {
          fullPath,
          params
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

  const space = Object.freeze({
    code: 'code0001',
    image_url: {
      small: 'https://example.com/images/space/small_noimage.jpg'
    },
    name: 'スペース1',
    description: 'スペース1の説明'
  })

  // テスト内容
  const apiCalledTest = () => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaceDetailUrl.replace(':code', params.code))
  }

  const viewTest = (wrapper, data) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.vm.$data.space).toEqual(data.space)

    expect(wrapper.find('#space_image').exists()).toBe(true)
    expect(wrapper.text()).toMatch(data.space.name)

    const spacesIcon = wrapper.findComponent(SpacesIcon)
    expect(spacesIcon.exists()).toBe(true)
    expect(spacesIcon.vm.$props.space).toEqual(data.space)
  }

  // テストケース
  describe('スペース情報取得', () => {
    it('[管理者]表示される（メンバー一覧・設定変更も表示）', async () => {
      const data = Object.freeze({
        space: {
          ...space,
          current_member: {
            power: 'admin'
          }
        }
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      viewTest(wrapper, data)
      expect(wrapper.find('#members_btn').exists()).toBe(true) // 表示
      expect(wrapper.find('#space_update_btn').exists()).toBe(true) // 表示
    })
    it('[投稿者]表示される（メンバー一覧は表示、設定変更は非表示）', async () => {
      const data = Object.freeze({
        space: {
          ...space,
          current_member: {
            power: 'writer'
          }
        }
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      viewTest(wrapper, data)
      expect(wrapper.find('#members_btn').exists()).toBe(true) // 表示
      expect(wrapper.find('#space_update_btn').exists()).toBe(false) // 非表示
    })
    it('[未参加]表示される（メンバー一覧・設定変更は非表示）', async () => {
      const data = Object.freeze({ space })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      viewTest(wrapper, data)
      expect(wrapper.find('#members_btn').exists()).toBe(false) // 非表示
      expect(wrapper.find('#space_update_btn').exists()).toBe(false) // 非表示
    })
    it('[データなし]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.network.failure })
    })
    it('[認証エラー][未ログイン]ログインページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(setUniversalMock, 1, 'redirect', fullPath)
      helper.mockCalledTest(routerPushMock, 1, { path: '/users/sign_in', query: { alert: helper.locales.auth.unauthenticated } })
    })
    it('[認証エラー][ログイン中]ログインページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[権限エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 403 } }))
      const wrapper = mountFunction(true)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 403, alert: helper.locales.auth.forbidden })
    })
    it('[存在しない]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 404 } }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 404, alert: helper.locales.system.notfound })
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: helper.locales.network.error })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: helper.locales.system.default })
    })
  })
})
