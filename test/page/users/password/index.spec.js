import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/password/index.vue'

describe('index.vue', () => {
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

  const commonViewTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBe(null)
    expect(wrapper.findComponent(Message).vm.$props.notice).toBe(null)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('password')
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
    const wrapper = mountFunction(false, { reset_password_token: 'token' })
    commonViewTest(wrapper)
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    mountFunction(true, {})
    commonRedirectTest(null, locales.auth.already_authenticated, { path: '/' })
  })

  describe('トークンエラー', () => {
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, { reset_password: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      commonRedirectTest(null, null, { path: '/users/password/new', query: { alert: 'alertメッセージ', notice: 'noticeメッセージ' } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, { reset_password: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      commonRedirectTest(null, locales.auth.already_authenticated, { path: '/' })
    })
  })

  describe('トークンnull', () => {
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, { reset_password_token: null })
      commonRedirectTest(null, null, { path: '/users/password/new', query: { alert: locales.auth.reset_password_token_blank } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, { reset_password_token: null })
      commonRedirectTest(null, locales.auth.already_authenticated, { path: '/' })
    })
  })
  describe('トークンなし', () => {
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      mountFunction(false, { reset_password_token: '' })
      commonRedirectTest(null, null, { path: '/users/password/new', query: { alert: locales.auth.reset_password_token_blank } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      mountFunction(true, { reset_password_token: '' })
      commonRedirectTest(null, locales.auth.already_authenticated, { path: '/' })
    })
  })

  // TODO: onPasswordUpdate
})
