import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import InfiniteLoading from 'vue-infinite-loading'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Lists from '~/components/spaces/Lists.vue'
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

  const mountFunction = (loggedIn, query = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        Lists: true,
        InfiniteLoading: true
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
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.text).toBe(params.text)
    expect(wrapper.vm.$data.option).toBe(params.option === 1)
    expect(wrapper.vm.$data.excludeMemberSpace).toBe(params.exclude_member_space === 1)
    expect(wrapper.vm.$data.page).toBe(data.space.current_page)
    expect(wrapper.vm.$data.space).toEqual(data.space)
    expect(wrapper.vm.$data.spaces).toEqual(data.spaces)
    expect(wrapper.vm.$data.testState).toBe(testState)

    // console.log(wrapper.text())
    if (data.spaces?.length === 0) {
      expect(wrapper.text()).toMatch('スペースが見つかりません。')
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数
    expect(wrapper.findComponent(Lists).exists()).toBe(data.spaces?.length > 0)

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(existInfinite)
    return infiniteLoading
  }

  const optionViewText = (wrapper, exist) => {
    // console.log(wrapper.html())
    const optionBtn = wrapper.find('#option_btn')
    expect(optionBtn.exists()).toBe(exist)
    expect(wrapper.find('#option_item').exists()).toBe(exist)
    return optionBtn
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
    it('[無限スクロール]表示される', async () => {
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

      // スクロール（1回目）
      infiniteLoading.vm.$emit('infinite')
      spaces.push(...data2.spaces)
      await helper.sleep(1)

      apiCalledTest(2, params)
      viewTest(wrapper, params, { space: data2.space, spaces }, '5件', true, 'loaded')

      // スクロール（2回目）
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
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: locales.system.error })
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

        // スクロール（1回目）
        infiniteLoading.vm.$emit('infinite')
        await helper.sleep(1)

        helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5件', true, 'error')
      })
    })
    describe('ページ情報なし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { space: null } }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: locales.system.error })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: data1 }))
          .mockImplementationOnce(() => Promise.resolve({ data: { space: null } }))
        const wrapper = mountFunction(false)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5件', true)

        // スクロール（1回目）
        infiniteLoading.vm.$emit('infinite')
        await helper.sleep(1)

        helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
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
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: locales.network.failure })
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

        // スクロール（1回目）
        infiniteLoading.vm.$emit('infinite')
        await helper.sleep(1)

        helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
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
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: locales.network.error })
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

        // スクロール（1回目）
        infiniteLoading.vm.$emit('infinite')
        await helper.sleep(1)

        helper.mockCalledTest(toastedErrorMock, 1, locales.network.error)
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
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: locales.system.default })
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

        // スクロール（1回目）
        infiniteLoading.vm.$emit('infinite')
        await helper.sleep(1)

        helper.mockCalledTest(toastedErrorMock, 1, locales.system.default)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5件', true, 'error')
      })
    })
  })

  describe('検索', () => {
    const params1 = Object.freeze({
      text: '',
      exclude_member_space: 0
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
    it('[未ログイン]検索オプションが表示されない。検索結果が表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data: data1 }))
        .mockImplementationOnce(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params1)
      viewTest(wrapper, params1, data1, '5件', true)
      optionViewText(wrapper, false)

      // テキスト入力
      const params = Object.freeze({
        text: 'test',
        exclude_member_space: 0
      })
      const text = wrapper.find('#search_text')
      expect(text.exists()).toBe(true)
      text.setValue(params.text)

      // 検索ボタン
      await helper.sleep(1)
      const button = wrapper.find('#search_btn')
      expect(button.exists()).toBe(true)
      expect(button.vm.disabled).toBe(false) // 有効
      button.trigger('click')

      await helper.sleep(1)
      apiCalledTest(2, params, 1)
      viewTest(wrapper, params, data, '1件', false)
      helper.mockCalledTest(routerPushMock, 1, { query: { ...params, option: 0 } }) // URLが変更される
    })
    it('[ログイン中]検索オプションが表示される。検索結果が表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data: data1 }))
        .mockImplementationOnce(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params1)
      viewTest(wrapper, params1, data1, '5件', true)
      const optionBtn = optionViewText(wrapper, true)

      // テキスト入力
      const params = Object.freeze({
        text: 'test',
        exclude_member_space: 1
      })
      const text = wrapper.find('#search_text')
      expect(text.exists()).toBe(true)
      text.setValue(params.text)

      // 検索オプション開く
      optionBtn.trigger('click')

      // 検索オプション変更
      const check = wrapper.find('#exclude_member_space_check')
      expect(check.exists()).toBe(true)
      check.setChecked()

      // 検索ボタン
      await helper.sleep(1)
      const button = wrapper.find('#search_btn')
      expect(button.exists()).toBe(true)
      expect(button.vm.disabled).toBe(false) // 有効

      // Enter(検索)
      text.trigger('keydown.enter')
      text.trigger('keyup.enter')

      await helper.sleep(1)
      apiCalledTest(2, params, 1)
      viewTest(wrapper, { ...params, option: 1 }, data, '1件', false)
      helper.mockCalledTest(routerPushMock, 1, { query: { ...params, option: 1 } }) // URLが変更される
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
      const wrapper = mountFunction(true, query)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      viewTest(wrapper, params, data, '1件', false)
    })
  })
})
