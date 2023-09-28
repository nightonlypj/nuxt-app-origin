import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import InfomationsLists from '~/components/infomations/Lists.vue'
import Page from '~/pages/infomations/index.vue'

describe('index.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthSignOut: vi.fn(),
      navigateTo: vi.fn(),
      showError: vi.fn(),
      resetUserInfomationUnreadCount: vi.fn(),
      toast: helper.mockToast
    }
  })

  const mountFunction = (loggedIn = false, user: object | null = null, query = {}, values = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)

    const wrapper = mount(Page, {
      global: {
        stubs: {
          AppLoading: true,
          AppProcessing: true,
          InfomationsLists: true
        },
        mocks: {
          $auth: {
            loggedIn,
            user,
            resetUserInfomationUnreadCount: mock.resetUserInfomationUnreadCount
          },
          $route: {
            query: { ...query }
          },
          $toast: mock.toast
        }
      },
      data () {
        return values
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const dataPage1 = Object.freeze({
    infomation: {
      total_count: 3,
      current_page: 1,
      total_pages: 2,
      limit_value: 2
    },
    infomations: [
      { id: 1 },
      { id: 2 }
    ]
  })
  const dataPage2 = Object.freeze({
    infomation: {
      total_count: 3,
      current_page: 2,
      total_pages: 2,
      limit_value: 2
    },
    infomations: [
      { id: 3 }
    ]
  })

  // テスト内容
  const apiCalledTest = (count: number, params: object = { page: count }) => {
    expect(mock.useApiRequest).toBeCalledTimes(count)
    const url = helper.commonConfig.infomations.listUrl + '?' + new URLSearchParams({ ...params })
    expect(mock.useApiRequest).nthCalledWith(count, helper.envConfig.apiBaseURL + url)
  }

  const viewTest = (wrapper: any, data: any, countView: string) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.vm.$data.page).toBe(data.infomation.current_page)
    expect(wrapper.vm.$data.infomation).toEqual(data.infomation)
    expect(wrapper.vm.$data.infomations).toEqual(data.infomations)

    if (data.infomations?.length === 0) {
      expect(wrapper.text()).toMatch('お知らせはありません。')
    } else {
      expect(wrapper.find('#pagination1').exists()).toBe(data.infomation.total_pages >= 2) // [2頁以上]ページネーション
      expect(wrapper.find('#pagination2').exists()).toBe(data.infomation.total_pages >= 2)
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数、[2頁以上]開始・終了
    expect(wrapper.findComponent(InfomationsLists).exists()).toBe(data.infomations?.length > 0)
  }

  // テストケース
  describe('お知らせ一覧取得', () => {
    it('[0件]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          total_count: 0,
          current_page: 1,
          total_pages: 0,
          limit_value: 2
        }
      })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await helper.sleep(1)

      apiCalledTest(1)
      helper.mockCalledTest(mock.navigateTo, 1, { query: null })
      viewTest(wrapper, data, '')
    })
    it('[1件]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          total_count: 1,
          current_page: 1,
          total_pages: 1,
          limit_value: 2
        },
        infomations: [
          { id: 1 }
        ]
      })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await helper.sleep(1)

      apiCalledTest(1)
      helper.mockCalledTest(mock.navigateTo, 1, { query: null })
      viewTest(wrapper, data, '1件')
    })
    it('[ページネーション]表示される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200 }, dataPage1])
        .mockImplementationOnce(() => [{ ok: true, status: 200 }, dataPage2])
      const wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await helper.sleep(1)

      apiCalledTest(1)
      viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      helper.mockCalledTest(mock.navigateTo, 1, { query: null })

      // ページネーション（2頁目）
      wrapper.vm.$data.page = 2
      wrapper.find('#pagination2').trigger('click') // NOTE: pagination2でも確認
      await helper.sleep(1)

      apiCalledTest(2)
      viewTest(wrapper, dataPage2, '3件中 3-3件を表示')
      helper.mockCalledTest(mock.navigateTo, 2, { query: { page: 2 } })
    })
    describe('データなし', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await helper.sleep(1)

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.navigateTo, 1, { query: null })
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error, notice: null } })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200 }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await helper.sleep(1)

        apiCalledTest(1)
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
        helper.mockCalledTest(mock.navigateTo, 1, { query: null })

        // ページネーション（2頁目）
        wrapper.vm.$data.page = 2
        wrapper.find('#pagination1').trigger('click')
        await helper.sleep(1)

        apiCalledTest(2)
        helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
        helper.mockCalledTest(mock.navigateTo, 2, { query: null })
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      })
    })
    describe('現在ページが異なる', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { ...dataPage1, infomation: { ...dataPage1.infomation, current_page: 9 } }])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await helper.sleep(1)

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.navigateTo, 1, { query: null })
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error, notice: null } })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200 }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200 }, { ...dataPage2, infomation: { ...dataPage2.infomation, current_page: 9 } }])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await helper.sleep(1)

        apiCalledTest(1)
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
        helper.mockCalledTest(mock.navigateTo, 1, { query: null })

        // ページネーション（2頁目）
        wrapper.vm.$data.page = 2
        wrapper.find('#pagination1').trigger('click')
        await helper.sleep(1)

        apiCalledTest(2)
        helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
        helper.mockCalledTest(mock.navigateTo, 2, { query: null })
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await helper.sleep(1)

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.navigateTo, 1, { query: null })
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure, notice: null } })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200 }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: null }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await helper.sleep(1)

        apiCalledTest(1)
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
        helper.mockCalledTest(mock.navigateTo, 1, { query: null })

        // ページネーション（2頁目）
        wrapper.vm.$data.page = 2
        wrapper.find('#pagination1').trigger('click')
        await helper.sleep(1)

        apiCalledTest(2)
        helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
        helper.mockCalledTest(mock.navigateTo, 2, { query: null })
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      })
    })
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await helper.sleep(1)

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.navigateTo, 1, { query: null })
        helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error, notice: null } })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200 }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 500 }, null])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await helper.sleep(1)

        apiCalledTest(1)
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
        helper.mockCalledTest(mock.navigateTo, 1, { query: null })

        // ページネーション（2頁目）
        wrapper.vm.$data.page = 2
        wrapper.find('#pagination1').trigger('click')
        await helper.sleep(1)

        apiCalledTest(2)
        helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
        helper.mockCalledTest(mock.navigateTo, 2, { query: null })
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      })
    })
    describe('その他エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await helper.sleep(1)

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.navigateTo, 1, { query: null })
        helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default, notice: null } })
      })
      it('[ページネーション]元の表示に戻る', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200 }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 404 }, {}])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await helper.sleep(1)

        apiCalledTest(1)
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
        helper.mockCalledTest(mock.navigateTo, 1, { query: null })

        // ページネーション（2頁目）
        wrapper.vm.$data.page = 2
        wrapper.find('#pagination1').trigger('click')
        await helper.sleep(1)

        apiCalledTest(2)
        helper.toastMessageTest(mock.toast, { error: helper.locales.system.default })
        helper.mockCalledTest(mock.navigateTo, 2, { query: null })
        viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
      })
    })
  })

  describe('パラメータあり', () => {
    it('パラメータがセットされ、表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, dataPage2])
      const wrapper = mountFunction(false, null, { page: '2' })
      helper.loadingTest(wrapper, AppLoading)
      await helper.sleep(1)

      apiCalledTest(1, { page: 2 })
      helper.mockCalledTest(mock.navigateTo, 1, { query: { page: 2 } })
      viewTest(wrapper, dataPage2, '3件中 3-3件を表示')
    })
  })

  describe('お知らせの未読数', () => {
    it('[未ログイン]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { ...dataPage1 }])
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, AppLoading)
      await helper.sleep(1)

      apiCalledTest(1)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { query: null })
      helper.mockCalledTest(mock.resetUserInfomationUnreadCount, 0)
      viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
    })
    it('[ログイン中（未読なし）]表示される', async () => {
      const user = Object.freeze({ infomation_unread_count: 0 })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { ...dataPage1, user }])
      const wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, AppLoading)
      await helper.sleep(1)

      apiCalledTest(1)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { query: null })
      helper.mockCalledTest(mock.resetUserInfomationUnreadCount, 1)
      viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
    })
    it('[ログイン中（未読あり）]表示される', async () => {
      const user = Object.freeze({ infomation_unread_count: 1 })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { ...dataPage1, user }])
      const wrapper = mountFunction(true, user)
      helper.loadingTest(wrapper, AppLoading)
      await helper.sleep(1)

      apiCalledTest(1)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { query: null })
      helper.mockCalledTest(mock.resetUserInfomationUnreadCount, 1)
      viewTest(wrapper, dataPage1, '3件中 1-2件を表示')
    })
  })
})
