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
  let axiosGetMock, authFetchUserMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    authFetchUserMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (params, loggedIn, user) => {
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
          infomationsUrl: '/infomations.json',
          params
        },
        $axios: {
          get: axiosGetMock
        },
        $auth: {
          loggedIn,
          user,
          fetchUser: authFetchUserMock
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
  const commonViewTest = (wrapper, page, infomation, infomations, fetchUserCalled, countView, startViews) => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).toBeCalledWith('https://example.com/infomations.json', { params: { page } })
    expect(authFetchUserMock).toBeCalledTimes(fetchUserCalled)

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
  const commonRedirectTest = (alert, notice, url) => {
    expect(toastedErrorMock).toBeCalledTimes(alert !== null ? 1 : 0)
    if (alert !== null) {
      expect(toastedErrorMock).toBeCalledWith(alert)
    }
    expect(toastedInfoMock).toBeCalledTimes(notice !== null ? 1 : 0)
    if (notice !== null) {
      expect(toastedInfoMock).toBeCalledWith(notice)
    }
    expect(routerPushMock).toBeCalledTimes(1)
    expect(routerPushMock).toBeCalledWith(url)
  }

  describe('お知らせ一覧API', () => {
    it('[0件]表示される', async () => {
      const infomation = {
        total_count: 0,
        current_page: 1,
        total_pages: 0,
        limit_value: 2
      }
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations: [] } }))
      const wrapper = mountFunction({ id: 1 }, true, { infomation_unread_count: 0 }) // ログイン中、未読なし
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonViewTest(wrapper, 1, infomation, [], 0, '', null)
    })
    it('[1件（本文あり）]表示される', async () => {
      const infomation = {
        total_count: 1,
        current_page: 1,
        total_pages: 1,
        limit_value: 2
      }
      const infomations = [
        {
          id: 1,
          title: 'タイトル1',
          summary: '概要1',
          body_present: true,
          started_at: '2021-01-01T09:00:00+09:00'
        }
      ]
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations } }))
      const wrapper = mountFunction({ id: 1 }, true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonViewTest(wrapper, 1, infomation, infomations, 1, '', ['2021/01/01'])
    })
    it('[1件（本文なし）]表示される', async () => {
      const infomation = {
        total_count: 1,
        current_page: 1,
        total_pages: 1,
        limit_value: 2
      }
      const infomations = [
        {
          id: 2,
          title: 'タイトル2',
          summary: '概要2',
          body_present: false,
          started_at: '2021-01-02T09:00:00+09:00'
        }
      ]
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations } }))
      const wrapper = mountFunction({ id: 1 }, false, null) // 未ログイン
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonViewTest(wrapper, 1, infomation, infomations, 0, '', ['2021/01/02'])
    })
    it('[2頁中1頁]表示される', async () => {
      const infomation = {
        total_count: 3,
        current_page: 1,
        total_pages: 2,
        limit_value: 2
      }
      const infomations = [
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
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation, infomations } }))
      const wrapper = mountFunction({ id: 1 }, true, { infomation_unread_count: 1 }) // ログイン中、未読あり
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonViewTest(wrapper, 1, infomation, infomations, 1, '3件中 1-2件を表示', ['2021/01/01', '2021/01/02'])
    })

    it('[接続エラー]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction({ id: 1 }, false, null) // 未ログイン
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.network.failure, null, { path: '/' })
    })
    it('[レスポンスエラー]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction({ id: 1 }, false, null) // 未ログイン
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.network.error, null, { path: '/' })
    })
    it('[データなし]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction({ id: 1 }, true, { infomation_unread_count: 0 }) // ログイン中、未読なし
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.system.error, null, { path: '/' })
    })
    it('[ページ情報なし]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation: null } }))
      const wrapper = mountFunction({ id: 1 }, false, null) // 未ログイン
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.system.error, null, { path: '/' })
    })
  })

  // TODO: onPagination
})
