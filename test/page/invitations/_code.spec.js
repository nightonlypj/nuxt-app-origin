import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ListSetting from '~/components/ListSetting.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import InvitationsCreate from '~/components/invitations/Create.vue'
import InvitationsUpdate from '~/components/invitations/Update.vue'
import InvitationsLists from '~/components/invitations/Lists.vue'
import Page from '~/pages/invitations/_code.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('_code.vue', () => {
  let axiosGetMock, authLogoutMock, toastedErrorMock, toastedInfoMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    nuxtErrorMock = jest.fn()
  })

  const beforeLocation = window.location
  beforeAll(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: { reload: jest.fn() } })
  })
  afterAll(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: beforeLocation })
  })

  const model = 'invitation'
  const space = Object.freeze({ code: 'code0001' })
  const values = Object.freeze({ notice: 'noticeメッセージ' })
  const mountFunction = (loggedIn = true, query = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        InfiniteLoading: true,
        Loading: true,
        Processing: true,
        Message: true,
        ListSetting: true,
        SpacesDestroyInfo: true,
        SpacesTitle: true,
        InvitationsCreate: true,
        InvitationsUpdate: true,
        InvitationsLists: true
      },
      mocks: {
        $axios: {
          get: axiosGetMock
        },
        $auth: {
          loggedIn,
          logout: authLogoutMock
        },
        $route: {
          params: {
            code: space.code
          },
          query: { ...query }
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        },
        $nuxt: {
          error: nuxtErrorMock
        }
      },
      data () {
        return { ...values }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const dataCount0 = Object.freeze({
    space,
    invitation: {
      total_count: 0,
      current_page: 1,
      total_pages: 0,
      limit_value: 2
    }
  })
  const dataCount1 = Object.freeze({
    space,
    invitation: {
      total_count: 1,
      current_page: 1,
      total_pages: 1,
      limit_value: 2
    },
    invitations: [
      { code: 'invitation000000000000001' }
    ]
  })

  const dataPage1 = Object.freeze({
    space,
    invitation: {
      total_count: 5,
      current_page: 1,
      total_pages: 3,
      limit_value: 2
    },
    invitations: [
      { code: 'invitation000000000000001' },
      { code: 'invitation000000000000002' }
    ]
  })
  const dataPage2 = Object.freeze({
    space,
    invitation: {
      total_count: 5,
      current_page: 2,
      total_pages: 3,
      limit_value: 2
    },
    invitations: [
      { code: 'invitation000000000000003' },
      { code: 'invitation000000000000004' }
    ]
  })
  const dataPage3 = Object.freeze({
    space,
    invitation: {
      total_count: 5,
      current_page: 3,
      total_pages: 3,
      limit_value: 2
    },
    invitations: [
      { code: 'invitation000000000000005' }
    ]
  })

  // テスト内容
  const apiCalledTest = (count, page = count) => {
    expect(axiosGetMock).toBeCalledTimes(count)
    const url = helper.commonConfig.invitations.listUrl.replace(':space_code', space.code)
    expect(axiosGetMock).nthCalledWith(count, helper.envConfig.apiBaseURL + url, { params: { page } })
  }

  const viewTest = (wrapper, data, countView, show = { existInfinite: false, testState: null }, error = false) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    helper.messageTest(wrapper, Message, values, { alert: false, notice: true })

    const spacesDestroyInfo = wrapper.findComponent(SpacesDestroyInfo)
    expect(spacesDestroyInfo.vm.space).toEqual(wrapper.vm.$data.space)

    expect(wrapper.vm.$data.error).toBe(error)
    expect(wrapper.vm.$data.testState).toBe(show.testState)
    expect(wrapper.vm.$data.page).toBe(data.invitation.current_page)
    expect(wrapper.vm.$data.space).toEqual(data.space)
    expect(wrapper.vm.$data.invitation).toEqual(data.invitation)
    expect(wrapper.vm.$data.invitations).toEqual(data.invitations)

    const spacesTitle = wrapper.findComponent(SpacesTitle)
    expect(spacesTitle.vm.space).toEqual(wrapper.vm.$data.space)

    // 設定
    const listSetting = wrapper.findComponent(ListSetting)
    expect(listSetting.vm.model).toBe(model)
    expect(listSetting.vm.hiddenItems).toBe(wrapper.vm.$data.hiddenItems)
    expect(listSetting.vm.admin).toBe(null)

    // 招待URL作成・変更
    const invitationsCreate = wrapper.findComponent(InvitationsCreate)
    const invitationsUpdate = wrapper.findComponent(InvitationsUpdate)
    expect(invitationsCreate.exists()).toBe(true)
    expect(invitationsCreate.vm.space).toEqual(wrapper.vm.$data.space)
    expect(invitationsUpdate.exists()).toBe(true)
    expect(invitationsUpdate.vm.space).toEqual(wrapper.vm.$data.space)

    // 一覧
    const invitationsLists = wrapper.findComponent(InvitationsLists)
    if (data.invitations == null || data.invitations.length === 0) {
      expect(wrapper.text()).toMatch('対象の招待URLが見つかりません。')
      expect(invitationsLists.exists()).toBe(false)
    } else {
      expect(invitationsLists.vm.invitations).toBe(wrapper.vm.$data.invitations)
      expect(invitationsLists.vm.hiddenItems).toBe(wrapper.vm.$data.hiddenItems)
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(show.existInfinite)
    return infiniteLoading
  }

  const infiniteErrorTest = async (alert, notice) => {
    const wrapper = mountFunction()
    helper.loadingTest(wrapper, Loading)

    await helper.sleep(1)
    apiCalledTest(1)
    const infiniteLoading = viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: null })

    // スクロール（2頁目）
    infiniteLoading.vm.$emit('infinite')

    await helper.sleep(1)
    apiCalledTest(2)
    if (alert != null) {
      helper.mockCalledTest(toastedErrorMock, 1, alert)
    } else {
      helper.mockCalledTest(toastedErrorMock, 0)
    }
    if (notice != null) {
      helper.mockCalledTest(toastedInfoMock, 1, notice)
    } else {
      helper.mockCalledTest(toastedInfoMock, 0)
    }
    viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: 'error' }, true)
  }

  // テストケース
  describe('未ログイン', () => {
    it('ログインページにリダイレクトされる', () => {
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)
      expect(wrapper.findComponent(Loading).exists()).toBe(true) // NOTE: Jestでmiddlewareが実行されない為
    })
  })

  describe('招待URL一覧取得', () => {
    it('[0件]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataCount0 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      viewTest(wrapper, dataCount0, '')
    })
    it('[1件]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataCount1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      viewTest(wrapper, dataCount1, '1件')
    })
    describe('無限スクロール', () => {
      let wrapper, infiniteLoading
      const beforeAction = async (uid1, uid2, uid3 = null) => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1, headers: { uid: uid1 } }))
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage2, headers: { uid: uid2 } }))
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage3, headers: { uid: uid3 } }))
        wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        infiniteLoading = viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: null })
      }
      const completeTestAction = async () => {
        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2)
        const invitations = dataPage1.invitations.concat(dataPage2.invitations)
        infiniteLoading = viewTest(wrapper, { ...dataPage2, invitations }, '5件', { existInfinite: true, testState: 'loaded' })

        // スクロール（3頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(3)
        viewTest(wrapper, { ...dataPage3, invitations: invitations.concat(dataPage3.invitations) }, '5件', { existInfinite: false, testState: 'complete' })
      }
      const reloadTestAction = async () => {
        const count = window.location.reload.mock.calls.length

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        helper.mockCalledTest(window.location.reload, count + 1)

        apiCalledTest(2)
        viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: 'error' }, true)
      }

      it('[ログイン中]スクロールで最終頁まで表示される', async () => {
        await beforeAction('1', '1', '1')
        await completeTestAction()
      })
      it('[ログイン中→未ログイン]リロードされる', async () => {
        await beforeAction('1', null)
        await reloadTestAction()
      })
      it('[ログイン中→別ユーザー]リロードされる', async () => {
        await beforeAction('1', '2')
        await reloadTestAction()
      })
    })
    describe('データなし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.resolve({ data: null }))
        await infiniteErrorTest(helper.locales.system.error, null)
      })
    })
    describe('スペース情報なし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { ...dataPage1, space: null } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.resolve({ data: { ...dataPage2, space: null } }))
        await infiniteErrorTest(helper.locales.system.error, null)
      })
    })
    describe('現在ページが異なる', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { ...dataPage1, invitation: { ...dataPage1.invitation, current_page: 9 } } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.resolve({ data: { ...dataPage2, invitation: { ...dataPage2.invitation, current_page: 9 } } }))
        await infiniteErrorTest(helper.locales.system.error, null)
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.network.failure })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.reject({ response: null }))
        await infiniteErrorTest(helper.locales.network.failure, null)
      })
    })
    describe('認証エラー', () => {
      it('[初期表示]ログインページにリダイレクトされる', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(authLogoutMock, 1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
        // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.reject({ response: { status: 401 } }))
        await infiniteErrorTest(null, helper.locales.auth.unauthenticated)
      })
    })
    describe('権限エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 403 } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(authLogoutMock, 0)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 403, alert: helper.locales.auth.forbidden })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.reject({ response: { status: 403 } }))
        await infiniteErrorTest(helper.locales.auth.forbidden, null)
      })
    })
    describe('存在しない', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 404 } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 404, alert: helper.locales.system.notfound })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.reject({ response: { status: 404 } }))
        await infiniteErrorTest(helper.locales.system.notfound, null)
      })
    })
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: helper.locales.network.error })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.reject({ response: { status: 500 } }))
        await infiniteErrorTest(helper.locales.network.error, null)
      })
    })
    describe('その他エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: helper.locales.system.default })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.reject({ response: { status: 400, data: {} } }))
        await infiniteErrorTest(helper.locales.system.default, null)
      })
    })
  })

  describe('表示項目', () => {
    it('null', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual([])
    })
    it('空', async () => {
      localStorage.setItem(`${model}.hidden-items`, '')
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual([''])
    })
    it('配列', async () => {
      localStorage.setItem(`${model}.hidden-items`, 'test1,test2')
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual(['test1', 'test2'])
    })
  })

  describe('処理', () => {
    let wrapper
    const beforeAction = async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage1 }))
      wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: null })
    }

    describe('招待URL設定更新', () => {
      const invitation = Object.freeze({ ...dataPage1.invitations[0], power: 'test' })
      const invitations = Object.freeze([invitation, dataPage1.invitations[1]])
      it('情報が更新され、対象メンバーのコードがセットされる', async () => {
        await beforeAction()
        expect(wrapper.vm.$data.invitations).not.toEqual(invitations)

        // 招待URL設定更新
        wrapper.vm.updateInvitation(invitation)

        expect(wrapper.vm.$data.invitations).toEqual(invitations)
      })
    })
  })
})
