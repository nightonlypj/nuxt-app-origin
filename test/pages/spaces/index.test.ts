import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import InfiniteLoading from 'v3-infinite-loading'
import { apiRequestURL } from '~/utils/api'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
// import AppListSetting from '~/components/app/ListSetting.vue' // NOTE: 項目が少ないので未使用
import SpacesSearch from '~/components/spaces/Search.vue'
import SpacesLists from '~/components/spaces/Lists.vue'
import Page from '~/pages/spaces/index.vue'
import { defaultParams, findParams, findQuery, findData, dataCount0, dataCount1, dataCount2, dataPage1, dataPage2, dataPage3, dataPageTo2, dataPageTo3, dataPageMiss1, dataPageMiss2 } from '~/test/data/spaces'

const $config = config.global.mocks.$config
const $t = config.global.mocks.$t

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
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  // const model = 'space'
  // const defaultHiddenItems = $config.public.spaces.defaultHiddenItems

  let stateRouteQuery: any
  const mountFunction = (loggedIn = false, query: object | null = null, stateQuery: object | null = null) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({ query: { ...query } })))

    stateRouteQuery = ref({ ...stateQuery })
    vi.stubGlobal('useState', vi.fn((key: string) => key === 'spacesRouteQuery' ? stateRouteQuery : null))

    const wrapper = mount(Page, {
      global: {
        stubs: {
          InfiniteLoading: true,
          AppLoading: true,
          AppProcessing: true,
          // AppListSetting: true,
          SpacesSearch: true,
          SpacesLists: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const apiCalledTest = (count: number, params: object = { ...defaultParams, page: count }) => {
    expect(mock.useApiRequest).toBeCalledTimes(count)
    expect(mock.useApiRequest).nthCalledWith(count, apiRequestURL(helper.locale, $config.public.spaces.listUrl), 'GET', params)
  }

  const viewTest = (wrapper: any, data: any, countView: string, show: any = { existInfinite: false, testState: null }, error = false) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.vm.error).toBe(error)
    expect(wrapper.vm.testState).toBe(show.testState)
    expect(wrapper.vm.page).toBe(data.space.current_page)
    expect(wrapper.vm.space).toEqual(data.space)
    expect(wrapper.vm.spaces).toEqual(data.spaces)

    // 設定
    // const listSetting = wrapper.findComponent(AppListSetting)
    // expect(listSetting.vm.hiddenItems).toBe(wrapper.vm.hiddenItems)
    // expect(listSetting.vm.admin).toBe(null)

    // 検索
    const spacesSearch = wrapper.findComponent(SpacesSearch)
    expect(spacesSearch.vm.processing).toBe(false)
    expect(spacesSearch.vm.query).toEqual(wrapper.vm.query)

    // 一覧
    const spacesLists = wrapper.findComponent(SpacesLists)
    if (data.spaces == null || data.spaces.length === 0) {
      expect(wrapper.text()).toMatch($t('対象の{name}が見つかりません。', { name: $t('スペース') }))
      expect(spacesLists.exists()).toBe(false)
    } else {
      expect(spacesLists.vm.spaces).toBe(wrapper.vm.spaces)
      expect(spacesLists.vm.hiddenItems).toBe(wrapper.vm.hiddenItems)
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(show.existInfinite)
    return infiniteLoading
  }

  const infiniteErrorTest = async (messages = {}) => {
    const wrapper = mountFunction()
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    apiCalledTest(1)
    const infiniteLoading = viewTest(wrapper, dataPage1, $t('{total}件（複数）', { total: 5 }), { existInfinite: true, testState: null })

    // スクロール（2頁目）
    infiniteLoading.vm.$emit('infinite')
    await flushPromises()

    apiCalledTest(2)
    helper.toastMessageTest(mock.toast, messages)
    viewTest(wrapper, dataPage1, $t('{total}件（複数）', { total: 5 }), { existInfinite: true, testState: 'error' }, true)
  }

  // テストケース
  describe('スペース一覧取得', () => {
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
      viewTest(wrapper, dataCount1, $t('{total}件（単数）', { total: 1 }))
    })
    it('[2件]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount2])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1)
      viewTest(wrapper, dataCount2, $t('{total}件（複数）', { total: 2 }))
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

        apiCalledTest(1)
        infiniteLoading = viewTest(wrapper, dataPage1, $t('{total}件（複数）', { total: 5 }), { existInfinite: true, testState: null })
      }
      const completeTestAction = async () => {
        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(2)
        viewTest(wrapper, dataPageTo2, $t('{total}件（複数）', { total: 5 }), { existInfinite: true, testState: 'loaded' })

        // スクロール（3頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(3)
        viewTest(wrapper, dataPageTo3, $t('{total}件（複数）', { total: 5 }), { existInfinite: false, testState: 'complete' })
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
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: $t('system.error') } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, null])
        await infiniteErrorTest({ error: $t('system.error') })
      })
    })
    describe('現在ページが異なる', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPageMiss1])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: $t('system.error') } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPageMiss2])
        await infiniteErrorTest({ error: $t('system.error') })
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: $t('network.failure') } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: null }, null])
        await infiniteErrorTest({ error: $t('network.failure') })
      })
    })
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: $t('network.error') } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 500 }, null])
        await infiniteErrorTest({ error: $t('network.error') })
      })
    })
    describe('その他エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, messages])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: messages })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 400 }, messages])
        await infiniteErrorTest({ error: messages.alert, info: messages.notice })
      })
    })
    describe('その他エラー（メッセージなし）', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: $t('system.default') } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 400 }, {}])
        await infiniteErrorTest({ error: $t('system.default') })
      })
    })
  })

  describe('パラメータ', () => {
    let wrapper: any
    const beforeAction = async () => {
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1, { ...findParams, page: 1 })
      viewTest(wrapper, dataCount1, $t('{total}件（単数）', { total: 1 }))
    }
    let loggedIn: boolean
    beforeEach(() => {
      if (loggedIn) {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
      } else {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: { get: vi.fn(() => null) } }, dataCount1])
      }
    })

    describe('あり、保存クエリあり', () => {
      it('[未ログイン]パラメータがセットされ、表示される', async () => {
        loggedIn = false
        wrapper = mountFunction(loggedIn, findQuery, { ...findQuery, text: 'not' })
        await beforeAction()
      })
      it('[ログイン中]パラメータがセットされ、表示される', async () => {
        loggedIn = true
        wrapper = mountFunction(loggedIn, findQuery, { ...findQuery, text: 'not' })
        await beforeAction()
      })
    })
    describe('あり、保存クエリなし', () => {
      it('[未ログイン]パラメータがセットされ、表示される', async () => {
        loggedIn = false
        wrapper = mountFunction(loggedIn, findQuery, null)
        await beforeAction()
      })
      it('[ログイン中]パラメータがセットされ、表示される', async () => {
        loggedIn = true
        wrapper = mountFunction(loggedIn, findQuery, null)
        await beforeAction()
      })
    })
    describe('なし、保存クエリあり', () => {
      it('[未ログイン]保存クエリがセットされ、表示される', async () => {
        loggedIn = false
        wrapper = mountFunction(loggedIn, null, findQuery)
        await beforeAction()
      })
      it('[ログイン中]保存クエリがセットされ、表示される', async () => {
        loggedIn = true
        wrapper = mountFunction(loggedIn, null, findQuery)
        await beforeAction()
      })
    })
  })

  /*
  describe('表示項目', () => {
    it('null', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      expect(wrapper.vm.hiddenItems).toEqual(defaultHiddenItems.split(','))
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
  */

  describe('スペース一覧検索', () => {
    let wrapper: any
    const beforeAction = async (reloading = false) => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1)
      viewTest(wrapper, dataPage1, $t('{total}件（複数）', { total: 5 }), { existInfinite: true, testState: null })

      // スペース一覧検索
      wrapper.vm.$refs.spacesSearch.updateWaiting = vi.fn()
      wrapper.vm.query = findData
      wrapper.vm.reloading = reloading
      await wrapper.vm.searchSpacesList()
      await flushPromises()
    }

    it('[正常]検索結果が更新され、URLが変更される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
      await beforeAction()

      apiCalledTest(2, { ...findParams, page: 1 })
      viewTest(wrapper, dataCount1, $t('{total}件（単数）', { total: 1 }))
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(wrapper.vm.$refs.spacesSearch.updateWaiting, 1, true)
      expect(stateRouteQuery.value).toEqual(findQuery)
      helper.mockCalledTest(mock.navigateTo, 1, { query: findQuery })
    })
    it('[エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
        .mockImplementationOnce(() => [{ ok: false, status: null }, null])
      await beforeAction()

      apiCalledTest(2, { ...findParams, page: 1 })
      viewTest(wrapper, dataPage1, $t('{total}件（複数）', { total: 5 }), { existInfinite: true, testState: null }, true)
      helper.toastMessageTest(mock.toast, { error: $t('network.failure') })
      helper.mockCalledTest(wrapper.vm.$refs.spacesSearch.updateWaiting, 1, false)
      expect(stateRouteQuery.value).toEqual({})
      helper.mockCalledTest(mock.navigateTo, 0)
    })
    it('[再取得中]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
      await beforeAction(true)

      expect(mock.useApiRequest).toBeCalledTimes(1)
      helper.toastMessageTest(mock.toast, { error: $t('system.timeout') })
      helper.mockCalledTest(wrapper.vm.$refs.spacesSearch.updateWaiting, 1, false)
      expect(stateRouteQuery.value).toEqual({})
      helper.mockCalledTest(mock.navigateTo, 0)
    })
  })
})
