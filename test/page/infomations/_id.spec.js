import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Label from '~/components/infomations/Label.vue'
import Page from '~/pages/infomations/_id.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('_id.vue', () => {
  let axiosGetMock, toastedErrorMock, toastedInfoMock, routerPushMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
    nuxtErrorMock = jest.fn()
  })

  const mountFunction = () => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        Label: true
      },
      mocks: {
        $route: {
          params: {
            id: 1
          }
        },
        $axios: {
          get: axiosGetMock
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
  const apiCalledTest = () => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.infomationDetailUrl.replace('_id', 1))
  }

  const viewTest = (wrapper, infomation, startedAt) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.vm.$data.list).toEqual(infomation)

    expect(wrapper.findComponent(Label).exists()).toBe(true) // ラベル
    expect(wrapper.findComponent(Label).vm.$props.list).toEqual(infomation)

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(infomation.title) // タイトル
    expect(wrapper.text()).toMatch(startedAt) // 開始日時
    if (infomation.body !== null) {
      expect(wrapper.text()).toMatch(infomation.body) // 本文
      expect(wrapper.text()).not.toMatch(infomation.summary) // 概要
    } else {
      expect(wrapper.text()).toMatch(infomation.summary)
    }

    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/infomations')).toBe(true) // お知らせ一覧
  }

  // テストケース
  describe('お知らせ詳細', () => {
    it('[本文あり]表示される', async () => {
      const infomation = Object.freeze({
        title: 'タイトル1',
        summary: '概要1',
        body: '本文1',
        started_at: '2021-01-01T09:00:00+09:00'
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation } }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      viewTest(wrapper, infomation, '2021/01/01')
    })
    it('[本文なし]表示される', async () => {
      const infomation = Object.freeze({
        title: 'タイトル1',
        summary: '概要1',
        body: null,
        started_at: '2021-01-01T09:00:00+09:00'
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation } }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      viewTest(wrapper, infomation, '2021/01/01')
    })
    it('[データなし]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })

    it('[接続エラー]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })
    it('[存在しない]エラーページが表示される', async () => {
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 404, data } }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 404 })
    })
    it('[レスポンスエラー]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })
    it('[その他エラー]トップページにリダイレクトされる', async () => {
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 422, data } }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.mockCalledTest(routerPushMock, 1, { path: '/' })
    })
  })
})
