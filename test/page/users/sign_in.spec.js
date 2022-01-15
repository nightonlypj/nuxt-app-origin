import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/sign_in.vue'

describe('sign_in.vue', () => {
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
          path: '/users/sign_in',
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

  const commonViewTest = (query, alert, notice) => {
    const wrapper = mountFunction(false, query)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBe(alert)
    expect(wrapper.findComponent(Message).vm.$props.notice).toBe(notice)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('sign_in')
    expect(routerPushMock).toBeCalledTimes(1)
    expect(routerPushMock).toBeCalledWith({ path: '/users/sign_in' })
  }
  const commonRedirectTest = (loggedIn, query, alert, notice, url) => {
    const wrapper = mountFunction(loggedIn, query)
    expect(wrapper.vm).toBeTruthy()

    expect(toastedErrorMock).toBeCalledTimes(alert !== null ? 1 : 0)
    if (alert !== null) {
      expect(toastedErrorMock).toBeCalledWith(alert)
    }
    expect(toastedInfoMock).toBeCalledTimes(notice !== null ? 1 : 0)
    if (notice !== null) {
      expect(toastedInfoMock).toBeCalledWith(notice)
    }
    expect(routerPushMock).toBeCalledTimes(1)
    expect(routerPushMock).toBeCalledWith(url)
  }

  it('[未ログイン]表示される', () => {
    commonViewTest({}, null, null)
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    commonRedirectTest(true, {}, null, locales.auth.already_authenticated, { path: '/' })
  })

  describe('メールアドレス確認成功', () => {
    const query = { account_confirmation_success: 'true', alert: 'alertメッセージ', notice: 'noticeメッセージ' }
    it('[未ログイン]表示される', () => {
      commonViewTest(query, query.alert, query.notice + locales.auth.unauthenticated)
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      commonRedirectTest(true, query, query.alert, query.notice, { path: '/' })
    })
  })

  describe('メールアドレス確認失敗', () => {
    const query = { account_confirmation_success: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' }
    const url = { path: '/users/confirmation/new', query: { alert: query.alert, notice: query.notice } }
    it('[未ログイン]メールアドレス確認にリダイレクトされる', () => {
      commonRedirectTest(false, query, null, null, url)
    })
    it('[ログイン中]メールアドレス確認にリダイレクトされる', () => {
      commonRedirectTest(true, query, null, null, url)
    })
  })

  describe('アカウントロック解除成功', () => {
    const query = { unlock: 'true', alert: 'alertメッセージ', notice: 'noticeメッセージ' }
    it('[未ログイン]表示される', () => {
      commonViewTest(query, query.alert, query.notice + locales.auth.unauthenticated)
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      commonRedirectTest(true, query, query.alert, query.notice, { path: '/' })
    })
  })

  describe('アカウントロック解除失敗', () => {
    const query = { unlock: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' }
    it('[未ログイン]表示される', () => {
      commonViewTest(query, query.alert, query.notice)
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      commonRedirectTest(true, query, query.alert, query.notice, { path: '/' })
    })
  })

  // TODO: onSignIn
})
