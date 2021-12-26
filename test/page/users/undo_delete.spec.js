import Vuetify from 'vuetify'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Page from '~/pages/users/undo_delete.vue'

describe('undo_delete.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const now = new Date()
  const authFetchUserMock = jest.fn()

  const mountFunction = (options) => {
    return shallowMount(Page, {
      localVue,
      vuetify,
      mocks: {
        $auth: {
          loggedIn: true,
          user: {
            destroy_requested_at: now,
            destroy_schedule_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
          },
          fetchUser: authFetchUserMock
        },
        $dateFormat: jest.fn(),
        $timeFormat: jest.fn()
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
