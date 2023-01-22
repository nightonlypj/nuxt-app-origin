import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import InfomationsLabel from '~/components/infomations/Label.vue'
import Page from '~/pages/infomations/_id.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('_id.vue', () => {
  let axiosGetMock, toastedErrorMock, toastedInfoMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    nuxtErrorMock = jest.fn()
  })

  const params = { id: '1' }
  const mountFunction = () => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        Loading: true,
        InfomationsLabel: true
      },
      mocks: {
        $axios: {
          get: axiosGetMock
        },
        $route: {
          params
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
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
  const viewTest = (wrapper, data) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.vm.$data.infomation).toEqual(data.infomation)

    expect(wrapper.findComponent(InfomationsLabel).exists()).toBe(true) // ラベル
    expect(wrapper.findComponent(InfomationsLabel).vm.$props.infomation).toEqual(data.infomation)

    expect(wrapper.text()).toMatch(data.infomation.title) // タイトル
    expect(wrapper.text()).toMatch(wrapper.vm.$dateFormat('ja', data.infomation.started_at)) // 開始日
    if (data.infomation.body != null) {
      expect(wrapper.text()).toMatch(data.infomation.body) // 本文
      expect(wrapper.text()).not.toMatch(data.infomation.summary) // 概要
    } else {
      expect(wrapper.text()).toMatch(data.infomation.summary)
    }

    const links = helper.getLinks(wrapper)
    expect(links.includes('/infomations')).toBe(true) // お知らせ一覧
  }

  // テストケース
  describe('お知らせ詳細取得', () => {
    const apiCalledTest = () => {
      expect(axiosGetMock).toBeCalledTimes(1)
      expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.infomations.detailUrl.replace(':id', params.id))
    }

    let wrapper
    const beforeAction = async () => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[本文あり]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          title: 'タイトル1',
          summary: '概要1',
          body: '本文1',
          started_at: '2000-01-01T12:34:56+09:00'
        }
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      viewTest(wrapper, data)
    })
    it('[本文なし]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          title: 'タイトル1',
          summary: '概要1',
          body: null,
          started_at: '2000-01-01T12:34:56+09:00'
        }
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      viewTest(wrapper, data)
    })
    it('[データなし]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.network.failure })
    })
    it('[存在しない]エラーページが表示される', async () => {
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 404, data } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 404, alert: data.alert, notice: data.notice })
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: helper.locales.network.error })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: helper.locales.system.default })
    })
  })
})
