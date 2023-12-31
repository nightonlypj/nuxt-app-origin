import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import InfiniteLoading from 'v3-infinite-loading'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import AppListSetting from '~/components/app/ListSetting.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import InvitationsCreate from '~/components/invitations/Create.vue'
import InvitationsUpdate from '~/components/invitations/Update.vue'
import InvitationsLists from '~/components/invitations/Lists.vue'
import Page from '~/pages/invitations/[code].vue'
import { detail as space } from '~/test/data/spaces'
import { dataCount0, dataCount1, dataPage1, dataPage2, dataPage3, dataPageTo2, dataPageTo3, dataPageMiss1, dataPageMiss2 } from '~/test/data/invitations'

describe('[code].vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      showError: vi.fn(),
      navigateTo: vi.fn(),
      toast: helper.mockToast,
      headers: { get: vi.fn((key: string) => key === 'uid' ? '1' : null) }
    }
  })
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  const fullPath = `/invitations/${space.code}`
  const model = 'invitation'

  const mountFunction = (loggedIn = true, query: object | null = null, values = { messages }) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({
      fullPath,
      params: {
        code: space.code
      },
      query: { ...query }
    })))

    const wrapper: any = mount(Page, {
      global: {
        stubs: {
          InfiniteLoading: true,
          AppLoading: true,
          AppProcessing: true,
          AppMessage: true,
          AppListSetting: true,
          SpacesDestroyInfo: true,
          SpacesTitle: true,
          InvitationsCreate: true,
          InvitationsUpdate: true,
          InvitationsLists: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    for (const [key, value] of Object.entries(values)) { wrapper.vm[key] = value }
    return wrapper
  }

  // テスト内容
  const apiCalledTest = (count: number, params: object = { page: count }) => {
    expect(mock.useApiRequest).toBeCalledTimes(count)
    const url = helper.commonConfig.invitations.listUrl.replace(':space_code', space.code)
    expect(mock.useApiRequest).nthCalledWith(count, helper.envConfig.apiBaseURL + url, 'GET', params)
  }

  const viewTest = (wrapper: any, data: any, countView: string, show: any = { existInfinite: false, testState: null }, error: boolean = false) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    helper.messageTest(wrapper, AppMessage, messages)

    const spacesDestroyInfo = wrapper.findComponent(SpacesDestroyInfo)
    expect(spacesDestroyInfo.vm.space).toEqual(wrapper.vm.space)

    expect(wrapper.vm.error).toBe(error)
    expect(wrapper.vm.testState).toBe(show.testState)
    expect(wrapper.vm.page).toBe(data.invitation.current_page)
    expect(wrapper.vm.space).toEqual(data.space)
    expect(wrapper.vm.invitation).toEqual(data.invitation)
    expect(wrapper.vm.invitations).toEqual(data.invitations)

    const spacesTitle = wrapper.findComponent(SpacesTitle)
    expect(spacesTitle.vm.space).toEqual(wrapper.vm.space)

    // 設定
    const listSetting = wrapper.findComponent(AppListSetting)
    expect(listSetting.vm.model).toBe(model)
    expect(listSetting.vm.hiddenItems).toBe(wrapper.vm.hiddenItems)
    expect(listSetting.vm.admin).toBe(null)

    // 招待URL作成・変更
    const invitationsCreate = wrapper.findComponent(InvitationsCreate)
    const invitationsUpdate = wrapper.findComponent(InvitationsUpdate)
    expect(invitationsCreate.exists()).toBe(true)
    expect(invitationsCreate.vm.space).toEqual(wrapper.vm.space)
    expect(invitationsUpdate.exists()).toBe(true)
    expect(invitationsUpdate.vm.space).toEqual(wrapper.vm.space)

    // 一覧
    const invitationsLists = wrapper.findComponent(InvitationsLists)
    if (data.invitations == null || data.invitations.length === 0) {
      expect(wrapper.text()).toMatch('対象の招待URLが見つかりません。')
      expect(invitationsLists.exists()).toBe(false)
    } else {
      expect(invitationsLists.vm.invitations).toBe(wrapper.vm.invitations)
      expect(invitationsLists.vm.hiddenItems).toBe(wrapper.vm.hiddenItems)
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(show.existInfinite)
    return infiniteLoading
  }

  const infiniteErrorTest = async (messages = {}, checkViewTest = true) => {
    const wrapper = mountFunction()
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    apiCalledTest(1)
    const infiniteLoading = viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: null })

    // スクロール（2頁目）
    infiniteLoading.vm.$emit('infinite')
    await flushPromises()

    apiCalledTest(2)
    helper.toastMessageTest(mock.toast, messages)
    if (checkViewTest) {
      viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: 'error' }, true)
    }
  }

  // テストケース
  describe('未ログイン', () => {
    it('ログインページにリダイレクトされる', async () => {
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
  })

  describe('招待URL一覧取得', () => {
    it('[0件]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount0])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1)
      viewTest(wrapper, dataCount0, '')
    })
    it('[1件]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1)
      viewTest(wrapper, dataCount1, '1件')
    })
    describe('無限スクロール', () => {
      let wrapper: any, infiniteLoading: any
      const beforeAction = async (uid1: string | null, uid2: string | null, uid3: string | null = null) => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: { get: vi.fn((key: string) => key === 'uid' ? uid1 : null) } }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: { get: vi.fn((key: string) => key === 'uid' ? uid2 : null) } }, dataPage2])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: { get: vi.fn((key: string) => key === 'uid' ? uid3 : null) } }, dataPage3])
        wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        infiniteLoading = viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: null })
      }
      const completeTestAction = async () => {
        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(2)
        infiniteLoading = viewTest(wrapper, dataPageTo2, '5件', { existInfinite: true, testState: 'loaded' })

        // スクロール（3頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(3)
        viewTest(wrapper, dataPageTo3, '5件', { existInfinite: false, testState: 'complete' })
      }
      const reloadTestAction = async () => {
        const beforeLocation = window.location
        const mockReload = vi.fn()
        Object.defineProperty(window, 'location', { value: { reload: mockReload } })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(2)
        helper.mockCalledTest(mockReload, 1)
        Object.defineProperty(window, 'location', { value: beforeLocation })
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
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, null])
        await infiniteErrorTest({ error: helper.locales.system.error })
      })
    })
    describe('スペース情報なし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, { ...dataPage1, space: null }])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, { ...dataPage2, space: null }])
        await infiniteErrorTest({ error: helper.locales.system.error })
      })
    })
    describe('現在ページが異なる', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPageMiss1])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPageMiss2])
        await infiniteErrorTest({ error: helper.locales.system.error })
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: null }, null])
        await infiniteErrorTest({ error: helper.locales.network.failure })
      })
    })
    describe('認証エラー', () => {
      it('[初期表示]ログインページにリダイレクトされる', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, messages])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.mockCalledTest(mock.useAuthSignOut, 1, true)
        helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
        helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
        helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
      })
      it('[無限スクロール]ログインページにリダイレクトされる', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 401 }, messages])
        await infiniteErrorTest({ error: messages.alert, info: messages.notice }, false)
        helper.mockCalledTest(mock.useAuthSignOut, 1, true)
        helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
        helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
      })
    })
    describe('認証エラー（メッセージなし）', () => {
      it('[初期表示]ログインページにリダイレクトされる', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.mockCalledTest(mock.useAuthSignOut, 1, true)
        helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
        helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
        helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
      })
      it('[無限スクロール]ログインページにリダイレクトされる', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 401 }, null])
        await infiniteErrorTest({ info: helper.locales.auth.unauthenticated }, false)
        helper.mockCalledTest(mock.useAuthSignOut, 1, true)
        helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
        helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
      })
    })
    describe('権限エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, messages])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.mockCalledTest(mock.useAuthSignOut, 0)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: messages })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 403 }, messages])
        await infiniteErrorTest({ error: messages.alert, info: messages.notice })
      })
    })
    describe('権限エラー（メッセージなし）', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.mockCalledTest(mock.useAuthSignOut, 0)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: { alert: helper.locales.auth.forbidden } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 403 }, null])
        await infiniteErrorTest({ error: helper.locales.auth.forbidden })
      })
    })
    describe('存在しない', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, messages])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: messages })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 404 }, messages])
        await infiniteErrorTest({ error: messages.alert, info: messages.notice })
      })
    })
    describe('存在しない（メッセージなし）', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: { alert: helper.locales.system.notfound } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 404 }, null])
        await infiniteErrorTest({ error: helper.locales.system.notfound })
      })
    })
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 500 }, null])
        await infiniteErrorTest({ error: helper.locales.network.error })
      })
    })
    describe('その他エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 400 }, {}])
        await infiniteErrorTest({ error: helper.locales.system.default })
      })
    })
  })

  describe('招待URL一覧再取得', () => {
    let wrapper: any
    const beforeAction = async (data: object) => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1)
      viewTest(wrapper, data, '')

      // 再取得
      wrapper.vm.reloadInvitationsList()
      await flushPromises()

      apiCalledTest(2, { page: 1 })
    }

    it('[成功]表示が更新される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount0])
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
      await beforeAction(dataCount0)

      viewTest(wrapper, dataCount1, '')
      helper.toastMessageTest(mock.toast, {})
    })
    it('[接続エラー]表示が更新されない。エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount0])
        .mockImplementationOnce(() => [{ ok: false, status: null }, null])
      await beforeAction(dataCount0)

      viewTest(wrapper, dataCount0, '', { existInfinite: false, testState: null }, true)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
    })
  })

  describe('表示項目', () => {
    it('null', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      expect(wrapper.vm.hiddenItems).toEqual([])
    })
    it('空', async () => {
      localStorage.setItem(`${model}.hidden-items`, '')
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      expect(wrapper.vm.hiddenItems).toEqual([''])
    })
    it('配列', async () => {
      localStorage.setItem(`${model}.hidden-items`, 'test1,test2')
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      expect(wrapper.vm.hiddenItems).toEqual(['test1', 'test2'])
    })
  })

  describe('処理', () => {
    let wrapper: any
    const beforeAction = async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
      wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1)
      viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: null })
    }

    describe('招待URL設定更新', () => {
      const invitation = Object.freeze({ ...dataPage1.invitations[0], power: 'admin' })
      const invitations = Object.freeze([invitation, dataPage1.invitations[1]])
      it('情報が更新され、対象メンバーのコードがセットされる', async () => {
        await beforeAction()
        expect(wrapper.vm.invitations).not.toEqual(invitations)

        // 招待URL設定更新
        wrapper.vm.updateInvitation(invitation)

        expect(wrapper.vm.invitations).toEqual(invitations)
      })
    })
  })
})
