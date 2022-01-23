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
  let axiosGetMock, axiosPostMock, authFetchUserMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosPostMock = null
    authFetchUserMock = jest.fn()
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
        $config: {
          apiBaseURL: 'https://example.com',
          infomationsUrl: '/infomations.json'
        },
        $axios: {
          get: axiosGetMock,
          post: axiosPostMock
        },
        $auth: {
          loggedIn,
          user: { ...user },
          fetchUser: authFetchUserMock
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

  const commonLoadingTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(true)
  }
  const commonApiCalledTest = (page, fetchUserCalled) => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).toBeCalledWith('https://example.com/infomations.json', { params: { page } })
    expect(authFetchUserMock).toBeCalledTimes(fetchUserCalled)
  }
  const commonViewTest = (wrapper, infomation, infomations, countView, startViews) => {
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
  const commonRedirectTest = (alert, notice, url) => {
    commonToastedTest(alert, notice)
    expect(routerPushMock).toBeCalledTimes(1)
    expect(routerPushMock).toBeCalledWith(url)
  }
  const commonReturnTest = (alert, notice, wrapper, values) => {
    commonToastedTest(alert, notice)

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.page).toBe(values.info.current_page)
    expect(wrapper.vm.$data.info).toBe(values.info)
    expect(wrapper.vm.$data.lists).toBe(values.lists)
  }

  describe('お知らせ一覧API', () => {
    it('[0件]表示される', async () => {
      const infomation = Object.freeze({
        total_count: 0,
        current_page: 1,
        total_pages: 0,
        limit_value: 2
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations: [] } }))
      const wrapper = mountFunction(true, { infomation_unread_count: 0 }) // ログイン中、未読なし
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest(1, 0) // [未読数]再取得しない
      commonViewTest(wrapper, infomation, [], '', null)
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
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest(1, 1) // [未読数]再取得する
      commonViewTest(wrapper, infomation, infomations, '', ['2021/01/01'])
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
      const wrapper = mountFunction(false, null) // 未ログイン
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest(1, 0) // [未読数]再取得しない
      commonViewTest(wrapper, infomation, infomations, '', ['2021/01/02'])
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
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest(1, 1) // [未読数]再取得する
      commonViewTest(wrapper, infomation, infomations, '3件中 1-2件を表示', ['2021/01/01', '2021/01/02'])
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
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest(2, 0) // [未読数]再取得しない
      commonViewTest(wrapper, infomation, infomations, '3件中 3-3件を表示', ['2021/01/03'])
    })

    describe('接続エラー', () => {
      it('[初期表示]トップページにリダイレクトされる', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction(false, null) // 未ログイン
        commonLoadingTest(wrapper)

        await helper.sleep(1)
        commonRedirectTest(locales.network.failure, null, { path: '/' })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        const values = Object.freeze({ page: 2, info: { current_page: 1 }, lists: [{ title: 'タイトル' }] })
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction(false, null, values) // 未ログイン
        commonLoadingTest(wrapper)

        await helper.sleep(1)
        commonReturnTest(locales.network.failure, null, wrapper, values)
      })
    })
    it('[レスポンスエラー]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(false, null) // 未ログイン
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.network.error, null, { path: '/' })
    })
    describe('データなし', () => {
      it('[初期表示]トップページにリダイレクトされる', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction(true, { infomation_unread_count: 0 }) // ログイン中、未読なし
        commonLoadingTest(wrapper)

        await helper.sleep(1)
        commonRedirectTest(locales.system.error, null, { path: '/' })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        const values = Object.freeze({ page: 2, info: { current_page: 1 }, lists: [{ title: 'タイトル' }] })
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction(true, { infomation_unread_count: 0 }, values) // ログイン中、未読なし
        commonLoadingTest(wrapper)

        await helper.sleep(1)
        commonReturnTest(locales.system.error, null, wrapper, values)
      })
    })
    it('[ページ情報なし]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation: null } }))
      const wrapper = mountFunction(false, null) // 未ログイン
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.system.error, null, { path: '/' })
    })
  })
})
