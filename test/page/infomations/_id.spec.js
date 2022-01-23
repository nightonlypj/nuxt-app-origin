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
        $config: {
          apiBaseURL: 'https://example.com',
          infomationDetailUrl: '/infomations/_id.json'
        },
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

  const commonLoadingTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(true)
  }
  const commonApiCalledTest = () => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).toBeCalledWith('https://example.com/infomations/1.json')
  }
  const commonViewTest = (wrapper, infomation, startedAt) => {
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
  const commonRedirectTest = (alert, notice, url, mock = routerPushMock) => {
    expect(toastedErrorMock).toBeCalledTimes(alert !== null ? 1 : 0)
    if (alert !== null) {
      expect(toastedErrorMock).toBeCalledWith(alert)
    }
    expect(toastedInfoMock).toBeCalledTimes(notice !== null ? 1 : 0)
    if (notice !== null) {
      expect(toastedInfoMock).toBeCalledWith(notice)
    }
    expect(mock).toBeCalledTimes(1)
    expect(mock).toBeCalledWith(url)
  }

  describe('お知らせ詳細API', () => {
    it('[本文あり]表示される', async () => {
      const infomation = Object.freeze({
        title: 'タイトル1',
        summary: '概要1',
        body: '本文1',
        started_at: '2021-01-01T09:00:00+09:00'
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomation } }))
      const wrapper = mountFunction()
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest()
      commonViewTest(wrapper, infomation, '2021/01/01')
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
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest()
      commonViewTest(wrapper, infomation, '2021/01/01')
    })
    it('[404]エラーページが表示される', async () => {
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 404, data } }))
      const wrapper = mountFunction()
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(data.alert, data.notice, { statusCode: 404 }, nuxtErrorMock)
    })

    it('[接続エラー]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction()
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.network.failure, null, { path: '/' })
    })
    it('[レスポンスエラー]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction()
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.network.error, null, { path: '/' })
    })
    it('[データなし]トップページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction()
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.system.error, null, { path: '/' })
    })
  })
})
