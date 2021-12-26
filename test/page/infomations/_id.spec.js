import Vuetify from 'vuetify'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Page from '~/pages/infomations/_id.vue'

describe('_id.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const axiosGetMock = jest.fn(() => Promise.resolve({
    data: {
      infomation: {
        label: 'Maintenance',
        label_i18n: 'メンテナンス',
        title: '全員へのお知らせ（掲載中）',
        summary: '全員へのお知らせの要約<br>2行目',
        body: '全員へのお知らせの本文<br>2行目',
        started_at: '2021-01-01T09:00:00+09:00',
        ended_at: null,
        target: 'All'
      }
    }
  }))

  const mountFunction = (options) => {
    return shallowMount(Page, {
      localVue,
      vuetify,
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
        $dateFormat: jest.fn()
      },
      ...options
    })
  }

  it('成功', () => {
    const wrapper = mountFunction()
    // console.log(wrapper.html())
    expect(wrapper.vm).toBeTruthy()
    expect(axiosGetMock).toHaveBeenCalled()
    expect(axiosGetMock).toHaveBeenCalledWith('https://example.com/infomations/1.json')
  })
})
