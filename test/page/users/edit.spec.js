import Vuetify from 'vuetify'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Page from '~/pages/users/edit.vue'

describe('edit.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const authFetchUserMock = jest.fn()
  const axiosGetMock = jest.fn(() => Promise.resolve({
    data: {
      user: {
        unconfirmed_email: null
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
          userShowUrl: '/users/auth/show.json'
        },
        $auth: {
          loggedIn: true,
          user: {
            destroy_schedule_at: null
          },
          fetchUser: authFetchUserMock
        },
        $axios: {
          get: axiosGetMock
        }
      },
      ...options
    })
  }

  it('成功', async () => {
    const wrapper = mountFunction()
    // console.log(wrapper.html())
    await expect(wrapper.vm).toBeTruthy()
    expect(authFetchUserMock).toHaveBeenCalled()
    expect(axiosGetMock).toHaveBeenCalled()
    expect(axiosGetMock).toHaveBeenCalledWith('https://example.com/users/auth/show.json')
  })
})
