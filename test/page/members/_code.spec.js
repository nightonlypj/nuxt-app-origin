import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ListSetting from '~/components/ListSetting.vue'
import ListDownload from '~/components/ListDownload.vue'
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

describe('_code.vue', () => {
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

  const values = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  const mountFunction = (loggedIn = true, query = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        InfiniteLoading: true,
        Loading: true,
        Processing: true,
        Message: true,
        ListSetting: true,
        ListDownload: true,
        SpacesIcon: true,
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
        $nuxt: {
          error: nuxtErrorMock
        },
        $router: {
          push: routerPushMock
        }
      },
      data () {
        return { ...values }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const defaultPowerParams = {}
  const findPowerParams = {}
  const findPowerQuery = {}
  const findPower = {}
  for (const key in helper.locales.enums.member.power) {
    defaultPowerParams[key] = 1
    findPowerParams[key] = 0
    findPowerQuery[key] = String(findPowerParams[key])
    findPower[key] = findPowerQuery[key] !== '0'
  }

  const defaultParams = Object.freeze({
    text: '',
    ...defaultPowerParams,
    sort: 'invitationed_at',
    desc: 1
  })

  const findParams = Object.freeze({
    text: 'test',
    ...findPowerParams,
    sort: 'user.name',
    desc: 0
  })
  const findQuery = Object.freeze({
    text: findParams.text,
    ...findPowerQuery,
    sort: findParams.sort,
    desc: String(findParams.desc)
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
  const apiCalledTest = (count, params, page = count) => {
    expect(axiosGetMock).toBeCalledTimes(count)
    const url = helper.commonConfig.membersUrl.replace(':code', space.code)
    expect(axiosGetMock).nthCalledWith(count, helper.envConfig.apiBaseURL + url, { params: { ...params, page } })
  }

  const viewTest = (wrapper, params, data, countView, admin = false, show = { existInfinite: false, testState: null }, error = false) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    helper.messageTest(wrapper, Message, values)

    expect(wrapper.vm.$data.query.text).toBe(params.text)
    const power = {}
    for (const key in helper.locales.enums.member.power) {
      power[key] = params[key] === 1
    }
    expect(wrapper.vm.$data.query.power).toEqual(power)
    expect(wrapper.vm.$data.query.sortBy).toBe(params.sort != null ? params.sort : 'invitationed_at')
    expect(wrapper.vm.$data.query.sortDesc).toBe(params.desc === 1)
    expect(wrapper.vm.$data.query.option).toBe(params.queryOption === true)
    expect(wrapper.vm.$data.error).toBe(error)
    expect(wrapper.vm.$data.testState).toBe(show.testState)
    expect(wrapper.vm.$data.page).toBe(data.member.current_page)
    expect(wrapper.vm.$data.space).toEqual(data.space)
    expect(wrapper.vm.$data.member).toEqual(data.member)
    expect(wrapper.vm.$data.members).toEqual(data.members)

    const spacesIcon = wrapper.findComponent(SpacesIcon)
    expect(spacesIcon.vm.space).toEqual(wrapper.vm.$data.space)

    // 設定
    const listSetting = wrapper.findComponent(ListSetting)
    expect(listSetting.vm.model).toBe('member')
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
    const listDownload = wrapper.findComponent(ListDownload)
    if (admin) {
      expect(membersCreate.exists()).toBe(true)
      expect(membersCreate.vm.space).toEqual(wrapper.vm.$data.space)
      expect(membersUpdate.exists()).toBe(true)
      expect(listDownload.exists()).toBe(true)
      expect(listDownload.vm.model).toBe('member')
      expect(listDownload.vm.space).toEqual(wrapper.vm.$data.space)
      expect(listDownload.vm.searchParams).toEqual(wrapper.vm.$route.query)
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
      expect(membersLists.vm.sortBy).toBe(wrapper.vm.$data.query.sortBy)
      expect(membersLists.vm.sortDesc).toBe(wrapper.vm.$data.query.sortDesc)
      expect(membersLists.vm.members).toBe(wrapper.vm.$data.members)
      expect(membersLists.vm.selectedMembers).toBe(wrapper.vm.$data.selectedMembers)
      expect(membersLists.vm.hiddenItems).toBe(wrapper.vm.$data.hiddenItems)
      expect(membersLists.vm.currentMemberAdmin).toBe(wrapper.vm.currentMemberAdmin)
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(show.existInfinite)
    return infiniteLoading
  }

  // テストケース
  describe('未ログイン', () => {
    it('ログインページにリダイレクトされる', () => {
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)
      expect(wrapper.findComponent(Loading).exists()).toBe(true) // NOTE: Jestでmiddlewareが実行されない為
    })
  })

  describe('メンバー一覧', () => {
    describe('0件', () => {
      it('[管理者]表示される（招待・変更・ダウンロードも含む）', async () => {
        const data = Object.freeze({ ...dataCount0, space: adminSpace })
        axiosGetMock = jest.fn(() => Promise.resolve({ data }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        viewTest(wrapper, defaultParams, data, '', true)
      })
      it('[管理者以外]表示される（招待・変更・ダウンロードを除く）', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: dataCount1 }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        viewTest(wrapper, defaultParams, dataCount1, '', false)
      })
    })
    describe('1件', () => {
      it('[管理者]表示される（招待・変更・ダウンロード・削除・結果も含む）', async () => {
        const data = Object.freeze({ ...dataCount1, space: adminSpace })
        axiosGetMock = jest.fn(() => Promise.resolve({ data }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        viewTest(wrapper, defaultParams, data, '1名', true)

        // 選択
        wrapper.vm.selectedMembers = [data.members[0]]

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
      it('[管理者以外]表示される（招待・変更・ダウンロードを除く）', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: dataCount1 }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        viewTest(wrapper, defaultParams, dataCount1, '1名', false)
      })
    })
    describe('無限スクロール', () => {
      let wrapper, infiniteLoading
      const beforeAction = async (uid1, uid2, uid3 = null) => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1, headers: { uid: uid1 } }))
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage2, headers: { uid: uid2 } }))
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage3, headers: { uid: uid3 } }))
        wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        infiniteLoading = viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: null })
      }
      const completeTestAction = async () => {
        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, defaultParams)
        const members = dataPage1.members.concat(dataPage2.members)
        infiniteLoading = viewTest(wrapper, defaultParams, { ...dataPage2, members }, '5名', false, { existInfinite: true, testState: 'loaded' })

        // スクロール（3頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(3, defaultParams)
        viewTest(wrapper, defaultParams, { ...dataPage3, members: members.concat(dataPage3.members) }, '5名', false, { existInfinite: false, testState: 'complete' })
      }
      const reloadTestAction = async () => {
        const count = window.location.reload.mock.calls.length

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        helper.mockCalledTest(window.location.reload, count + 1)

        apiCalledTest(2, defaultParams)
        viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: 'error' }, true)
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
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        const infiniteLoading = viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, defaultParams)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: 'error' }, true)
      })
    })
    describe('スペース情報なし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { ...dataPage1, space: null } }))
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
          .mockImplementationOnce(() => Promise.resolve({ data: { ...dataPage2, space: null } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        const infiniteLoading = viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, defaultParams)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: 'error' }, true)
      })
    })
    describe('現在ページが異なる', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { ...dataPage1, member: { ...dataPage1.member, current_page: 9 } } }))
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
          .mockImplementationOnce(() => Promise.resolve({ data: { ...dataPage2, member: { ...dataPage2.member, current_page: 9 } } }))
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        const infiniteLoading = viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, defaultParams)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: 'error' }, true)
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
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        const infiniteLoading = viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, defaultParams)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
        helper.mockCalledTest(toastedInfoMock, 0)
        viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: 'error' }, true)
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
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        const infiniteLoading = viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, defaultParams)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
        helper.mockCalledTest(toastedInfoMock, 0)
        viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: 'error' }, true)
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
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1, defaultParams)
        const infiniteLoading = viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: null })

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2, defaultParams)
        helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
        helper.mockCalledTest(toastedInfoMock, 0)
        viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: 'error' }, true)
      })
    })
  })

  describe('パラメータあり', () => {
    it('パラメータがセットされ、表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataCount1 }))
      const wrapper = mountFunction(true, { ...findQuery, option: '1' })
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, findParams)
      viewTest(wrapper, { ...findParams, queryOption: true }, dataCount1, '1名')
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
      localStorage.setItem('member.hidden-items', '')
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual([''])
    })
    it('配列', async () => {
      localStorage.setItem('member.hidden-items', 'test1,test2')
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage1 }))
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      expect(wrapper.vm.$data.hiddenItems).toEqual(['test1', 'test2'])
    })
  })

  describe('メンバー一覧検索', () => {
    let wrapper
    const beforeAction = async () => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, defaultParams)
      viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: null })

      // メンバー一覧検索
      wrapper.vm.$refs.search.error = jest.fn()
      wrapper.vm.$data.query = {
        text: findQuery.text,
        power: findPower,
        sortBy: findQuery.sort,
        sortDesc: findQuery.desc !== '0',
        option: false
      }
      await wrapper.vm.searchMembers()

      await helper.sleep(1)
      apiCalledTest(2, findParams, 1)
    }

    it('[正常]検索結果が更新され、URLが変更される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
        .mockImplementationOnce(() => Promise.resolve({ data: dataCount1 }))
      await beforeAction()

      viewTest(wrapper, findParams, dataCount1, '1名')
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(wrapper.vm.$refs.search.error, 0)
      helper.mockCalledTest(routerPushMock, 1, { query: { ...findParams, option: 0 } })
    })
    it('[エラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
        .mockImplementationOnce(() => Promise.reject({ response: null }))
      await beforeAction()

      viewTest(wrapper, findParams, dataPage1, '5名', false, { existInfinite: true, testState: null }, true)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(wrapper.vm.$refs.search.error, 1)
      helper.mockCalledTest(routerPushMock, 1, { query: { ...findParams, option: 0 } })
    })
  })

  describe('処理', () => {
    let wrapper
    const beforeAction = async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: dataPage1 }))
      wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1, defaultParams)
      viewTest(wrapper, defaultParams, dataPage1, '5名', false, { existInfinite: true, testState: null })
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
