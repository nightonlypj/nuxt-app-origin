import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/password/index.vue'

describe('index.vue', () => {
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
    const query = { reset_password_token: 'token' }
    const wrapper = mountFunction(false, query)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBe(null)
    expect(wrapper.findComponent(Message).vm.$props.notice).toBe(null)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('password')
  })
  it('[ログイン中]トップページにリダイレクトされる', () => {
    commonRedirectTest(true, {}, null, locales.auth.already_authenticated, { path: '/' })
  })

  describe('トークンエラー', () => {
    const query = { reset_password: 'false', alert: 'alertメッセージ', notice: 'noticeメッセージ' }
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      commonRedirectTest(false, query, null, null, { path: '/users/password/new', query: { alert: query.alert, notice: query.notice } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      commonRedirectTest(true, query, null, locales.auth.already_authenticated, { path: '/' })
    })
  })

  describe('トークンnull', () => {
    const query = { reset_password_token: null }
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      commonRedirectTest(false, query, null, null, { path: '/users/password/new', query: { alert: locales.auth.reset_password_token_blank } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      commonRedirectTest(true, query, null, locales.auth.already_authenticated, { path: '/' })
    })
  })
  describe('トークンなし', () => {
    const query = { reset_password_token: '' }
    it('[未ログイン]パスワード再設定にリダイレクトされる', () => {
      commonRedirectTest(false, query, null, null, { path: '/users/password/new', query: { alert: locales.auth.reset_password_token_blank } })
    })
    it('[ログイン中]トップページにリダイレクトされる', () => {
      commonRedirectTest(true, query, null, locales.auth.already_authenticated, { path: '/' })
    })
  })

  // TODO: onPasswordUpdate
})
