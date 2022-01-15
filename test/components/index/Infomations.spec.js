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
  let vuetify, toastedErrorMock, toastedInfoMock

  beforeEach(() => {
    vuetify = new Vuetify()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
  })

  const mountFunction = (axiosGetMock) => {
    return mount(Component, {
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
  }

  const commonLoadingTest = (axiosGetMock) => {
    const wrapper = mountFunction(axiosGetMock)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(true)
    return wrapper
  }
  const commonViewTest = (wrapper, axiosGetMock, axiosGetData, startViews) => {
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).toBeCalledWith('https://example.com/infomations/important.json')

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.vm.$data.lists).toBe(axiosGetData == null ? null : axiosGetData.infomations)

    if (axiosGetData == null || axiosGetData.infomations.length === 0) {
      expect(wrapper.html()).toBe('')
    } else {
      const labels = wrapper.findAllComponents(Label)
      const links = helper.getLinks(wrapper)

      // console.log(links)
      // console.log(wrapper.text())
      for (const [index, list] of axiosGetData.infomations.entries()) {
        expect(labels.at(index).exists()).toBe(true) // ラベル
        expect(labels.at(index).vm.$props.list).toBe(list)
        expect(links.includes('/infomations/' + list.id)).toBe(list.body_present || list.summary !== null) // [本文or概要あり]お知らせ詳細
        expect(wrapper.text()).toMatch(list.title) // タイトル
        expect(wrapper.text()).toMatch(startViews[index]) // 開始日時
      }
    }
  }

  it('[0件]表示されない', async () => {
    const axiosGetData = {
      infomations: []
    }
    const axiosGetMock = jest.fn(() => Promise.resolve({ data: axiosGetData }))
    const wrapper = commonLoadingTest(axiosGetMock)

    await helper.sleep(1)
    commonViewTest(wrapper, axiosGetMock, axiosGetData, null)
  })
  it('[4件]表示される', async () => { // 本文あり・なし × 概要あり・なし
    const axiosGetData = {
      infomations: [
        { id: 1, title: 'タイトル1', summary: '概要1', body_present: true, started_at: '2021-01-01T09:00:00+09:00' },
        { id: 2, title: 'タイトル2', summary: '概要2', body_present: false, started_at: '2021-01-02T09:00:00+09:00' },
        { id: 3, title: 'タイトル3', summary: null, body_present: true, started_at: '2021-01-03T09:00:00+09:00' },
        { id: 4, title: 'タイトル4', summary: null, body_present: false, started_at: '2021-01-04T09:00:00+09:00' }
      ]
    }
    const axiosGetMock = jest.fn(() => Promise.resolve({ data: axiosGetData }))
    const wrapper = commonLoadingTest(axiosGetMock)

    await helper.sleep(1)
    commonViewTest(wrapper, axiosGetMock, axiosGetData, ['2021/01/01', '2021/01/02', '2021/01/03', '2021/01/04'])
  })
  it('[データなし]表示されない', async () => {
    const axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
    const wrapper = commonLoadingTest(axiosGetMock)

    await helper.sleep(1)
    commonViewTest(wrapper, axiosGetMock, null, null)

    expect(toastedErrorMock).toBeCalledTimes(1)
    expect(toastedErrorMock).toBeCalledWith(locales.system.error)
    expect(toastedInfoMock).toBeCalledTimes(0)
  })

  // TODO: getエラー
})
