import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import InfiniteLoading from 'v3-infinite-loading'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import AppListSetting from '~/components/app/ListSetting.vue'
import AppListDownload from '~/components/app/ListDownload.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import MembersSearch from '~/components/members/Search.vue'
import MembersCreate from '~/components/members/Create.vue'
import MembersUpdate from '~/components/members/Update.vue'
import MembersDelete from '~/components/members/Delete.vue'
import MembersLists from '~/components/members/Lists.vue'
import MembersResult from '~/components/members/Result.vue'
import Page from '~/pages/members/[code].vue'
import { detail as space, detailPower } from '~/test/data/spaces'
import { defaultParams, findParams, findQuery, findData, dataCount0, dataCount1, dataPage1, dataPage2, dataPage3, dataPageTo2, dataPageTo3, dataPageMiss1, dataPageMiss2 } from '~/test/data/members'

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
  const fullPath = `/members/${space.code}`
  const model = 'member'

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
          AppListDownload: true,
          SpacesDestroyInfo: true,
          SpacesTitle: true,
          MembersSearch: true,
          MembersCreate: true,
          MembersUpdate: true,
          MembersDelete: true,
          MembersLists: true,
          MembersResult: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    for (const [key, value] of Object.entries(values)) { wrapper.vm[key] = value }
    return wrapper
  }

  // テスト内容
  const apiCalledTest = (count: number, params: object = { ...defaultParams, page: count }) => {
    expect(mock.useApiRequest).toBeCalledTimes(count)
    const url = helper.commonConfig.members.listUrl.replace(':space_code', space.code)
    expect(mock.useApiRequest).nthCalledWith(count, helper.envConfig.apiBaseURL + url, 'GET', params)
  }

  const viewTest = (wrapper: any, data: any, countView: string, admin = false, show: any = { existInfinite: false, testState: null }, error = false) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    helper.messageTest(wrapper, AppMessage, messages)

    const spacesDestroyInfo = wrapper.findComponent(SpacesDestroyInfo)
    expect(spacesDestroyInfo.vm.space).toEqual(wrapper.vm.space)

    expect(wrapper.vm.error).toBe(error)
    expect(wrapper.vm.testState).toBe(show.testState)
    expect(wrapper.vm.page).toBe(data.member.current_page)
    expect(wrapper.vm.space).toEqual(data.space)
    expect(wrapper.vm.member).toEqual(data.member)
    expect(wrapper.vm.members).toEqual(data.members)

    const spacesTitle = wrapper.findComponent(SpacesTitle)
    expect(spacesTitle.vm.space).toEqual(wrapper.vm.space)

    // 設定
    const listSetting = wrapper.findComponent(AppListSetting)
    expect(listSetting.vm.model).toBe(model)
    expect(listSetting.vm.hiddenItems).toBe(wrapper.vm.hiddenItems)
    expect(listSetting.vm.admin).toBe(admin)

    // 検索
    const membersSearch = wrapper.findComponent(MembersSearch)
    expect(membersSearch.vm.processing).toBe(false)
    expect(membersSearch.vm.query).toEqual(wrapper.vm.query)
    expect(membersSearch.vm.admin).toBe(admin)

    // 招待・変更・ダウンロード・解除
    const membersCreate = wrapper.findComponent(MembersCreate)
    const membersUpdate = wrapper.findComponent(MembersUpdate)
    const listDownload = wrapper.findComponent(AppListDownload)
    if (admin) {
      expect(membersCreate.exists()).toBe(true)
      expect(membersCreate.vm.space).toEqual(wrapper.vm.space)
      expect(membersUpdate.exists()).toBe(true)
      expect(membersUpdate.vm.space).toEqual(wrapper.vm.space)
      expect(listDownload.exists()).toBe(true)
      expect(listDownload.vm.model).toBe(model)
      expect(listDownload.vm.space).toEqual(wrapper.vm.space)
      expect(listDownload.vm.searchParams).toEqual(wrapper.vm.params)
      expect(listDownload.vm.selectItems).toBe(wrapper.vm.selectItems)
      expect(listDownload.vm.hiddenItems).toBe(wrapper.vm.hiddenItems)
      expect(listDownload.vm.admin).toBe(admin)
    } else {
      expect(membersCreate.exists()).toBe(false)
      expect(membersUpdate.exists()).toBe(false)
      expect(listDownload.exists()).toBe(false)
    }
    expect(wrapper.findComponent(MembersDelete).exists()).toBe(false)
    expect(wrapper.findComponent(MembersResult).exists()).toBe(false)

    // 一覧
    const membersLists = wrapper.findComponent(MembersLists)
    if (data.members == null || data.members.length === 0) {
      expect(wrapper.text()).toMatch('対象のメンバーが見つかりません。')
      expect(membersLists.exists()).toBe(false)
    } else {
      expect(membersLists.vm.sort).toBe(wrapper.vm.query.sort)
      expect(membersLists.vm.desc).toBe(wrapper.vm.query.desc)
      expect(membersLists.vm.members).toBe(wrapper.vm.members)
      expect(membersLists.vm.selectedMembers).toBe(wrapper.vm.selectedMembers)
      expect(membersLists.vm.hiddenItems).toBe(wrapper.vm.hiddenItems)
      expect(membersLists.vm.admin).toBe(admin)
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(show.existInfinite)
    return infiniteLoading
  }

  const infiniteErrorTest = async (messages = {}, signOut = false) => {
    const wrapper = mountFunction()
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    apiCalledTest(1)
    const infiniteLoading = viewTest(wrapper, dataPage1, '5名', false, { existInfinite: true, testState: null })

    // スクロール（2頁目）
    infiniteLoading.vm.$emit('infinite')
    await flushPromises()

    apiCalledTest(2)
    helper.mockCalledTest(mock.useAuthSignOut, signOut ? 1 : 0, true)
    helper.toastMessageTest(mock.toast, messages)
    if (signOut) {
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    } else {
      viewTest(wrapper, dataPage1, '5名', false, { existInfinite: true, testState: 'error' }, true)
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

  describe('メンバー一覧取得', () => {
    describe('0件', () => {
      it('[管理者]表示される（招待・変更・ダウンロードも含む）', async () => {
        const data = Object.freeze({ ...dataCount0, space: detailPower.value('admin') })
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, data])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        viewTest(wrapper, data, '', true)
      })
      it('[管理者以外]表示される（招待・変更・ダウンロードを除く）', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount0])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        viewTest(wrapper, dataCount0, '', false)
      })
    })
    describe('1件', () => {
      it('[管理者]表示される（招待・変更・ダウンロード・削除・結果も含む）', async () => {
        const data = Object.freeze({ ...dataCount1, space: detailPower.value('admin') })
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, data])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        viewTest(wrapper, data, '1名', true)

        // 選択
        wrapper.vm.selectedMembers = [data.members[0]]
        await flushPromises()

        // 削除
        const membersDelete = wrapper.findComponent(MembersDelete)
        expect(membersDelete.exists()).toBe(true)
        expect(membersDelete.vm.space).toEqual(wrapper.vm.space)
        expect(membersDelete.vm.selectedMembers).toEqual(wrapper.vm.selectedMembers)

        // 結果
        wrapper.vm.createResult = {}
        wrapper.vm.tabPage = 'result'
        await flushPromises()

        const membersResult = wrapper.findComponent(MembersResult)
        expect(membersResult.exists()).toBe(true)
        expect(membersResult.vm.result).toEqual(wrapper.vm.createResult)
      })
      it('[管理者以外]表示される（招待・変更・ダウンロードを除く）', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        viewTest(wrapper, dataCount1, '1名', false)
      })
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
        infiniteLoading = viewTest(wrapper, dataPage1, '5名', false, { existInfinite: true, testState: null })
      }
      const completeTestAction = async () => {
        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(2)
        infiniteLoading = viewTest(wrapper, dataPageTo2, '5名', false, { existInfinite: true, testState: 'loaded' })

        // スクロール（3頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(3)
        viewTest(wrapper, dataPageTo3, '5名', false, { existInfinite: false, testState: 'complete' })
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
        helper.mockCalledTest(mock.useAuthSignOut, 0)
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
        helper.mockCalledTest(mock.useAuthSignOut, 0)
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
        helper.mockCalledTest(mock.useAuthSignOut, 0)
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
        helper.mockCalledTest(mock.useAuthSignOut, 0)
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
        await infiniteErrorTest({ error: messages.alert, info: messages.notice }, true)
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
        await infiniteErrorTest({ info: helper.locales.auth.unauthenticated }, true)
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
        helper.mockCalledTest(mock.useAuthSignOut, 0)
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
        helper.mockCalledTest(mock.useAuthSignOut, 0)
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
        helper.mockCalledTest(mock.useAuthSignOut, 0)
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
        helper.mockCalledTest(mock.useAuthSignOut, 0)
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

  describe('メンバー一覧再取得', () => {
    it('表示される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      // メンバー一覧再取得を実行
      wrapper.vm.reloadMembersList({ sort: findParams.sort, desc: false })
      await flushPromises()

      apiCalledTest(2, { ...defaultParams, sort: findParams.sort, desc: 0, page: 1 })
      viewTest(wrapper, dataCount1, '1名')
    })
  })

  describe('パラメータあり', () => {
    it('パラメータがセットされ、表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
      const wrapper = mountFunction(true, findQuery)
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1, { ...findParams, page: 1 })
      viewTest(wrapper, dataCount1, '1名')
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

  describe('メンバー一覧検索', () => {
    let wrapper: any
    const beforeAction = async (reloading = false) => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1)
      viewTest(wrapper, dataPage1, '5名', false, { existInfinite: true, testState: null })

      // メンバー一覧検索
      wrapper.vm.$refs.membersSearch.setError = vi.fn()
      wrapper.vm.query = findData
      wrapper.vm.reloading = reloading
      await wrapper.vm.searchMembersList()
      await flushPromises()
    }

    it('[正常]検索結果が更新され、URLが変更される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
      await beforeAction()

      apiCalledTest(2, { ...findParams, page: 1 })
      viewTest(wrapper, dataCount1, '1名')
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(wrapper.vm.$refs.membersSearch.setError, 0)
      helper.mockCalledTest(mock.navigateTo, 1, { query: findQuery })
    })
    it('[エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
        .mockImplementationOnce(() => [{ ok: false, status: null }, null])
      await beforeAction()

      apiCalledTest(2, { ...findParams, page: 1 })
      viewTest(wrapper, dataPage1, '5名', false, { existInfinite: true, testState: null }, true)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.mockCalledTest(wrapper.vm.$refs.membersSearch.setError, 1)
      helper.mockCalledTest(mock.navigateTo, 1, { query: findQuery })
    })
    it('[再取得中]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
      await beforeAction(true)

      expect(mock.useApiRequest).toBeCalledTimes(1)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.timeout })
      helper.mockCalledTest(wrapper.vm.$refs.membersSearch.setError, 1)
      helper.mockCalledTest(mock.navigateTo, 0)
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
      viewTest(wrapper, dataPage1, '5名', false, { existInfinite: true, testState: null })
    }

    describe('メンバー招待（結果）', () => {
      it('結果と招待メンバーのコードがセットされる', async () => {
        const result = Object.freeze({ user_codes: ['newcode1', 'newcode2'] })
        await beforeAction()

        expect(wrapper.vm.createResult).not.toEqual(result)
        expect(wrapper.vm.activeUserCodes).not.toEqual(result.user_codes)
        expect(wrapper.vm.tabPage).not.toBe('result')

        // メンバー招待（結果）
        wrapper.vm.resultMembers(result)

        expect(wrapper.vm.createResult).toEqual(result)
        expect(wrapper.vm.activeUserCodes).toEqual(result.user_codes)
        expect(wrapper.vm.tabPage).toBe('result')
      })
    })

    describe('メンバー情報更新', () => {
      it('情報が更新され、対象メンバーのコードがセットされる', async () => {
        const member = Object.freeze({ ...dataPage1.members[0], power: 'admin' })
        const members = Object.freeze([member, dataPage1.members[1]])
        await beforeAction()

        expect(wrapper.vm.activeUserCodes).not.toEqual([member.user.code])
        expect(wrapper.vm.members).not.toEqual(members)

        // メンバー情報更新
        wrapper.vm.updateMember(member)

        expect(wrapper.vm.activeUserCodes).toEqual([member.user.code])
        expect(wrapper.vm.members).toEqual(members)
      })
    })
  })
})
