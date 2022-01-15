import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Label from '~/components/infomations/Label.vue'
import Page from '~/pages/infomations/_id.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('_id.vue', () => {
  const localVue = createLocalVue()
  let vuetify, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    vuetify = new Vuetify()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (params, axiosGetMock) => {
    return mount(Page, {
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
          params
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
        }
      }
    })
  }

  const commonLoadingTest = (axiosGetMock) => {
    const wrapper = mountFunction({ id: 1 }, axiosGetMock)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(true)
    return wrapper
  }
  const commonViewTest = (wrapper, axiosGetMock, axiosGetData, startedAt) => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).toBeCalledWith('https://example.com/infomations/1.json')

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.vm.$data.list).toBe(axiosGetData.infomation)

    expect(wrapper.findComponent(Label).exists()).toBe(true) // ラベル
    expect(wrapper.findComponent(Label).vm.$props.list).toBe(axiosGetData.infomation)

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(axiosGetData.infomation.title) // タイトル
    expect(wrapper.text()).toMatch(startedAt) // 開始日時
    if (axiosGetData.infomation.body !== null) {
      expect(wrapper.text()).toMatch(axiosGetData.infomation.body) // 本文
      expect(wrapper.text()).not.toMatch(axiosGetData.infomation.summary) // 概要
    } else {
      expect(wrapper.text()).toMatch(axiosGetData.infomation.summary)
    }

    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/infomations')).toBe(true) // お知らせ一覧
  }

  it('[本文あり]表示される', async () => {
    const axiosGetData = {
      infomation: {
        title: 'タイトル1',
        summary: '概要1',
        body: '本文1',
        started_at: '2021-01-01T09:00:00+09:00'
      }
    }
    const axiosGetMock = jest.fn(() => Promise.resolve({ data: axiosGetData }))
    const wrapper = commonLoadingTest(axiosGetMock)

    await helper.sleep(1)
    commonViewTest(wrapper, axiosGetMock, axiosGetData, '2021/01/01')
  })
  it('[本文なし]表示される', async () => {
    const axiosGetData = {
      infomation: {
        title: 'タイトル1',
        summary: '概要1',
        body: null,
        started_at: '2021-01-01T09:00:00+09:00'
      }
    }
    const axiosGetMock = jest.fn(() => Promise.resolve({ data: axiosGetData }))
    const wrapper = commonLoadingTest(axiosGetMock)

    await helper.sleep(1)
    commonViewTest(wrapper, axiosGetMock, axiosGetData, '2021/01/01')
  })
  it('[データなし]トップページにリダイレクトされる', async () => {
    const axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
    commonLoadingTest(axiosGetMock)

    await helper.sleep(1)
    expect(toastedErrorMock).toBeCalledTimes(1)
    expect(toastedErrorMock).toBeCalledWith(locales.system.error)
    expect(toastedInfoMock).toBeCalledTimes(0)
    expect(routerPushMock).toBeCalledTimes(1)
    expect(routerPushMock).toBeCalledWith({ path: '/' })
  })

  // TODO: getエラー
})
