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

  const space = Object.freeze({
    code: 'code0001'
  })
  const adminSpace = Object.freeze({
    ...space,
    current_member: {
      power: 'admin'
    }
  })

  const model = 'member'
  const values = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  const fullPath = '/members/code0001'
  const mountFunction = (loggedIn = true, query: object | null = null) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)

    const wrapper = mount(Page, {
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
        },
        mocks: {
          $auth: {
            loggedIn
          },
          $route: {
            fullPath,
            params: {
              code: space.code
            },
            query: { ...query }
          },
          $toast: mock.toast
        }
      },
      data () {
        return { ...values }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const defaultPowers = []
  const findPower: any = {}
  const findPowers = []
  let findPowerQuery = ''
  let index = 0
  for (const key in helper.locales.enums.member.power) {
    defaultPowers.push(key)
    findPower[key] = index % 2 === 0
    if (findPower[key]) { findPowers.push(key) }
    findPowerQuery += String(Number(findPower[key]))
    index++
  }

  const defaultParams = Object.freeze({
    text: '',
    power: defaultPowers.join(),
    active: 1,
    destroy: 1,
    sort: 'invitationed_at',
    desc: 1
  })

  const findParams = Object.freeze({
    text: 'aaa',
    power: findPowers.join(),
    active: 1,
    destroy: 1,
    sort: 'user.name',
    desc: 0
  })
  const findQuery = Object.freeze({
    ...findParams,
    power: findPowerQuery,
    active: String(findParams.active),
    destroy: String(findParams.destroy),
    desc: String(findParams.desc),
    option: '1'
  })

  const dataCount0 = Object.freeze({
    space,
    member: {
      total_count: 0,
      current_page: 1,
      total_pages: 0,
      limit_value: 2
    }
  })
  const dataCount1 = Object.freeze({
    space,
    member: {
      total_count: 1,
      current_page: 1,
      total_pages: 1,
      limit_value: 2
    },
    members: [
      { user: { code: 'code000000000000000000001' } }
    ]
  })

  const dataPage1 = Object.freeze({
    space,
    member: {
      total_count: 5,
      current_page: 1,
      total_pages: 3,
      limit_value: 2
    },
    members: [
      { user: { code: 'code000000000000000000001' } },
      { user: { code: 'code000000000000000000002' } }
    ]
  })
  const dataPage2 = Object.freeze({
    space,
    member: {
      total_count: 5,
      current_page: 2,
      total_pages: 3,
      limit_value: 2
    },
    members: [
      { user: { code: 'code000000000000000000003' } },
      { user: { code: 'code000000000000000000004' } }
    ]
  })
  const dataPage3 = Object.freeze({
    space,
    member: {
      total_count: 5,
      current_page: 3,
      total_pages: 3,
      limit_value: 2
    },
    members: [
      { user: { code: 'code000000000000000000005' } }
    ]
  })

  // テスト内容
  const apiCalledTest = (count: number, params: object = { ...defaultParams, page: count }) => {
    expect(mock.useApiRequest).toBeCalledTimes(count)
    const url = helper.commonConfig.members.listUrl.replace(':space_code', space.code)
    expect(mock.useApiRequest).nthCalledWith(count, helper.envConfig.apiBaseURL + url, 'GET', params)
  }

  const viewTest = (wrapper: any, data: any, countView: string, admin = false, show: any = { existInfinite: false, testState: null }, error = false) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    helper.messageTest(wrapper, AppMessage, values)

    const spacesDestroyInfo = wrapper.findComponent(SpacesDestroyInfo)
    expect(spacesDestroyInfo.vm.space).toEqual(wrapper.vm.$data.space)

    expect(wrapper.vm.$data.error).toBe(error)
    expect(wrapper.vm.$data.testState).toBe(show.testState)
    expect(wrapper.vm.$data.page).toBe(data.member.current_page)
    expect(wrapper.vm.$data.space).toEqual(data.space)
    expect(wrapper.vm.$data.member).toEqual(data.member)
    expect(wrapper.vm.$data.members).toEqual(data.members)

    const spacesTitle = wrapper.findComponent(SpacesTitle)
    expect(spacesTitle.vm.space).toEqual(wrapper.vm.$data.space)

    // 設定
    const listSetting = wrapper.findComponent(AppListSetting)
    expect(listSetting.vm.model).toBe(model)
    expect(listSetting.vm.hiddenItems).toBe(wrapper.vm.$data.hiddenItems)
    expect(listSetting.vm.admin).toBe(admin)

    // 検索
    const membersSearch = wrapper.findComponent(MembersSearch)
    expect(membersSearch.vm.processing).toBe(false)
    expect(membersSearch.vm.query).toEqual(wrapper.vm.$data.query)
    expect(membersSearch.vm.admin).toBe(admin)

    // 招待・変更・ダウンロード・解除
    const membersCreate = wrapper.findComponent(MembersCreate)
    const membersUpdate = wrapper.findComponent(MembersUpdate)
    const listDownload = wrapper.findComponent(AppListDownload)
    if (admin) {
      expect(membersCreate.exists()).toBe(true)
      expect(membersCreate.vm.space).toEqual(wrapper.vm.$data.space)
      expect(membersUpdate.exists()).toBe(true)
      expect(membersUpdate.vm.space).toEqual(wrapper.vm.$data.space)
      expect(listDownload.exists()).toBe(true)
      expect(listDownload.vm.model).toBe(model)
      expect(listDownload.vm.space).toEqual(wrapper.vm.$data.space)
      expect(listDownload.vm.searchParams).toEqual(wrapper.vm.$data.params)
      expect(listDownload.vm.selectItems).toBe(wrapper.vm.selectItems)
      expect(listDownload.vm.hiddenItems).toBe(wrapper.vm.$data.hiddenItems)
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
      expect(membersLists.vm.sort).toBe(wrapper.vm.$data.query.sort)
      expect(membersLists.vm.desc).toBe(wrapper.vm.$data.query.desc)
      expect(membersLists.vm.members).toBe(wrapper.vm.$data.members)
      expect(membersLists.vm.selectedMembers).toBe(wrapper.vm.$data.selectedMembers)
      expect(membersLists.vm.hiddenItems).toBe(wrapper.vm.$data.hiddenItems)
      expect(membersLists.vm.admin).toBe(admin)
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(show.existInfinite)
    return infiniteLoading
  }

  const infiniteErrorTest = async (alert: string | null, notice: string | null) => {
    const wrapper = mountFunction()
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    apiCalledTest(1)
    const infiniteLoading = viewTest(wrapper, dataPage1, '5名', false, { existInfinite: true, testState: null })

    // スクロール（2頁目）
    infiniteLoading.vm.$emit('infinite')
    await flushPromises()

    apiCalledTest(2)
    helper.toastMessageTest(mock.toast, { error: alert, info: notice })
    viewTest(wrapper, dataPage1, '5名', false, { existInfinite: true, testState: 'error' }, true)
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
        const data = Object.freeze({ ...dataCount0, space: adminSpace })
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
        const data = Object.freeze({ ...dataCount1, space: adminSpace })
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, data])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        viewTest(wrapper, data, '1名', true)

        // 選択
        wrapper.vm.$data.selectedMembers = [data.members[0]]
        await flushPromises()

        // 削除
        const membersDelete = wrapper.findComponent(MembersDelete)
        expect(membersDelete.exists()).toBe(true)
        expect(membersDelete.vm.space).toEqual(wrapper.vm.$data.space)
        expect(membersDelete.vm.selectedMembers).toEqual(wrapper.vm.$data.selectedMembers)

        // 結果
        wrapper.vm.$data.createResult = {}
        wrapper.vm.$data.tabPage = 'result'
        await flushPromises()

        const membersResult = wrapper.findComponent(MembersResult)
        expect(membersResult.exists()).toBe(true)
        expect(membersResult.vm.result).toEqual(wrapper.vm.$data.createResult)
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
        const members = dataPage1.members.concat(dataPage2.members)
        infiniteLoading = viewTest(wrapper, { ...dataPage2, members }, '5名', false, { existInfinite: true, testState: 'loaded' })

        // スクロール（3頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(3)
        viewTest(wrapper, { ...dataPage3, members: members.concat(dataPage3.members) }, '5名', false, { existInfinite: false, testState: 'complete' })
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
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error, notice: null } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, null])
        await infiniteErrorTest(helper.locales.system.error, null)
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
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error, notice: null } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, { ...dataPage2, space: null }])
        await infiniteErrorTest(helper.locales.system.error, null)
      })
    })
    describe('現在ページが異なる', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, { ...dataPage1, member: { ...dataPage1.member, current_page: 9 } }])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error, notice: null } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, { ...dataPage2, member: { ...dataPage2.member, current_page: 9 } }])
        await infiniteErrorTest(helper.locales.system.error, null)
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
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure, notice: null } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: null }, null])
        await infiniteErrorTest(helper.locales.network.failure, null)
      })
    })
    describe('認証エラー', () => {
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
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 401 }, null])
        await infiniteErrorTest(null, helper.locales.auth.unauthenticated)
      })
    })
    describe('権限エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.mockCalledTest(mock.useAuthSignOut, 0)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: { alert: helper.locales.auth.forbidden, notice: null } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 403 }, null])
        await infiniteErrorTest(helper.locales.auth.forbidden, null)
      })
    })
    describe('存在しない', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: { alert: helper.locales.system.notfound, notice: null } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 404 }, null])
        await infiniteErrorTest(helper.locales.system.notfound, null)
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
        helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error, notice: null } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 500 }, null])
        await infiniteErrorTest(helper.locales.network.error, null)
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
        helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default, notice: null } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 400 }, {}])
        await infiniteErrorTest(helper.locales.system.default, null)
      })
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

      expect(wrapper.vm.$data.hiddenItems).toEqual([])
    })
    it('空', async () => {
      localStorage.setItem(`${model}.hidden-items`, '')
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      expect(wrapper.vm.$data.hiddenItems).toEqual([''])
    })
    it('配列', async () => {
      localStorage.setItem(`${model}.hidden-items`, 'test1,test2')
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      expect(wrapper.vm.$data.hiddenItems).toEqual(['test1', 'test2'])
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
      wrapper.vm.$refs.search.error = vi.fn()
      wrapper.vm.$data.query = {
        ...findParams,
        power: findPower,
        active: findParams.active === 1,
        destroy: findParams.destroy === 1,
        desc: findParams.desc !== 0,
        option: findQuery.option === '1'
      }
      wrapper.vm.$data.reloading = reloading
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
      helper.mockCalledTest(wrapper.vm.$refs.search.error, 0)
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
      helper.mockCalledTest(wrapper.vm.$refs.search.error, 1)
      helper.mockCalledTest(mock.navigateTo, 1, { query: findQuery })
    })
    it('[再取得中]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
      await beforeAction(true)

      expect(mock.useApiRequest).toBeCalledTimes(1)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.timeout })
      helper.mockCalledTest(wrapper.vm.$refs.search.error, 1)
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
      const result = Object.freeze({
        user_codes: ['newcode1', 'newcode2']
      })
      it('結果と招待メンバーのコードがセットされる', async () => {
        await beforeAction()
        expect(wrapper.vm.$data.createResult).not.toEqual(result)
        expect(wrapper.vm.$data.activeUserCodes).not.toEqual(result.user_codes)
        expect(wrapper.vm.$data.tabPage).not.toBe('result')

        // メンバー招待（結果）
        wrapper.vm.resultMembers(result)

        expect(wrapper.vm.$data.createResult).toEqual(result)
        expect(wrapper.vm.$data.activeUserCodes).toEqual(result.user_codes)
        expect(wrapper.vm.$data.tabPage).toBe('result')
      })
    })

    describe('メンバー情報更新', () => {
      const member = Object.freeze({ ...dataPage1.members[0], power: 'test' })
      const members = Object.freeze([member, dataPage1.members[1]])
      it('情報が更新され、対象メンバーのコードがセットされる', async () => {
        await beforeAction()
        expect(wrapper.vm.$data.activeUserCodes).not.toEqual([member.user.code])
        expect(wrapper.vm.$data.members).not.toEqual(members)

        // メンバー情報更新
        wrapper.vm.updateMember(member)

        expect(wrapper.vm.$data.activeUserCodes).toEqual([member.user.code])
        expect(wrapper.vm.$data.members).toEqual(members)
      })
    })
  })
})
