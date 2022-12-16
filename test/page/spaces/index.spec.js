import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import ListSetting from '~/components/ListSetting.vue'
import SpacesSearch from '~/components/spaces/Search.vue'
import SpacesLists from '~/components/spaces/Lists.vue'
import Page from '~/pages/spaces/index.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('index.vue', () => {
  let axiosGetMock, toastedErrorMock, toastedInfoMock, nuxtErrorMock, routerPushMock

  beforeEach(() => {
    axiosGetMock = null
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    nuxtErrorMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const beforeLocation = window.location
  beforeAll(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: { reload: jest.fn() } })
  })
  afterAll(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: beforeLocation })
  })

  const mountFunction = (loggedIn = false, query = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        InfiniteLoading: true,
        Loading: true,
        Processing: true,
        ListSetting: true,
        SpacesSearch: true,
        SpacesLists: true
      },
      mocks: {
        $axios: {
          get: axiosGetMock
        },
        $auth: {
          loggedIn
        },
        $route: {
          query: { ...query }
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        },
        $nuxt: {
          error: nuxtErrorMock
        },
        $router: {
          push: routerPushMock
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  let optionParams = {}
  let optionQuery = {}
  if (helper.commonConfig.enablePublicSpace) {
    optionParams = {
      public: 1,
      private: 1,
      join: 1,
      nojoin: 1
    }
    optionQuery = {
      public: String(optionParams.public),
      private: String(optionParams.private),
      join: String(optionParams.join),
      nojoin: String(optionParams.nojoin)
    }
  }
  const defaultParams = Object.freeze({
    text: '',
    ...optionParams,
    active: 1,
    destroy: 0
  })
  const defaultQuery = Object.freeze({
    ...defaultParams,
    ...optionQuery,
    active: String(defaultParams.active),
    destroy: String(defaultParams.destroy),
    option: '0'
  })

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
      nojoin: String(optionParams.nojoin),
    }
  }
  const findParams = Object.freeze({
    text: 'test',
    ...optionParams,
    active: 1,
    destroy: 0
  })
  const findQuery = Object.freeze({
    ...findParams,
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
  const apiCalledTest = (count, params, page = count) => {
    expect(axiosGetMock).toBeCalledTimes(count)
    expect(axiosGetMock).nthCalledWith(count, helper.envConfig.apiBaseURL + helper.commonConfig.spacesUrl, {
      params: {
        ...params,
        page
      }
    })
  }

  const viewTest = (wrapper, params, query, data, countView, show = { existInfinite: false, testState: null }, error = false) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    let optionQuery = {}
    if (helper.commonConfig.enablePublicSpace) {
      optionQuery = {
        public: params.public === 1,
        private: params.private === 1,
        join: params.join === 1,
        nojoin: params.nojoin === 1
      }
    }
    expect(wrapper.vm.$data.query).toEqual({
      ...params,
      ...optionQuery,
      active: params.active === 1,
      destroy: params.destroy === 1,
      option: query.option === '1'
    })
    expect(wrapper.vm.$data.error).toBe(error)
    expect(wrapper.vm.$data.testState).toBe(show.testState)
    expect(wrapper.vm.$data.page).toBe(data.space.current_page)
    expect(wrapper.vm.$data.space).toEqual(data.space)
    expect(wrapper.vm.$data.spaces).toEqual(data.spaces)

    // 設定
    const listSetting = wrapper.findComponent(ListSetting)
    expect(listSetting.vm.hiddenItems).toBe(wrapper.vm.$data.hiddenItems)

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

  const infiniteErrorTest = async (alert, notice) => {
    const wrapper = mountFunction()
    helper.loadingTest(wrapper, Loading)

    await helper.sleep(1)
    apiCalledTest(1, defaultParams)
    const infiniteLoading = viewTest(wrapper, defaultParams, defaultQuery, dataPage1, '5件', { existInfinite: true, testState: null })

    // スクロール（2頁目）
    infiniteLoading.vm.$emit('infinite')

    await helper.sleep(1)
    apiCalledTest(2, defaultParams)
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
    viewTest(wrapper, defaultParams, defaultQuery, dataPage1, '5件', { existInfinite: true, testState: 'error' }, true)
  }

  // テストケース
  describe('スペース一覧取得', () => {
    it('[0件]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataCount0 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, defaultParams)
      viewTest(wrapper, defaultParams, defaultQuery, dataCount0, '')
    })
    it('[1件]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataCount1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, defaultParams)
      viewTest(wrapper, defaultParams, defaultQuery, dataCount1, '1件')
    })
    describe('無限スクロール', () => {
      let wrapper, infiniteLoading
      const beforeAction = async (loggedIn, uid1, uid2, uid3 = null) => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1, headers: { uid: uid1 } }))
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage2, headers: { uid: uid2 } }))
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage3, headers: { uid: uid3 } }))
        wrapper = mountFunction(loggedIn)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        infiniteLoading = viewTest(wrapper, defaultParams, defaultQuery, dataPage1, '5件', { existInfinite: true, testState: null })
      }
      const completeTestAction = async () => {
        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, defaultParams)
        const spaces = dataPage1.spaces.concat(dataPage2.spaces)
        viewTest(wrapper, defaultParams, defaultQuery, { ...dataPage2, spaces }, '5件', { existInfinite: true, testState: 'loaded' })

        // スクロール（3頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(3, defaultParams)
        viewTest(wrapper, defaultParams, defaultQuery, { ...dataPage3, spaces: spaces.concat(dataPage3.spaces) }, '5件', { existInfinite: false, testState: 'complete' })
      }
      const reloadTestAction = async () => {
        const count = window.location.reload.mock.calls.length

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        helper.mockCalledTest(window.location.reload, count + 1)

        apiCalledTest(2, defaultParams)
        viewTest(wrapper, defaultParams, defaultQuery, dataPage1, '5件', { existInfinite: true, testState: 'error' }, true)
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
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
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
    describe('現在ページが異なる', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { ...dataPage1, space: { ...dataPage1.space, current_page: 9 } } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.resolve({ data: { ...dataPage2, space: { ...dataPage2.space, current_page: 9 } } }))
        await infiniteErrorTest(helper.locales.system.error, null)
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
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
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
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

  describe('パラメータあり', () => {
    it('[未ログイン]パラメータがセットされ、表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataCount1 }))
      const wrapper = mountFunction(false, findQuery)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, findParams)
      viewTest(wrapper, findParams, findQuery, dataCount1, '1件')
    })
    it('[ログイン中]パラメータがセットされ、表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataCount1 }))
      const wrapper = mountFunction(true, findQuery)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, findParams)
      viewTest(wrapper, findParams, findQuery, dataCount1, '1件')
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
      localStorage.setItem('space.hidden-items', '')
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual([''])
    })
    it('配列', async () => {
      localStorage.setItem('space.hidden-items', 'test1,test2')
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual(['test1', 'test2'])
    })
  })

  describe('スペース一覧検索', () => {
    let wrapper
    const beforeAction = async () => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, defaultParams)
      viewTest(wrapper, defaultParams, defaultQuery, dataPage1, '5件', { existInfinite: true, testState: null })

      // スペース一覧検索
      wrapper.vm.$refs.search.error = jest.fn()
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
        ...findParams,
        ...optionQuery,
        active: findParams.active === 1,
        destroy: findParams.destroy === 1,
        option: findQuery.option === '1'
      }
      await wrapper.vm.searchSpaces()

      await helper.sleep(1)
      apiCalledTest(2, findParams, 1)
    }

    it('[正常]検索結果が更新され、URLが変更される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
        .mockImplementationOnce(() => Promise.resolve({ data: dataCount1 }))
      await beforeAction()

      viewTest(wrapper, findParams, findQuery, dataCount1, '1件')
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(wrapper.vm.$refs.search.error, 0)
      helper.mockCalledTest(routerPushMock, 1, { query: findQuery })
    })
    it('[エラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
        .mockImplementationOnce(() => Promise.reject({ response: null }))
      await beforeAction()

      viewTest(wrapper, findParams, findQuery, dataPage1, '5件', { existInfinite: true, testState: null }, true)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(wrapper.vm.$refs.search.error, 1)
      helper.mockCalledTest(routerPushMock, 1, { query: findQuery })
    })
  })
})
