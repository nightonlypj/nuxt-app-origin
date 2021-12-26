import Vuetify from 'vuetify'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Page from '~/pages/users/confirmation/new.vue'

describe('new.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const routerPushMock = jest.fn()

  const mountFunction = (options) => {
    return shallowMount(Page, {
      localVue,
      vuetify,
      mocks: {
        $route: {
          path: '/users/confirmation/new',
          query: {
            alert: null,
            notice: null
          }
        },
        $router: {
          push: routerPushMock
        },
        $auth: {
          loggedIn: false
        }
      },
      ...options
    })
  }

  it('成功', () => {
    const wrapper = mountFunction()
    // console.log(wrapper.html())
    expect(wrapper.vm).toBeTruthy()
    expect(routerPushMock).toHaveBeenCalled()
    expect(routerPushMock).toHaveBeenCalledWith({ path: '/users/confirmation/new' })
  })
})
