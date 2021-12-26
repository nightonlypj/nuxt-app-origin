import Vuetify from 'vuetify'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Page from '~/pages/infomations/index.vue'

describe('index.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const axiosGetMock = jest.fn(() => Promise.resolve({
    data: {
      infomation: {
        total_count: 0,
        current_page: 1,
        total_pages: 0,
        limit_value: 25
      },
      infomations: []
    }
  }))

  const mountFunction = (options) => {
    return shallowMount(Page, {
      localVue,
      vuetify,
      mocks: {
        $config: {
          apiBaseURL: 'https://example.com',
          infomationsUrl: '/infomations.json',
          params: {
            page: 1
          }
        },
        $auth: {
          loggedIn: false
        },
        $axios: {
          get: axiosGetMock
        }
      },
      ...options
    })
  }

  it('成功', () => {
    const wrapper = mountFunction()
    // console.log(wrapper.html())
    expect(wrapper.vm).toBeTruthy()
    expect(axiosGetMock).toHaveBeenCalled()
    expect(axiosGetMock).toHaveBeenCalledWith('https://example.com/infomations.json', { params: { page: 1 } })
  })
})
