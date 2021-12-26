import Vuetify from 'vuetify'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Component from '~/components/index/Infomations.vue'

describe('Infomations.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const axiosGetMock = jest.fn(() => Promise.resolve({
    data: {
      infomations: []
    }
  }))

  const mountFunction = (options) => {
    return shallowMount(Component, {
      localVue,
      vuetify,
      mocks: {
        $config: {
          apiBaseURL: 'https://example.com',
          importantInfomationsUrl: '/infomations/important.json'
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
    expect(axiosGetMock).toHaveBeenCalledWith('https://example.com/infomations/important.json')
  })
})
