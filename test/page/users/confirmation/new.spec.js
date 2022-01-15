import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
// import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/confirmation/new.vue'

describe('new.vue', () => {
  const localVue = createLocalVue()
  let vuetify, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    vuetify = new Vuetify()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (loggedIn, query) => {
    return mount(Page, {
      localVue,
      vuetify,
      mocks: {
        $auth: {
          loggedIn
        },
        $route: {
          path: '/users/confirmation/new',
          query
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

  const commonViewTest = (loggedIn) => {
    const query = { alert: 'alertメッセージ', notice: 'noticeメッセージ' }
    const wrapper = mountFunction(loggedIn, query)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBe(query.alert)
    expect(wrapper.findComponent(Message).vm.$props.notice).toBe(query.notice)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(!loggedIn)
    if (!loggedIn) {
      expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('confirmation')
    }
    expect(routerPushMock).toBeCalledTimes(1)
    expect(routerPushMock).toBeCalledWith({ path: '/users/confirmation/new' })
  }

  it('[未ログイン]表示される', () => {
    commonViewTest(false)
  })
  it('[ログイン中]表示される', () => {
    commonViewTest(true)
  })

  // TODO: onConfirmationNew
})
