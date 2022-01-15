import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Page from '~/pages/users/delete.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('delete.vue', () => {
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

  const mountFunction = (loggedIn, user) => {
    return mount(Page, {
      localVue,
      vuetify,
      mocks: {
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
        }
      }
    })
  }

  const commonLoadingTest = (wrapper) => {
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(true)
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

  it('[未ログイン]ログインにリダイレクトされる', async () => {
    commonLoadingTest(mountFunction(false, {}))

    await helper.sleep(1)
    commonRedirectTest(null, locales.auth.unauthenticated, authRedirectMock, 'login')
  })
  it('[ログイン中]表示される', async () => {
    const user = { destroy_schedule_at: null, destroy_schedule_days: 789 }
    const wrapper = mountFunction(true, user)
    commonLoadingTest(wrapper)

    await helper.sleep(1)
    expect(authFetchUserMock).toBeCalledTimes(1)

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(String(user.destroy_schedule_days)) // アカウント削除の猶予期間
  })
  it('[ログイン中（削除予約済み）]トップページにリダイレクトされる', async () => {
    const user = { destroy_schedule_at: '2021-01-08T09:00:00+09:00' }
    commonLoadingTest(mountFunction(true, user))

    await helper.sleep(1)
    commonRedirectTest(locales.auth.destroy_reserved, null, routerPushMock, { path: '/' })
  })

  // TODO: onUserDelete, fetchUserエラー
})
