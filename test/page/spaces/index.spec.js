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
  let axiosGetMock, toastedErrorMock, toastedInfoMock, routerPushMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
    nuxtErrorMock = jest.fn()
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
        $router: {
          push: routerPushMock
        },
        $nuxt: {
          error: nuxtErrorMock
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const data1 = Object.freeze({
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
  const data2 = Object.freeze({
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
  const data3 = Object.freeze({
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
    expect(axiosGetMock).nthCalledWith(count, helper.envConfig.apiBaseURL + helper.commonConfig.spacesUrl, { params: { ...params, page } })
  }

  const viewTest = (wrapper, params, data, countView, existInfinite, testState = null) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.query.text).toBe(params.text)
    expect(wrapper.vm.$data.query.excludeMemberSpace).toBe(params.exclude_member_space === 1)
    expect(wrapper.vm.$data.query.option).toBe(params.queryOption === true)
    expect(wrapper.vm.$data.page).toBe(data.space.current_page)
    expect(wrapper.vm.$data.space).toEqual(data.space)
    expect(wrapper.vm.$data.spaces).toEqual(data.spaces)
    expect(wrapper.vm.$data.testState).toBe(testState)

    // 設定
    const listSetting = wrapper.findComponent(ListSetting)
    expect(listSetting.vm.hiddenItems).toBe(wrapper.vm.$data.hiddenItems)

    // 検索
    const spacesSearch = wrapper.findComponent(SpacesSearch)
    expect(spacesSearch.vm.processing).toBe(false)
    expect(spacesSearch.vm.query).toEqual(wrapper.vm.$data.query)

    // 一覧
    if (data.spaces?.length === 0) {
      expect(wrapper.text()).toMatch('スペースが見つかりません。')
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数
    expect(wrapper.findComponent(SpacesLists).exists()).toBe(data.spaces?.length > 0)

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(existInfinite)
    return infiniteLoading
  }

  // テストケース
  describe('スペース一覧', () => {
    const params = Object.freeze({
      text: '',
      exclude_member_space: 0
    })
    it('[0件]表示される', async () => {
      const data = Object.freeze({
        space: {
          total_count: 0,
          current_page: 1,
          total_pages: 0,
          limit_value: 2
        }
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      viewTest(wrapper, params, data, '', false)
    })
    it('[1件]表示される', async () => {
      const data = Object.freeze({
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
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      viewTest(wrapper, params, data, '1件', false)
    })
    it('[無限スクロール]スクロールで最終頁まで表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data: data1 }))
        .mockImplementationOnce(() => Promise.resolve({ data: data2 }))
        .mockImplementationOnce(() => Promise.resolve({ data: data3 }))
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      const infiniteLoading = viewTest(wrapper, params, data1, '5件', true)
      const spaces = data1.spaces

      // スクロール（2頁目）
      infiniteLoading.vm.$emit('infinite')
      spaces.push(...data2.spaces)

      await helper.sleep(1)
      apiCalledTest(2, params)
      viewTest(wrapper, params, { space: data2.space, spaces }, '5件', true, 'loaded')

      // スクロール（3頁目）
      infiniteLoading.vm.$emit('infinite')
      spaces.push(...data3.spaces)

      await helper.sleep(1)
      apiCalledTest(3, params)
      viewTest(wrapper, params, { space: data3.space, spaces }, '5件', false, 'complete')
    })
    describe('データなし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: data1 }))
          .mockImplementationOnce(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5件', true)

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, params)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5件', true, 'error')
      })
    })
    describe('ページ情報なし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { ...data1, space: null } }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: data1 }))
          .mockImplementationOnce(() => Promise.resolve({ data: { ...data2, space: null } }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5件', true)

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, params)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5件', true, 'error')
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.network.failure })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: data1 }))
          .mockImplementationOnce(() => Promise.reject({ response: null }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5件', true)

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, params)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5件', true, 'error')
      })
    })
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: helper.locales.network.error })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: data1 }))
          .mockImplementationOnce(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5件', true)

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, params)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5件', true, 'error')
      })
    })
    describe('その他エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: helper.locales.system.default })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: data1 }))
          .mockImplementationOnce(() => Promise.reject({ response: { status: 400, data: {} } }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5件', true)

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, params)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5件', true, 'error')
      })
    })
  })

  describe('パラメータあり', () => {
    const query = Object.freeze({
      text: 'test',
      exclude_member_space: '1'
    })
    const params = Object.freeze({
      text: 'test',
      exclude_member_space: 1
    })
    const data = Object.freeze({
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
    it('[未ログイン]パラメータがセットされ、表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false, query)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      viewTest(wrapper, params, data, '1件', false)
    })
    it('[ログイン中]パラメータがセットされ、表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, { ...query, option: '1' })
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      viewTest(wrapper, { ...params, queryOption: true }, data, '1件', false)
    })
  })

  describe('表示項目', () => {
    const data = Object.freeze({
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
    it('null', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual([])
    })
    it('空', async () => {
      localStorage.setItem('spaces.hidden-items', '')
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual([''])
    })
    it('配列', async () => {
      localStorage.setItem('spaces.hidden-items', 'test1,test2')
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual(['test1', 'test2'])
    })
  })
})
