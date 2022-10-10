import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import InfomationsLabel from '~/components/infomations/Label.vue'
import Component from '~/components/index/Infomations.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Infomations.vue', () => {
  const localVue = createLocalVue()
  let axiosGetMock

  beforeEach(() => {
    axiosGetMock = null
  })

  const mountFunction = () => {
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        Loading: true,
        InfomationsLabel: true
      },
      mocks: {
        $axios: {
          get: axiosGetMock
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const apiCalledTest = () => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.importantInfomationsUrl)
  }

  const viewTest = (wrapper, data) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.vm.$data.infomations).toEqual(data.infomations)

    const labels = wrapper.findAllComponents(InfomationsLabel)
    const links = helper.getLinks(wrapper)
    for (const [index, infomation] of data.infomations.entries()) {
      expect(labels.at(index).exists()).toBe(true) // ラベル
      expect(labels.at(index).vm.$props.infomation).toEqual(infomation)
      expect(links.includes('/infomations/' + infomation.id)).toBe(infomation.body_present || infomation.summary != null) // [本文or概要あり]お知らせ詳細
      expect(wrapper.text()).toMatch(infomation.title) // タイトル
      expect(wrapper.text()).toMatch(wrapper.vm.$dateFormat(infomation.started_at, 'ja')) // 開始日
    }
  }

  const viewErrorTest = (wrapper, errorMessage, localesMessage) => {
    expect(wrapper.vm.$data.errorMessage).toBe(errorMessage)
    expect(wrapper.text()).toMatch(localesMessage)
  }

  // テストケース
  describe('大切なお知らせ', () => {
    it('[0件]表示されない', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomations: [] } }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      helper.blankTest(wrapper, Loading)
    })
    it('[4件]表示される', async () => { // 本文あり・なし × 概要あり・なし
      const data = Object.freeze({
        infomations: [
          { id: 1, title: 'タイトル1', summary: '概要1', body_present: true, started_at: '2000-01-01T12:34:56+09:00' },
          { id: 2, title: 'タイトル2', summary: '概要2', body_present: false, started_at: '2000-01-02T12:34:56+09:00' },
          { id: 3, title: 'タイトル3', summary: null, body_present: true, started_at: '2000-01-03T12:34:56+09:00' },
          { id: 4, title: 'タイトル4', summary: null, body_present: false, started_at: '2000-01-04T12:34:56+09:00' }
        ]
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      viewTest(wrapper, data)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      viewErrorTest(wrapper, 'system.error', helper.locales.system.error_short)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      viewErrorTest(wrapper, 'network.failure', helper.locales.network.failure_short)
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      viewErrorTest(wrapper, 'network.error', helper.locales.network.error_short)
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest()
      viewErrorTest(wrapper, 'system.default', helper.locales.system.default_short)
    })
  })
})
