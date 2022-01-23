import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Label from '~/components/infomations/Label.vue'
import Component from '~/components/index/Infomations.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Infomations.vue', () => {
  const localVue = createLocalVue()
  let axiosGetMock, toastedErrorMock, toastedInfoMock

  beforeEach(() => {
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
  })

  const mountFunction = () => {
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        Label: true
      },
      mocks: {
        $config: {
          apiBaseURL: 'https://example.com',
          importantInfomationsUrl: '/infomations/important.json'
        },
        $axios: {
          get: axiosGetMock
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
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
    expect(axiosGetMock).toBeCalledWith('https://example.com/infomations/important.json')
  }
  const commonNotTest = (wrapper, alert, notice) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)

    expect(wrapper.html()).toBe('')
    expect(toastedErrorMock).toBeCalledTimes(alert !== null ? 1 : 0)
    if (alert !== null) {
      expect(toastedErrorMock).toBeCalledWith(alert)
    }
    expect(toastedInfoMock).toBeCalledTimes(notice !== null ? 1 : 0)
    if (notice !== null) {
      expect(toastedInfoMock).toBeCalledWith(notice)
    }
  }
  const commonViewTest = (wrapper, infomations, startViews) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.vm.$data.lists).toEqual(infomations)

    const labels = wrapper.findAllComponents(Label)
    const links = helper.getLinks(wrapper)

    // console.log(links)
    // console.log(wrapper.text())
    for (const [index, list] of infomations.entries()) {
      expect(labels.at(index).exists()).toBe(true) // ラベル
      expect(labels.at(index).vm.$props.list).toEqual(list)
      expect(links.includes('/infomations/' + list.id)).toBe(list.body_present || list.summary !== null) // [本文or概要あり]お知らせ詳細
      expect(wrapper.text()).toMatch(list.title) // タイトル
      expect(wrapper.text()).toMatch(startViews[index]) // 開始日時
    }
  }

  describe('大切なお知らせAPI', () => {
    it('[0件]表示されない', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomations: [] } }))
      const wrapper = mountFunction()
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest()
      commonNotTest(wrapper, null, null)
    })
    it('[4件]表示される', async () => { // 本文あり・なし × 概要あり・なし
      const infomations = Object.freeze([
        { id: 1, title: 'タイトル1', summary: '概要1', body_present: true, started_at: '2021-01-01T09:00:00+09:00' },
        { id: 2, title: 'タイトル2', summary: '概要2', body_present: false, started_at: '2021-01-02T09:00:00+09:00' },
        { id: 3, title: 'タイトル3', summary: null, body_present: true, started_at: '2021-01-03T09:00:00+09:00' },
        { id: 4, title: 'タイトル4', summary: null, body_present: false, started_at: '2021-01-04T09:00:00+09:00' }
      ])
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { infomations } }))
      const wrapper = mountFunction()
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest()
      commonViewTest(wrapper, infomations, ['2021/01/01', '2021/01/02', '2021/01/03', '2021/01/04'])
    })

    it('[接続エラー]表示されない', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction()
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest()
      commonNotTest(wrapper, locales.network.failure, null)
    })
    it('[レスポンスエラー]表示されない', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction()
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest()
      commonNotTest(wrapper, locales.network.error, null)
    })
    it('[データなし]表示されない', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction()
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonApiCalledTest()
      commonNotTest(wrapper, locales.system.error, null)
    })
  })
})
