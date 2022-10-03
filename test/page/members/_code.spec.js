import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import SpacesIcon from '~/components/spaces/Icon.vue'
import MembersSearch from '~/components/members/Search.vue'
import MembersCreate from '~/components/members/Create.vue'
import MembersSetting from '~/components/members/Setting.vue'
import MembersUpdate from '~/components/members/Update.vue'
import MembersLists from '~/components/members/Lists.vue'
import MembersResult from '~/components/members/Result.vue'
import Page from '~/pages/members/_code.vue'

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

  const space = Object.freeze({
    code: 'code0001',
    image_url: {
      small: 'https://example.com/images/space/small_noimage.jpg'
    },
    name: 'スペース1'
  })

  const mountFunction = (loggedIn, query = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        InfiniteLoading: true,
        SpacesIcon: true,
        MembersSearch: true,
        MembersCreate: true,
        MembersSetting: true,
        MembersUpdate: true,
        MembersLists: true,
        MembersResult: true
      },
      mocks: {
        $axios: {
          get: axiosGetMock
        },
        $auth: {
          loggedIn
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
  const data2 = Object.freeze({
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
  const data3 = Object.freeze({
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
  const apiCalledTest = (count, params, page = count) => {
    expect(axiosGetMock).toBeCalledTimes(count)
    const url = helper.commonConfig.membersUrl.replace(':code', space.code)
    expect(axiosGetMock).nthCalledWith(count, helper.envConfig.apiBaseURL + url, { params: { ...params, page } })
  }

  const viewTest = (wrapper, params, data, countView, existInfinite, testState = null) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.query.text).toBe(params.text)
    const power = {}
    for (const key in helper.locales.enums.member.power) {
      power[key] = params[key] === 1
    }
    expect(wrapper.vm.$data.query.power).toEqual(power)
    expect(wrapper.vm.$data.query.sortBy).toBe(params.sort != null ? params.sort : 'invitationed_at')
    expect(wrapper.vm.$data.query.sortDesc).toBe(params.desc === 1)
    expect(wrapper.vm.$data.query.option).toBe(params.queryOption === true)
    expect(wrapper.vm.$data.page).toBe(data.member.current_page)
    expect(wrapper.vm.$data.space).toEqual(data.space)
    expect(wrapper.vm.$data.member).toEqual(data.member)
    expect(wrapper.vm.$data.members).toEqual(data.members)
    expect(wrapper.vm.$data.testState).toBe(testState)

    const membersSearch = wrapper.findComponent(MembersSearch)
    expect(membersSearch.vm.processing).toBe(false)
    expect(membersSearch.vm.query).toEqual(wrapper.vm.$data.query)

    const membersSetting = wrapper.findComponent(MembersSetting)
    expect(membersSetting.vm.showItems).toBe(wrapper.vm.$data.showItems)

    if (data.members?.length === 0) {
      expect(wrapper.text()).toMatch('対象のメンバーが見つかりません。')
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数
    expect(wrapper.findComponent(MembersLists).exists()).toBe(data.members?.length > 0)

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(existInfinite)
    return infiniteLoading
  }

  // テストケース
  describe('未ログイン', () => {
    it('ログインページにリダイレクトされる', () => {
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)
      expect(wrapper.findComponent(Loading).exists()).toBe(true) // Tips: Jestでmiddlewareが実行されない為
    })
  })

  describe('メンバー一覧', () => {
    const power = {}
    for (const key in helper.locales.enums.member.power) {
      power[key] = 1
    }
    const params = Object.freeze({
      text: '',
      ...power,
      sort: 'invitationed_at',
      desc: 1
    })
    it('[0件]表示される', async () => {
      const data = Object.freeze({
        space,
        member: {
          total_count: 0,
          current_page: 1,
          total_pages: 0,
          limit_value: 2
        }
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      viewTest(wrapper, params, data, '', false)
    })
    it('[1件]表示される', async () => {
      const data = Object.freeze({
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
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      viewTest(wrapper, params, data, '1名', false)
    })
    it('[無限スクロール]表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data: data1 }))
        .mockImplementationOnce(() => Promise.resolve({ data: data2 }))
        .mockImplementationOnce(() => Promise.resolve({ data: data3 }))
      const wrapper = mountFunction(true)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      const infiniteLoading = viewTest(wrapper, params, data1, '5名', true)
      const members = data1.members

      // スクロール（2頁目）
      infiniteLoading.vm.$emit('infinite')
      members.push(...data2.members)

      await helper.sleep(1)
      apiCalledTest(2, params)
      viewTest(wrapper, params, { space: data2.space, member: data2.member, members }, '5名', true, 'loaded')

      // スクロール（3頁目）
      infiniteLoading.vm.$emit('infinite')
      members.push(...data3.members)

      await helper.sleep(1)
      apiCalledTest(3, params)
      viewTest(wrapper, params, { space: data3.space, member: data3.member, members }, '5名', false, 'complete')
    })
    describe('データなし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
        const wrapper = mountFunction(true)
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
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', true)

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await helper.sleep(1)

        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', true, 'error')
      })
    })
    describe('スペース情報なし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { ...data1, space: null } }))
        const wrapper = mountFunction(true)
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
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', true)

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await helper.sleep(1)

        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', true, 'error')
      })
    })
    describe('ページ情報なし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { ...data1, member: null } }))
        const wrapper = mountFunction(true)
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
          .mockImplementationOnce(() => Promise.resolve({ data: { ...data2, member: null } }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', true)

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await helper.sleep(1)

        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', true, 'error')
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction(true)
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
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', true)

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await helper.sleep(1)

        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', true, 'error')
      })
    })
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction(true)
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
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', true)

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await helper.sleep(1)

        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', true, 'error')
      })
    })
    describe('その他エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
        const wrapper = mountFunction(true)
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
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', true)

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await helper.sleep(1)

        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', true, 'error')
      })
    })
  })

  describe('パラメータあり', () => {
    const powerQuery = {}
    const powerParams = {}
    for (const key in helper.locales.enums.member.power) {
      powerQuery[key] = '0'
      powerParams[key] = 0
    }
    const query = Object.freeze({
      text: 'test',
      ...powerQuery,
      sort: 'user.name',
      desc: '0'
    })
    const params = Object.freeze({
      text: 'test',
      ...powerParams,
      sort: 'user.name',
      desc: 0
    })
    const data = Object.freeze({
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
    it('[未ログイン]パラメータがセットされ、表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, query)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      viewTest(wrapper, params, data, '1名', false)
    })
    it('[ログイン中]パラメータがセットされ、表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, { ...query, option: '1' })
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      viewTest(wrapper, { ...params, queryOption: true }, data, '1名', false)
    })
  })

  describe('表示項目', () => {
    const data = Object.freeze({
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
    it('null', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.showItems).toBe(null)
    })
    it('空', async () => {
      localStorage.setItem('members.show-items', '')
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.showItems).toEqual([''])
    })
    it('配列', async () => {
      localStorage.setItem('members.show-items', 'test1,test2')
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.showItems).toEqual(['test1', 'test2'])
    })
  })

  describe('メンバー招待（結果）', () => {
    // TODO
  })
})
