import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Message from '~/components/Message.vue'
import ImageEdit from '~/components/users/edit/ImageEdit.vue'
import InfoEdit from '~/components/users/edit/InfoEdit.vue'
import Page from '~/pages/users/edit.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('edit.vue', () => {
  const localVue = createLocalVue()
  let vuetify, authFetchUserMock, authRedirectMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    vuetify = new Vuetify()
    authFetchUserMock = jest.fn()
    authRedirectMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (loggedIn, user, axiosGetMock) => {
    return mount(Page, {
      localVue,
      vuetify,
      stubs: {
        ImageEdit: true,
        InfoEdit: true
      },
      mocks: {
        $config: {
          apiBaseURL: 'https://example.com',
          userShowUrl: '/users/auth/show.json'
        },
        $auth: {
          loggedIn,
          user,
          fetchUser: authFetchUserMock,
          redirect: authRedirectMock
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        },
        $router: {
          push: routerPushMock
        },
        $axios: {
          get: axiosGetMock
        }
      }
    })
  }

  const commonLoadingTest = (wrapper) => {
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(true)
  }
  const commonViewTest = (wrapper, axiosGetMock, axiosGetData, unconfirmed) => {
    expect(authFetchUserMock).toBeCalledTimes(1)
    expect(axiosGetMock).toBeCalledTimes(1)
    expect(axiosGetMock).toBeCalledWith('https://example.com/users/auth/show.json')

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBe(null)
    expect(wrapper.findComponent(Message).vm.$props.notice).toBe(null)
    expect(wrapper.findComponent(ImageEdit).exists()).toBe(true)
    expect(wrapper.findComponent(InfoEdit).exists()).toBe(true)
    expect(wrapper.findComponent(InfoEdit).vm.$props.user).toBe(axiosGetData.user)

    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/users/confirmation/new')).toBe(unconfirmed) // [メールアドレス変更中]メールアドレス確認
    expect(links.includes('/users/delete')).toBe(true) // アカウント削除
  }
  const commonRedirectTest = (alert, notice, mock, url) => {
    expect(authFetchUserMock).toBeCalledTimes(1)
    expect(toastedErrorMock).toBeCalledTimes(alert !== null ? 1 : 0)
    if (alert !== null) {
      expect(toastedErrorMock).toBeCalledWith(alert)
    }
    expect(toastedInfoMock).toBeCalledTimes(notice !== null ? 1 : 0)
    if (notice !== null) {
      expect(toastedInfoMock).toBeCalledWith(notice)
    }
    expect(mock).toBeCalledTimes(1)
    expect(mock).toBeCalledWith(url)
  }

  describe('データあり', () => {
    it('[未ログイン]ログインにリダイレクトされる', async () => {
      commonLoadingTest(mountFunction(false, {}, null))

      await helper.sleep(1)
      commonRedirectTest(null, locales.auth.unauthenticated, authRedirectMock, 'login')
    })
    it('[ログイン中]表示される', async () => {
      const axiosGetData = { user: { email: 'user1@example.com', unconfirmed_email: null } }
      const axiosGetMock = jest.fn(() => Promise.resolve({ data: axiosGetData }))
      const wrapper = mountFunction(true, { destroy_schedule_at: null }, axiosGetMock)
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonViewTest(wrapper, axiosGetMock, axiosGetData, false)
    })
    it('[ログイン中（メールアドレス変更中）]表示される', async () => {
      const axiosGetData = { user: { email: 'user1@example.com', unconfirmed_email: 'new@example.com' } }
      const axiosGetMock = jest.fn(() => Promise.resolve({ data: axiosGetData }))
      const wrapper = mountFunction(true, { destroy_schedule_at: null }, axiosGetMock)
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonViewTest(wrapper, axiosGetMock, axiosGetData, true)
    })
    it('[ログイン中（削除予約済み）]トップページにリダイレクトされる', async () => {
      const wrapper = mountFunction(true, { destroy_schedule_at: '2021-01-08T09:00:00+09:00' }, null)
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.auth.destroy_reserved, null, routerPushMock, { path: '/' })
    })
  })

  describe('データなし', () => {
    it('[ログイン中]トップページにリダイレクトされる', async () => {
      const axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(true, { destroy_schedule_at: null }, axiosGetMock)
      commonLoadingTest(wrapper)

      await helper.sleep(1)
      commonRedirectTest(locales.system.error, null, routerPushMock, { path: '/' })
    })
  })

  // TODO: fetchUser/getエラー
})
