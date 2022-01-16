import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/sign_in.vue'

describe('sign_in.vue', () => {
  let toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (loggedIn, query) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
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
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const commonViewTest = (wrapper, alert, notice) => {
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
  const commonRedirectTest = (alert, notice, url) => {
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
    const wrapper = mountFunction(false, {})
    commonViewTest(wrapper, null, null)
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true, {})
    commonRedirectTest(null, locales.auth.already_authenticated, { path: '/' })
  })

  describe('メールアドレス確認成功', () => {
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, { account_confirmation_success: 'true', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      commonViewTest(wrapper, 'alertメッセージ', 'noticeメッセージ' + locales.auth.unauthenticated)
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, { account_confirmation_success: 'true', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      commonRedirectTest('alertメッセージ', 'noticeメッセージ', { path: '/' })
    })
  })

  describe('メールアドレス確認失敗', () => {
    it('[未ログイン]メールアドレス確認にリダイレクトされる', () => {
      mountFunction(false, { account_confirmation_success: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      commonRedirectTest(null, null, { path: '/users/confirmation/new', query: { alert: 'alertメッセージ', notice: 'noticeメッセージ' } })
    })
    it('[ログイン中]メールアドレス確認にリダイレクトされる', () => {
      mountFunction(true, { account_confirmation_success: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      commonRedirectTest(null, null, { path: '/users/confirmation/new', query: { alert: 'alertメッセージ', notice: 'noticeメッセージ' } })
    })
  })

  describe('アカウントロック解除成功', () => {
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, { unlock: 'true', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      commonViewTest(wrapper, 'alertメッセージ', 'noticeメッセージ' + locales.auth.unauthenticated)
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, { unlock: 'true', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      commonRedirectTest('alertメッセージ', 'noticeメッセージ', { path: '/' })
    })
  })

  describe('アカウントロック解除失敗', () => {
    it('[未ログイン]表示される', () => {
      const wrapper = mountFunction(false, { unlock: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      commonViewTest(wrapper, 'alertメッセージ', 'noticeメッセージ')
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, { unlock: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      commonRedirectTest('alertメッセージ', 'noticeメッセージ', { path: '/' })
    })
  })

  // TODO: onSignIn
})
