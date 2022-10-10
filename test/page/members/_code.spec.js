import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import ListSetting from '~/components/ListSetting.vue'
import SpacesIcon from '~/components/spaces/Icon.vue'
import MembersSearch from '~/components/members/Search.vue'
import MembersCreate from '~/components/members/Create.vue'
import MembersUpdate from '~/components/members/Update.vue'
import MembersDelete from '~/components/members/Delete.vue'
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
  const adminSpace = Object.freeze({
    ...space,
    current_member: {
      power: 'admin'
    }
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
        ListSetting: true,
        MembersSearch: true,
        MembersCreate: true,
        MembersUpdate: true,
        MembersDelete: true,
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

  const viewTest = (wrapper, params, data, countView, admin = false, show = { existInfinite: false, testState: null }) => {
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
    expect(wrapper.vm.$data.testState).toBe(show.testState)

    const spacesIcon = wrapper.findComponent(SpacesIcon)
    expect(spacesIcon.vm.space).toEqual(wrapper.vm.$data.space)

    // 設定
    const listSetting = wrapper.findComponent(ListSetting)
    expect(listSetting.vm.hiddenItems).toBe(wrapper.vm.$data.hiddenItems)
    expect(listSetting.vm.admin).toBe(admin)

    // 検索
    const membersSearch = wrapper.findComponent(MembersSearch)
    expect(membersSearch.vm.processing).toBe(false)
    expect(membersSearch.vm.query).toEqual(wrapper.vm.$data.query)
    expect(membersSearch.vm.admin).toBe(admin)

    // 招待・変更・解除
    const membersCreate = wrapper.findComponent(MembersCreate)
    const membersUpdate = wrapper.findComponent(MembersUpdate)
    if (admin) {
      expect(membersCreate.exists()).toBe(true)
      expect(membersCreate.vm.space).toEqual(wrapper.vm.$data.space)
      expect(membersUpdate.exists()).toBe(true)
    } else {
      expect(membersCreate.exists()).toBe(false)
      expect(membersUpdate.exists()).toBe(false)
    }
    expect(wrapper.findComponent(MembersDelete).exists()).toBe(false)
    expect(wrapper.findComponent(MembersResult).exists()).toBe(false)

    // 一覧
    if (data.members?.length === 0) {
      expect(wrapper.text()).toMatch('対象のメンバーが見つかりません。')
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数
    expect(wrapper.findComponent(MembersLists).exists()).toBe(data.members?.length > 0)

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(show.existInfinite)
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
    describe('0件', () => {
      const member = Object.freeze({
        total_count: 0,
        current_page: 1,
        total_pages: 0,
        limit_value: 2
      })
      it('[管理者]表示される（招待・変更も含む）', async () => {
        const data = Object.freeze({ space: adminSpace, member })
        axiosGetMock = jest.fn(() => Promise.resolve({ data }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        viewTest(wrapper, params, data, '', true)
      })
      it('[管理者以外]表示される（招待・変更を除く）', async () => {
        const data = Object.freeze({ space, member })
        axiosGetMock = jest.fn(() => Promise.resolve({ data }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        viewTest(wrapper, params, data, '', false)
      })
    })
    describe('1件', () => {
      const member = Object.freeze({
        total_count: 1,
        current_page: 1,
        total_pages: 1,
        limit_value: 2
      })
      const members = Object.freeze([
        { user: { code: 'code000000000000000000001' } }
      ])
      it('[管理者]表示される（招待・変更・削除・結果も含む）', async () => {
        const data = Object.freeze({ space: adminSpace, member, members })
        axiosGetMock = jest.fn(() => Promise.resolve({ data }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        viewTest(wrapper, params, data, '1名', true)

        // 選択
        wrapper.vm.selectedMembers = [members[0].user.code]

        // 削除
        await helper.sleep(1)
        const membersDelete = wrapper.findComponent(MembersDelete)
        expect(membersDelete.exists()).toBe(true)
        expect(membersDelete.vm.space).toEqual(wrapper.vm.$data.space)
        expect(membersDelete.vm.selectedMembers).toEqual(wrapper.vm.$data.selectedMembers)

        // 結果
        wrapper.vm.createResult = {}
        wrapper.vm.tabPage = 'result'

        await helper.sleep(1)
        const membersResult = wrapper.findComponent(MembersResult)
        expect(membersResult.exists()).toBe(true)
        expect(membersResult.vm.result).toEqual(wrapper.vm.$data.createResult)
      })
      it('[管理者以外]表示される（招待・変更を除く）', async () => {
        const data = Object.freeze({ space, member, members })
        axiosGetMock = jest.fn(() => Promise.resolve({ data }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        viewTest(wrapper, params, data, '1名', false)
      })
    })
    describe('無限スクロール', () => {
      it('スクロールで最終頁まで表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: data1 }))
          .mockImplementationOnce(() => Promise.resolve({ data: data2 }))
          .mockImplementationOnce(() => Promise.resolve({ data: data3 }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, params)
        let infiniteLoading = viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: null })
        const members = data1.members

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        members.push(...data2.members)

        await helper.sleep(1)
        apiCalledTest(2, params)
        const data12 = { space: data2.space, member: data2.member, members }
        infiniteLoading = viewTest(wrapper, params, data12, '5名', false, { existInfinite: true, testState: 'loaded' })

        // スクロール（3頁目）
        infiniteLoading.vm.$emit('infinite')
        members.push(...data3.members)

        await helper.sleep(1)
        apiCalledTest(3, params)
        const data123 = { space: data3.space, member: data3.member, members }
        viewTest(wrapper, params, data123, '5名', false, { existInfinite: false, testState: 'complete' })
      })
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
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, params)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: 'error' })
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
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, params)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: 'error' })
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
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, params)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: 'error' })
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
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, params)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: 'error' })
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
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, params)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: 'error' })
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
        const infiniteLoading = viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, params)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(routerPushMock, 0)
        viewTest(wrapper, params, data1, '5名', false, { existInfinite: true, testState: 'error' })
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
      viewTest(wrapper, params, data, '1名')
    })
    it('[ログイン中]パラメータがセットされ、表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, { ...query, option: '1' })
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, params)
      viewTest(wrapper, { ...params, queryOption: true }, data, '1名')
    })
  })

  describe('表示項目', () => {
    it('null', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual([])
    })
    it('空', async () => {
      localStorage.setItem('members.hidden-items', '')
      axiosGetMock = jest.fn(() => Promise.resolve({ data1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual([''])
    })
    it('配列', async () => {
      localStorage.setItem('members.hidden-items', 'test1,test2')
      axiosGetMock = jest.fn(() => Promise.resolve({ data1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual(['test1', 'test2'])
    })
  })
})
