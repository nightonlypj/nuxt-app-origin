import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Lists from '~/components/infomations/Lists.vue'
import Page from '~/pages/infomations/index.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('index.vue', () => {
  let axiosGetMock, authFetchUserMock, authLogoutMock, toastedErrorMock, toastedInfoMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    authFetchUserMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    nuxtErrorMock = jest.fn()
  })

  const mountFunction = (loggedIn, user, values = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        Lists: true
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
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
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

  // テスト内容
  const apiCalledTest = (page) => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.infomationsUrl, { params: { page } })
  }

  const viewTest = (wrapper, data, countView) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.infomation).toEqual(data.infomation)
    expect(wrapper.vm.$data.infomations).toEqual(data.infomations)

    // console.log(wrapper.text())
    if (data.infomations?.length === 0) {
      expect(wrapper.text()).toMatch('お知らせはありません。')
    } else {
      expect(wrapper.text()).toMatch(countView) // [2頁以上]件数、開始・終了
      expect(wrapper.find('#pagination1').exists()).toBe(data.infomation.total_pages >= 2) // [2頁以上]ページネーション
      expect(wrapper.find('#pagination2').exists()).toBe(data.infomation.total_pages >= 2)
    }
    expect(wrapper.findComponent(Lists).exists()).toBe(data.infomations?.length > 0)
  }

  const updateViewTest = (wrapper, values) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.page).toBe(values.infomation.current_page)
    expect(wrapper.vm.$data.infomation).toBe(values.infomation)
    expect(wrapper.vm.$data.infomations).toBe(values.infomations)
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
      const wrapper = mountFunction(true, { infomation_unread_count: 0 }) // ログイン中、未読なし
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 0) // [未読数]再取得しない
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, data, '')
    })
    it('[1件（本文あり）]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          total_count: 1,
          current_page: 1,
          total_pages: 1,
          limit_value: 2
        },
        infomations: [
          {
            id: 1,
            title: 'タイトル1',
            summary: '概要1',
            body_present: true,
            started_at: '2021-01-01T09:00:00+09:00'
          }
        ]
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, data, '1件')
    })
    it('[1件（本文なし）]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          total_count: 1,
          current_page: 1,
          total_pages: 1,
          limit_value: 2
        },
        infomations: [
          {
            id: 2,
            title: 'タイトル2',
            summary: '概要2',
            body_present: false,
            started_at: '2021-01-02T09:00:00+09:00'
          }
        ]
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false, {}) // 未ログイン
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 0) // [未読数]再取得しない
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, data, '1件')
    })
    it('[2頁中1頁]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          total_count: 3,
          current_page: 1,
          total_pages: 2,
          limit_value: 2
        },
        infomations: [
          {
            id: 1,
            title: 'タイトル1',
            summary: '概要1',
            body_present: true,
            started_at: '2021-01-01T09:00:00+09:00'
          },
          {
            id: 2,
            title: 'タイトル2',
            summary: '概要2',
            body_present: false,
            started_at: '2021-01-02T09:00:00+09:00'
          }
        ]
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, data, '3件中 1-2件を表示')
    })
    it('[ページネーション]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          total_count: 3,
          current_page: 2,
          total_pages: 2,
          limit_value: 2
        },
        infomations: [
          {
            id: 3,
            title: 'タイトル3',
            summary: '',
            body_present: false,
            started_at: '2021-01-03T09:00:00+09:00'
          }
        ]
      })
      const values = Object.freeze({ page: 2 })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }, values) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(2)
      helper.mockCalledTest(authFetchUserMock, 0) // [未読数]再取得しない
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, data, '3件中 3-3件を表示')
    })
    describe('データなし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction(true, { infomation_unread_count: 0 }) // ログイン中、未読なし
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: locales.system.error })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        const values = Object.freeze({ page: 2, infomation: { current_page: 1 }, infomations: [{ title: 'タイトル' }] })
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction(true, { infomation_unread_count: 0 }, values) // ログイン中、未読なし
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        updateViewTest(wrapper, values)
      })
    })
    describe('ページ情報なし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation: null } }))
        const wrapper = mountFunction(false, {}) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: locales.system.error })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation: null } }))
        const values = Object.freeze({ page: 2, infomation: { current_page: 1 }, infomations: [{ title: 'タイトル' }] })
        const wrapper = mountFunction(false, {}, values) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        updateViewTest(wrapper, values)
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction(false, {}) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: locales.network.failure })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const values = Object.freeze({ page: 2, infomation: { current_page: 1 }, infomations: [{ title: 'タイトル' }] })
        const wrapper = mountFunction(false, {}, values) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
        helper.mockCalledTest(toastedInfoMock, 0)
        updateViewTest(wrapper, values)
      })
    })
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction(false, {}) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: locales.network.error })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const values = Object.freeze({ page: 2, infomation: { current_page: 1 }, infomations: [{ title: 'タイトル' }] })
        const wrapper = mountFunction(false, {}, values) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.network.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        updateViewTest(wrapper, values)
      })
    })
    describe('その他エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
        const wrapper = mountFunction(true, { infomation_unread_count: 0 }) // ログイン中、未読なし
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: locales.system.default })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
        const values = Object.freeze({ page: 2, infomation: { current_page: 1 }, infomations: [{ title: 'タイトル' }] })
        const wrapper = mountFunction(true, { infomation_unread_count: 0 }, values) // ログイン中、未読なし
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.system.default)
        helper.mockCalledTest(toastedInfoMock, 0)
        updateViewTest(wrapper, values)
      })
    })
  })

  describe('トークン検証', () => {
    const data = Object.freeze({
      infomation: {
        total_count: 1,
        current_page: 1,
        total_pages: 1,
        limit_value: 2
      },
      infomations: [
        {
          id: 1,
          title: 'タイトル1',
          summary: '概要1',
          body_present: true,
          started_at: '2021-01-01T09:00:00+09:00'
        }
      ]
    })
    it('[接続エラー]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      authFetchUserMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, data, '')
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
    })
    it('[認証エラー]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 1)
      viewTest(wrapper, data, '')
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, locales.auth.unauthenticated)
    })
    it('[その他エラー]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, data, '')
      helper.mockCalledTest(toastedErrorMock, 1, locales.system.default)
      helper.mockCalledTest(toastedInfoMock, 0)
    })
  })
})
