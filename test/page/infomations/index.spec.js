import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Label from '~/components/infomations/Label.vue'
import Page from '~/pages/infomations/index.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('index.vue', () => {
  let axiosGetMock, authFetchUserMock, authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosGetMock = null
    authFetchUserMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (loggedIn, user, values = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        Label: true
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
        $router: {
          push: routerPushMock
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

  const viewTest = (wrapper, infomation, infomations, countView, startViews) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.info).toEqual(infomation)
    expect(wrapper.vm.$data.lists).toEqual(infomations)

    // console.log(wrapper.text())
    if (infomations.length === 0) {
      expect(wrapper.text()).toMatch('お知らせはありません。')
    } else {
      expect(wrapper.text()).toMatch(countView) // [2頁以上]件数、開始・終了
      expect(wrapper.find('#pagination').exists()).toBe(infomation.total_pages >= 2) // [2頁以上]ページネーション
      expect(wrapper.find('#pagination2').exists()).toBe(infomation.total_pages >= 2)

      const labels = wrapper.findAllComponents(Label)
      const links = helper.getLinks(wrapper)

      // console.log(links)
      for (const [index, list] of infomations.entries()) {
        expect(labels.at(index).exists()).toBe(true) // ラベル
        expect(labels.at(index).vm.$props.list).toEqual(list)
        expect(links.includes('/infomations/' + list.id)).toBe(list.body_present) // [本文あり]お知らせ詳細
        expect(wrapper.text()).toMatch(list.title) // タイトル
        expect(wrapper.text()).toMatch(list.summary) // 概要
        expect(wrapper.text()).toMatch(startViews[index]) // 開始日時
      }
    }
  }

  const updateViewTest = (wrapper, values) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.page).toBe(values.info.current_page)
    expect(wrapper.vm.$data.info).toBe(values.info)
    expect(wrapper.vm.$data.lists).toBe(values.lists)
  }

  // テストケース
  describe('お知らせ一覧', () => {
    it('[0件]表示される', async () => {
      const infomation = Object.freeze({
        total_count: 0,
        current_page: 1,
        total_pages: 0,
        limit_value: 2
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations: [] } }))
      const wrapper = mountFunction(true, { infomation_unread_count: 0 }) // ログイン中、未読なし
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 0) // [未読数]再取得しない
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, infomation, [], '', null)
    })
    it('[1件（本文あり）]表示される', async () => {
      const infomation = Object.freeze({
        total_count: 1,
        current_page: 1,
        total_pages: 1,
        limit_value: 2
      })
      const infomations = Object.freeze([
        {
          id: 1,
          title: 'タイトル1',
          summary: '概要1',
          body_present: true,
          started_at: '2021-01-01T09:00:00+09:00'
        }
      ])
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations } }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, infomation, infomations, '', ['2021/01/01'])
    })
    it('[1件（本文なし）]表示される', async () => {
      const infomation = Object.freeze({
        total_count: 1,
        current_page: 1,
        total_pages: 1,
        limit_value: 2
      })
      const infomations = Object.freeze([
        {
          id: 2,
          title: 'タイトル2',
          summary: '概要2',
          body_present: false,
          started_at: '2021-01-02T09:00:00+09:00'
        }
      ])
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations } }))
      const wrapper = mountFunction(false, {}) // 未ログイン
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 0) // [未読数]再取得しない
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, infomation, infomations, '', ['2021/01/02'])
    })
    it('[2頁中1頁]表示される', async () => {
      const infomation = Object.freeze({
        total_count: 3,
        current_page: 1,
        total_pages: 2,
        limit_value: 2
      })
      const infomations = Object.freeze([
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
      ])
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations } }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, infomation, infomations, '3件中 1-2件を表示', ['2021/01/01', '2021/01/02'])
    })
    it('[ページネーション]表示される', async () => {
      const infomation = Object.freeze({
        total_count: 3,
        current_page: 2,
        total_pages: 2,
        limit_value: 2
      })
      const infomations = Object.freeze([
        {
          id: 3,
          title: 'タイトル3',
          summary: '',
          body_present: false,
          started_at: '2021-01-03T09:00:00+09:00'
        }
      ])
      const values = Object.freeze({ page: 2, info: {} })
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations } }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }, values) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(2)
      helper.mockCalledTest(authFetchUserMock, 0) // [未読数]再取得しない
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, infomation, infomations, '3件中 3-3件を表示', ['2021/01/03'])
    })
    describe('データなし', () => {
      it('[初期表示]トップページにリダイレクトされる', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction(true, { infomation_unread_count: 0 }) // ログイン中、未読なし
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { path: '/' })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        const values = Object.freeze({ page: 2, info: { current_page: 1 }, lists: [{ title: 'タイトル' }] })
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
      it('[初期表示]トップページにリダイレクトされる', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation: null } }))
        const wrapper = mountFunction(false, {}) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { path: '/' })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation: null } }))
        const values = Object.freeze({ page: 2, info: { current_page: 1 }, lists: [{ title: 'タイトル' }] })
        const wrapper = mountFunction(false, {}, values) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        updateViewTest(wrapper, values)
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]トップページにリダイレクトされる', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction(false, {}) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { path: '/' })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const values = Object.freeze({ page: 2, info: { current_page: 1 }, lists: [{ title: 'タイトル' }] })
        const wrapper = mountFunction(false, {}, values) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
        helper.mockCalledTest(toastedInfoMock, 0)
        updateViewTest(wrapper, values)
      })
    })
    describe('レスポンスエラー', () => {
      it('[初期表示]トップページにリダイレクトされる', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction(false, {}) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.network.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 1, { path: '/' })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const values = Object.freeze({ page: 2, info: { current_page: 1 }, lists: [{ title: 'タイトル' }] })
        const wrapper = mountFunction(false, {}, values) // 未ログイン
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, locales.network.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        updateViewTest(wrapper, values)
      })
    })
    describe('その他エラー', () => {
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      it('[初期表示]トップページにリダイレクトされる', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 422, data } }))
        const wrapper = mountFunction(true, { infomation_unread_count: 0 }) // ログイン中、未読なし
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, data.alert)
        helper.mockCalledTest(toastedInfoMock, 1, data.notice)
        helper.mockCalledTest(routerPushMock, 1, { path: '/' })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 422, data } }))
        const values = Object.freeze({ page: 2, info: { current_page: 1 }, lists: [{ title: 'タイトル' }] })
        const wrapper = mountFunction(true, { infomation_unread_count: 0 }, values) // ログイン中、未読なし
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 1, data.alert)
        helper.mockCalledTest(toastedInfoMock, 1, data.notice)
        updateViewTest(wrapper, values)
      })
    })
  })

  describe('トークン検証', () => {
    const infomation = Object.freeze({
      total_count: 1,
      current_page: 1,
      total_pages: 1,
      limit_value: 2
    })
    const infomations = Object.freeze([
      {
        id: 1,
        title: 'タイトル1',
        summary: '概要1',
        body_present: true,
        started_at: '2021-01-01T09:00:00+09:00'
      }
    ])
    it('[接続エラー]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations } }))
      authFetchUserMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, infomation, infomations, '', ['2021/01/01'])
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
    })
    it('[認証エラー]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations } }))
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 1)
      viewTest(wrapper, infomation, infomations, '', ['2021/01/01'])
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, locales.auth.unauthenticated)
    })
    it('[レスポンスエラー]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations } }))
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, infomation, infomations, '', ['2021/01/01'])
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
    })
    it('[その他エラー]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations } }))
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      authFetchUserMock = jest.fn(() => Promise.reject({ response: { status: 422, data } }))
      const wrapper = mountFunction(true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      helper.mockCalledTest(authFetchUserMock, 1) // [未読数]再取得する
      helper.mockCalledTest(authLogoutMock, 0)
      viewTest(wrapper, infomation, infomations, '', ['2021/01/01'])
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
    })
  })
})
