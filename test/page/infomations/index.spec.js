import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import InfomationsLists from '~/components/infomations/Lists.vue'
import Page from '~/pages/infomations/index.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('index.vue', () => {
  let axiosGetMock, authSetUserMock, authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    authSetUserMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
    nuxtErrorMock = jest.fn()
  })

  const mountFunction = (loggedIn = false, user = null, query = null, values = null) => {
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
          setUser: authSetUserMock,
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

  const dataPage1 = Object.freeze({
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
  const dataPage2 = Object.freeze({
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

  // テスト内容
  const apiCalledTest = (count, page = count) => {
    expect(axiosGetMock).toBeCalledTimes(count)
    expect(axiosGetMock).nthCalledWith(count, helper.envConfig.apiBaseURL + helper.commonConfig.infomationsUrl, { params: { page } })
  }

  const viewTest = (wrapper, data, countView) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.page).toBe(data.infomation.current_page)
    expect(wrapper.vm.$data.infomation).toEqual(data.infomation)
    expect(wrapper.vm.$data.infomations).toEqual(data.infomations)

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
  describe('お知らせ一覧取得', () => {
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
      const wrapper = mountFunction()
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
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(routerPushMock, 1, { query: null })
      viewTest(wrapper, data, '1件')
    })
    it('[ページネーション]表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
        .mockImplementationOnce(() => Promise.resolve({ data: dataPage2 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      helper.mockCalledTest(routerPushMock, 1, { query: null })

      // ページネーション（2頁目）
      wrapper.find('#pagination1').vm.$emit('input', 2)

      await helper.sleep(1)
      apiCalledTest(2)
      viewTest(wrapper, dataPage2, '3件中 3-3件を表示')
      helper.mockCalledTest(routerPushMock, 2, { query: { page: 2 } })
    })
    describe('データなし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
        helper.mockCalledTest(routerPushMock, 1, { query: null })

        // ページネーション（2頁目）
        wrapper.find('#pagination1').vm.$emit('input', 2)

        await helper.sleep(1)
        apiCalledTest(2)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 2, { query: null })
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      })
    })
    describe('現在ページが異なる', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { ...dataPage1, infomation: { ...dataPage1.infomation, current_page: 9 } } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.resolve({ data: { ...dataPage2, infomation: { ...dataPage2.infomation, current_page: 9 } } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
        helper.mockCalledTest(routerPushMock, 1, { query: null })

        // ページネーション（2頁目）
        wrapper.find('#pagination1').vm.$emit('input', 2)

        await helper.sleep(1)
        apiCalledTest(2)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 2, { query: null })
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.network.failure })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.reject({ response: null }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
        helper.mockCalledTest(routerPushMock, 1, { query: null })

        // ページネーション（2頁目）
        wrapper.find('#pagination1').vm.$emit('input', 2)

        await helper.sleep(1)
        apiCalledTest(2)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 2, { query: null })
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      })
    })
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: helper.locales.network.error })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
        helper.mockCalledTest(routerPushMock, 1, { query: null })

        // ページネーション（2頁目）
        wrapper.find('#pagination1').vm.$emit('input', 2)

        await helper.sleep(1)
        apiCalledTest(2)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 2, { query: null })
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      })
    })
    describe('その他エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { query: null })
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: helper.locales.system.default })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.reject({ response: { status: 400, data: {} } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
        helper.mockCalledTest(routerPushMock, 1, { query: null })

        // ページネーション（2頁目）
        wrapper.find('#pagination1').vm.$emit('input', 2)

        await helper.sleep(1)
        apiCalledTest(2)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 2, { query: null })
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      })
    })
  })

  describe('パラメータあり', () => {
    it('パラメータがセットされ、表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage2 }))
      const wrapper = mountFunction(false, null, { page: '2' })
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, 2)
      helper.mockCalledTest(routerPushMock, 1, { query: { page: 2 } })
      viewTest(wrapper, dataPage2, '3件中 3-3件を表示')
    })
  })

  describe('お知らせの未読数', () => {
    it('[ログイン中（未読なし）]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage1 }))
      const wrapper = mountFunction(true, { infomation_unread_count: 0 }) // 未読なし
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { query: null })
      viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
    })
    it('[ログイン中（未読あり）]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage1 }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // 未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authSetUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { query: null })
      viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
    })
  })
})
