import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/sign_up.vue'

describe('sign_up.vue', () => {
  const localVue = createLocalVue()
  let vuetify, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    vuetify = new Vuetify()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (loggedIn) => {
    return mount(Page, {
      localVue,
      vuetify,
      mocks: {
        $auth: {
          loggedIn
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        },
        $router: {
          push: routerPushMock
        }
      }
    })
  }

  it('[未ログイン]表示される', () => {
    const wrapper = mountFunction(false)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBe(null)
    expect(wrapper.findComponent(Message).vm.$props.notice).toBe(null)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('sign_up')
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    const wrapper = mountFunction(true)
    expect(wrapper.vm).toBeTruthy()

    expect(toastedErrorMock).toBeCalledTimes(0)
    expect(toastedInfoMock).toBeCalledTimes(1)
    expect(toastedInfoMock).toBeCalledWith(locales.auth.already_authenticated)
    expect(routerPushMock).toBeCalledTimes(1)
    expect(routerPushMock).toBeCalledWith({ path: '/' })
  })

  // TODO: onSignUp
})
