import Vuetify from 'vuetify'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Page from '~/pages/users/delete.vue'

describe('delete.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const authFetchUserMock = jest.fn()

  const mountFunction = (options) => {
    return shallowMount(Page, {
      localVue,
      vuetify,
      mocks: {
        $auth: {
          loggedIn: true,
          user: {
            destroy_schedule_at: null,
            destroy_schedule_days: 7
          },
          fetchUser: authFetchUserMock
        }
      },
      ...options
    })
  }

  it('成功', () => {
    const wrapper = mountFunction()
    // console.log(wrapper.html())
    expect(wrapper.vm).toBeTruthy()
    expect(authFetchUserMock).toHaveBeenCalled()
  })
})
