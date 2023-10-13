import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import InfiniteLoading from 'v3-infinite-loading'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
// import AppListSetting from '~/components/app/ListSetting.vue' // NOTE: 項目が少ないので未使用
import SpacesSearch from '~/components/spaces/Search.vue'
import SpacesLists from '~/components/spaces/Lists.vue'
import Page from '~/pages/spaces/index.vue'

describe('index.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      navigateTo: vi.fn(),
      showError: vi.fn(),
      toast: helper.mockToast,
      headers: { get: vi.fn((key: string) => key === 'uid' ? '1' : null) }
    }
  })

  // const model = 'space'
  const mountFunction = (loggedIn = false, query: object | null = null) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)

    const wrapper = mount(Page, {
      global: {
        stubs: {
          InfiniteLoading: true,
          AppLoading: true,
          AppProcessing: true,
          // AppListSetting: true,
          SpacesSearch: true,
          SpacesLists: true
        },
        mocks: {
          $auth: {
            loggedIn
          },
          $route: {
            query: { ...query }
          },
          $toast: mock.toast
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  let optionParams = {
    public: 1,
    private: 1,
    join: 1,
    nojoin: 1
  }
  const defaultParams = Object.freeze({
    text: '',
    ...optionParams,
    active: 1,
    destroy: 0
  })

  let optionQuery = {}
  if (helper.commonConfig.enablePublicSpace) {
    optionParams = {
      public: 1,
      private: 0,
      join: 1,
      nojoin: 0
    }
    optionQuery = {
      public: String(optionParams.public),
      private: String(optionParams.private),
      join: String(optionParams.join),
      nojoin: String(optionParams.nojoin)
    }
  }
  const findParams = Object.freeze({
    text: 'aaa',
    ...optionParams,
    active: 1,
    destroy: 0
  })
  const findQuery = Object.freeze({
    text: 'aaa',
    ...optionQuery,
    active: String(findParams.active),
    destroy: String(findParams.destroy),
    option: '1'
  })

  const dataCount0 = Object.freeze({
    space: {
      total_count: 0,
      current_page: 1,
      total_pages: 0,
      limit_value: 2
    }
  })
  const dataCount1 = Object.freeze({
    space: {
      total_count: 1,
      current_page: 1,
      total_pages: 1,
      limit_value: 2
    },
    spaces: [
      { code: 'code0001' }
    ]
  })

  const dataPage1 = Object.freeze({
    space: {
      total_count: 5,
      current_page: 1,
      total_pages: 3,
      limit_value: 2
    },
    spaces: [
      { code: 'code0001' },
      { code: 'code0002' }
    ]
  })
  const dataPage2 = Object.freeze({
    space: {
      total_count: 5,
      current_page: 2,
      total_pages: 3,
      limit_value: 2
    },
    spaces: [
      { code: 'code0003' },
      { code: 'code0004' }
    ]
  })
  const dataPage3 = Object.freeze({
    space: {
      total_count: 5,
      current_page: 3,
      total_pages: 3,
      limit_value: 2
    },
    spaces: [
      { code: 'code0005' }
    ]
  })

  // テスト内容
  const apiCalledTest = (count: number, params: object, page = count) => {
    expect(mock.useApiRequest).toBeCalledTimes(count)
    expect(mock.useApiRequest).nthCalledWith(count, helper.envConfig.apiBaseURL + helper.commonConfig.spaces.listUrl, 'GET', {
      ...params,
      page
    })
  }

  const viewTest = (wrapper: any, data: any, countView: string, show: any = { existInfinite: false, testState: null }, error = false) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.vm.$data.error).toBe(error)
    expect(wrapper.vm.$data.testState).toBe(show.testState)
    expect(wrapper.vm.$data.page).toBe(data.space.current_page)
    expect(wrapper.vm.$data.space).toEqual(data.space)
    expect(wrapper.vm.$data.spaces).toEqual(data.spaces)

    // 設定
    // const listSetting = wrapper.findComponent(AppListSetting)
    // expect(listSetting.vm.hiddenItems).toBe(wrapper.vm.$data.hiddenItems)
    // expect(listSetting.vm.admin).toBe(null)

    // 検索
    const spacesSearch = wrapper.findComponent(SpacesSearch)
    expect(spacesSearch.vm.processing).toBe(false)
    expect(spacesSearch.vm.query).toEqual(wrapper.vm.$data.query)

    // 一覧
    const spacesLists = wrapper.findComponent(SpacesLists)
    if (data.spaces == null || data.spaces.length === 0) {
      expect(wrapper.text()).toMatch('スペースが見つかりません。')
      expect(spacesLists.exists()).toBe(false)
    } else {
      expect(spacesLists.vm.spaces).toBe(wrapper.vm.$data.spaces)
      expect(spacesLists.vm.hiddenItems).toBe(wrapper.vm.$data.hiddenItems)
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

    apiCalledTest(1, defaultParams)
    const infiniteLoading = viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: null })

    // スクロール（2頁目）
    infiniteLoading.vm.$emit('infinite')
    await flushPromises()

    apiCalledTest(2, defaultParams)
    helper.toastMessageTest(mock.toast, { error: alert, info: notice })
    viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: 'error' }, true)
  }

  // テストケース
  describe('スペース一覧取得', () => {
    it('[0件]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount0])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1, defaultParams)
      viewTest(wrapper, dataCount0, '')
    })
    it('[1件]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1, defaultParams)
      viewTest(wrapper, dataCount1, '1件')
    })
    describe('無限スクロール', () => {
      let wrapper: any, infiniteLoading: any
      const beforeAction = async (loggedIn: boolean, uid1: string | null, uid2: string | null, uid3: string | null = null) => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: { get: vi.fn((key: string) => key === 'uid' ? uid1 : null) } }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: { get: vi.fn((key: string) => key === 'uid' ? uid2 : null) } }, dataPage2])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: { get: vi.fn((key: string) => key === 'uid' ? uid3 : null) } }, dataPage3])
        wrapper = mountFunction(loggedIn)
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1, defaultParams)
        infiniteLoading = viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: null })
      }
      const completeTestAction = async () => {
        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(2, defaultParams)
        const spaces = dataPage1.spaces.concat(dataPage2.spaces)
        viewTest(wrapper, { ...dataPage2, spaces }, '5件', { existInfinite: true, testState: 'loaded' })

        // スクロール（3頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(3, defaultParams)
        viewTest(wrapper, { ...dataPage3, spaces: spaces.concat(dataPage3.spaces) }, '5件', { existInfinite: false, testState: 'complete' })
      }
      const reloadTestAction = async () => {
        const beforeLocation = window.location
        const mockReload = vi.fn()
        Object.defineProperty(window, 'location', { value: { reload: mockReload } })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(2, defaultParams)
        helper.mockCalledTest(mockReload, 1)
        Object.defineProperty(window, 'location', { value: beforeLocation })
      }

      it('[未ログイン]スクロールで最終頁まで表示される', async () => {
        await beforeAction(false, null, null)
        await completeTestAction()
      })
      it('[未ログイン→ログイン中]リロードされる', async () => {
        await beforeAction(false, null, '1')
        await reloadTestAction()
      })
      it('[ログイン中]スクロールで最終頁まで表示される', async () => {
        await beforeAction(true, '1', '1', '1')
        await completeTestAction()
      })
      it('[ログイン中→未ログイン]リロードされる', async () => {
        await beforeAction(true, '1', null)
        await reloadTestAction()
      })
      it('[ログイン中→別ユーザー]リロードされる', async () => {
        await beforeAction(true, '1', '2')
        await reloadTestAction()
      })
    })
    describe('データなし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

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
    describe('現在ページが異なる', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, { ...dataPage1, space: { ...dataPage1.space, current_page: 9 } }])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error, notice: null } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, { ...dataPage2, space: { ...dataPage2.space, current_page: 9 } }])
        await infiniteErrorTest(helper.locales.system.error, null)
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

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
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

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
    it('[未ログイン]パラメータがセットされ、表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: { get: vi.fn(() => null) }}, dataCount1])
      const wrapper = mountFunction(false, findQuery)
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1, findParams)
      viewTest(wrapper, dataCount1, '1件')
    })
    it('[ログイン中]パラメータがセットされ、表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
      const wrapper = mountFunction(true, findQuery)
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1, findParams)
      viewTest(wrapper, dataCount1, '1件')
    })
  })

  /*
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
  */

  describe('スペース一覧検索', () => {
    let wrapper: any
    const beforeAction = async () => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1, defaultParams)
      viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: null })

      // スペース一覧検索
      wrapper.vm.$refs.search.error = vi.fn()
      let optionQuery = {}
      if (helper.commonConfig.enablePublicSpace) {
        optionQuery = {
          public: findParams.public === 1,
          private: findParams.private === 1,
          join: findParams.join === 1,
          nojoin: findParams.nojoin === 1
        }
      }
      wrapper.vm.$data.query = {
        text: findParams.text,
        ...optionQuery,
        active: findParams.active === 1,
        destroy: findParams.destroy === 1,
        option: findQuery.option === '1'
      }
      await wrapper.vm.searchSpacesList()
      await flushPromises()

      apiCalledTest(2, findParams, 1)
    }

    it('[正常]検索結果が更新され、URLが変更される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
      await beforeAction()

      viewTest(wrapper, dataCount1, '1件')
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(wrapper.vm.$refs.search.error, 0)
      helper.mockCalledTest(mock.navigateTo, 1, { query: findQuery })
    })
    it('[エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
        .mockImplementationOnce(() => [{ ok: false, status: null }, null])
      await beforeAction()

      viewTest(wrapper, dataPage1, '5件', { existInfinite: true, testState: null }, true)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.mockCalledTest(wrapper.vm.$refs.search.error, 1)
      helper.mockCalledTest(mock.navigateTo, 1, { query: findQuery })
    })
  })
})
