import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import InfomationsLists from '~/components/infomations/Lists.vue'
import Page from '~/pages/infomations/index.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('index.vue', () => {
  let axiosGetMock, authFetchUserMock, authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    authFetchUserMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
    nuxtErrorMock = jest.fn()
  })

  const mountFunction = (loggedIn, user = {}, query = null, values = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        Loading: true,
        Processing: true,
        InfomationsLists: true
      },
      mocks: {
        $axios: {
          get: axiosGetMock
        },
        $auth: {
          loggedIn,
          user: { ...user },
          fetchUser: authFetchUserMock,
          logout: authLogoutMock
        },
        $route: {
          query: { ...query }
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
      },
      data () {
        return { ...values }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const data1 = Object.freeze({
    infomation: {
      total_count: 3,
      current_page: 1,
      total_pages: 2,
      limit_value: 2
    },
    infomations: [
      { id: 1 },
      { id: 2 }
    ]
  })
  const data2 = Object.freeze({
    infomation: {
      total_count: 3,
      current_page: 2,
      total_pages: 2,
      limit_value: 2
    },
    infomations: [
      { id: 3 }
    ]
  })

  const values1to2 = Object.freeze({
    page: 2,
    infomation: data1.infomation,
    infomations: data1.infomations
  })

  // テスト内容
  const apiCalledTest = (page) => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.infomationsUrl, { params: { page } })
  }

  const viewTest = (wrapper, data, countView) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.page).toBe(data.infomation.current_page)
    expect(wrapper.vm.$data.infomation).toEqual(data.infomation)
    expect(wrapper.vm.$data.infomations).toEqual(data.infomations)

    // console.log(wrapper.text())
    if (data.infomations?.length === 0) {
      expect(wrapper.text()).toMatch('お知らせはありません。')
    } else {
      expect(wrapper.find('#pagination1').exists()).toBe(data.infomation.total_pages >= 2) // [2頁以上]ページネーション
      expect(wrapper.find('#pagination2').exists()).toBe(data.infomation.total_pages >= 2)
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数、[2頁以上]開始・終了
    expect(wrapper.findComponent(InfomationsLists).exists()).toBe(data.infomations?.length > 0)
  }

  // テストケース
  describe('お知らせ一覧', () => {
    it('[0件]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          total_count: 0,
          current_page: 1,
          total_pages: 0,
          limit_value: 2
        }
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(routerPushMock, 1, { query: null })
      viewTest(wrapper, data, '')
    })
    it('[1件]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          total_count: 1,
          current_page: 1,
          total_pages: 1,
          limit_value: 2
        },
        infomations: [
          { id: 1 }
        ]
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(routerPushMock, 1, { query: null })
      viewTest(wrapper, data, '1件')
    })
    it('[2頁中1頁]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: data1 }))
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(routerPushMock, 1, { query: null })
      viewTest(wrapper, data1, '3件中 1-2件を表示')
    })
    it('[ページネーション]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: data2 }))
      const wrapper = mountFunction(false, {}, null, { page: 2 })
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(2)
      helper.mockCalledTest(routerPushMock, 1, { query: { page: 2 } })
      viewTest(wrapper, data2, '3件中 3-3件を表示')
    })
    it('[パラメータあり]パラメータがセットされ、表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: data2 }))
      const wrapper = mountFunction(false, {}, { page: '2' })
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(2)
      helper.mockCalledTest(routerPushMock, 1, { query: { page: 2 } })
      viewTest(wrapper, data2, '3件中 3-3件を表示')
    })
    describe('データなし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction(false, {}, null, values1to2)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        viewTest(wrapper, values1to2, '3件中 1-2件を表示')
      })
    })
    describe('ページ情報なし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation: null } }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation: null } }))
        const wrapper = mountFunction(false, {}, null, values1to2)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        viewTest(wrapper, values1to2, '3件中 1-2件を表示')
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.network.failure })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction(false, {}, null, values1to2)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        viewTest(wrapper, values1to2, '3件中 1-2件を表示')
      })
    })
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: helper.locales.network.error })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction(false, {}, null, values1to2)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        viewTest(wrapper, values1to2, '3件中 1-2件を表示')
      })
    })
    describe('その他エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: helper.locales.system.default })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
        const wrapper = mountFunction(false, {}, null, values1to2)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        viewTest(wrapper, values1to2, '3件中 1-2件を表示')
      })
    })
  })

  describe('トークン検証', () => {
    it('[ログイン中（未読なし）]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: data1 }))
      const wrapper = mountFunction(true, { infomation_unread_count: 0 }) // 未読なし
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 0) // [未読数]再取得しない
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { query: null })
      viewTest(wrapper, data1, '3件中 1-2件を表示')
    })
    it('[ログイン中（未読あり）]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: data1 }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // 未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { query: null })
      viewTest(wrapper, data1, '3件中 1-2件を表示')
    })

    it('[接続エラー]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: data1 }))
      authFetchUserMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { query: null })
      viewTest(wrapper, data1, '3件中 1-2件を表示')
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: data1 }))
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      helper.mockCalledTest(routerPushMock, 1, { query: null })
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[その他エラー]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: data1 }))
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      const wrapper = mountFunction(true)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { query: null })
      viewTest(wrapper, data1, '3件中 1-2件を表示')
    })
  })
})
