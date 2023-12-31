import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import InfiniteLoading from 'v3-infinite-loading'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import DownloadsLists from '~/components/downloads/Lists.vue'
import Page from '~/pages/downloads.vue'
import { activeUser } from '~/test/data/user'
import { dataCount0, dataCount1, dataPage1, dataPage2, dataPage3, dataPageTo2, dataPageTo3, dataPageMiss1, dataPageMiss2 } from '~/test/data/downloads'

describe('downloads.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      showError: vi.fn(),
      updateUserUndownloadedCount: vi.fn(),
      toast: helper.mockToast,
      headers: { get: vi.fn((key: string) => key === 'uid' ? '1' : null) }
    }
  })
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  const fullPath = '/downloads'

  const mountFunction = (loggedIn = true, user: object | null = activeUser, query: object | null = null, values = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn,
        user,
        updateUserUndownloadedCount: mock.updateUserUndownloadedCount
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({
      fullPath,
      query: { ...query }
    })))

    const wrapper: any = mount(Page, {
      global: {
        stubs: {
          InfiniteLoading: true,
          AppLoading: true,
          AppProcessing: true,
          AppMessage: true,
          DownloadsLists: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    for (const [key, value] of Object.entries(values)) { wrapper.vm[key] = value }
    return wrapper
  }

  // テスト内容
  const apiCalledTest = (count: number, params: any = { page: count }) => {
    expect(mock.useApiRequest).toBeCalledTimes(count)
    expect(mock.useApiRequest).nthCalledWith(count, helper.envConfig.apiBaseURL + helper.commonConfig.downloads.listUrl, 'GET', params)
  }

  const viewTest = (wrapper: any, data: any, countView: string, messages = {}, show: any = { existInfinite: false, testState: null }, error = false) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    helper.messageTest(wrapper, AppMessage, messages)

    expect(wrapper.vm.error).toBe(error)
    expect(wrapper.vm.testState).toBe(show.testState)
    expect(wrapper.vm.page).toBe(data.download.current_page)
    expect(wrapper.vm.download).toEqual(data.download)
    expect(wrapper.vm.downloads).toEqual(data.downloads)

    // 一覧
    const downloadsLists = wrapper.findComponent(DownloadsLists)
    if (data.downloads == null || data.downloads.length === 0) {
      expect(wrapper.text()).toMatch('ダウンロード結果が見つかりません。')
      expect(downloadsLists.exists()).toBe(false)
    } else {
      expect(downloadsLists.vm.downloads).toBe(wrapper.vm.downloads)
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(show.existInfinite)
    return infiniteLoading
  }

  const infiniteErrorTest = async (messages = {}, checkViewTest = true) => {
    const wrapper = mountFunction()
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    apiCalledTest(1)
    const infiniteLoading = viewTest(wrapper, dataPage1, '5件', {}, { existInfinite: true, testState: null })

    // スクロール（2頁目）
    infiniteLoading.vm.$emit('infinite')
    await flushPromises()

    apiCalledTest(2)
    helper.toastMessageTest(mock.toast, messages)
    if (checkViewTest) {
      viewTest(wrapper, dataPage1, '5件', {}, { existInfinite: true, testState: 'error' }, true)
    }
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

  describe('ダウンロード結果一覧取得', () => {
    describe('0件', () => {
      it('表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount0])
        const wrapper = mountFunction(true, { ...activeUser, undownloaded_count: 0 })
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        viewTest(wrapper, dataCount0, '')
        helper.mockCalledTest(mock.updateUserUndownloadedCount, 0)
      })
    })
    describe('1件', () => {
      it('表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
        const wrapper = mountFunction(true, { ...activeUser, undownloaded_count: 0 })
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        viewTest(wrapper, dataCount1, '1件')
        helper.mockCalledTest(mock.updateUserUndownloadedCount, 1, 1)
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
        infiniteLoading = viewTest(wrapper, dataPage1, '5件', {}, { existInfinite: true, testState: null })
      }
      const completeTestAction = async () => {
        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(2)
        infiniteLoading = viewTest(wrapper, dataPageTo2, '5件', {}, { existInfinite: true, testState: 'loaded' })

        // スクロール（3頁目）
        infiniteLoading.vm.$emit('infinite')
        await flushPromises()

        apiCalledTest(3)
        viewTest(wrapper, dataPageTo3, '5件', {}, { existInfinite: false, testState: 'complete' })
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
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, null])
        await infiniteErrorTest({ error: helper.locales.system.error })
      })
    })
    describe('現在ページが異なる', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, dataPageMiss1])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPageMiss2])
        await infiniteErrorTest({ error: helper.locales.system.error })
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
        helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: null }, null])
        await infiniteErrorTest({ error: helper.locales.network.failure })
      })
    })
    describe('認証エラー', () => {
      it('[初期表示]ログインページにリダイレクトされる', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, messages])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
        helper.mockCalledTest(mock.useAuthSignOut, 1, true)
        helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
        helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
        helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
      })
      it('[無限スクロール]ログインページにリダイレクトされる', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 401 }, messages])
        await infiniteErrorTest({ error: messages.alert, info: messages.notice }, false)
        helper.mockCalledTest(mock.useAuthSignOut, 1, true)
        helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
        helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
      })
    })
    describe('認証エラー（メッセージなし）', () => {
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
      it('[無限スクロール]ログインページにリダイレクトされる', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 401 }, null])
        await infiniteErrorTest({ info: helper.locales.auth.unauthenticated }, false)
        helper.mockCalledTest(mock.useAuthSignOut, 1, true)
        helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
        helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
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
        helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 500 }, null])
        await infiniteErrorTest({ error: helper.locales.network.error })
      })
    })
    describe('その他エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, messages])
        const wrapper = mountFunction()
        helper.loadingTest(wrapper, AppLoading)
        await flushPromises()

        apiCalledTest(1)
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

        apiCalledTest(1)
        helper.toastMessageTest(mock.toast, {})
        helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default } })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataPage1])
          .mockImplementationOnce(() => [{ ok: false, status: 400 }, {}])
        await infiniteErrorTest({ error: helper.locales.system.default })
      })
    })
  })

  describe('ダウンロード結果一覧再取得', () => {
    let wrapper: any
    const beforeAction = async (data: object) => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(1)
      viewTest(wrapper, data, '')

      // 更新ボタン
      const button = wrapper.find('#downloads_reload_btn')
      expect(button.exists()).toBe(true)
      button.trigger('click')
      await flushPromises()

      apiCalledTest(2, { page: 1 })
    }

    it('[成功]表示が更新される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount0])
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount1])
      await beforeAction(dataCount0)

      viewTest(wrapper, dataCount1, '')
      helper.toastMessageTest(mock.toast, {})
    })
    it('[接続エラー]表示が更新されない。エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, dataCount0])
        .mockImplementationOnce(() => [{ ok: false, status: null }, null])
      await beforeAction(dataCount0)

      viewTest(wrapper, dataCount0, '', {}, { existInfinite: false, testState: null }, true)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
    })
  })

  describe('完了チェック', () => {
    const user = Object.freeze({ ...activeUser, undownloaded_count: 1 })
    const targetId = dataPage1.downloads[0].id
    let wrapper: any
    describe('0回', () => {
      const beforeAction = async (target: object) => {
        mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200, headers: mock.headers }, { ...dataPage1, target }])
        wrapper = mountFunction(true, user, { target_id: targetId })
        await flushPromises()
      }

      it('[対象が成功]成功メッセージが表示される。次回は実行されない', async () => {
        const target = Object.freeze({ status: 'success', notice: 'successメッセージ' })
        await beforeAction(target)

        helper.messageTest(wrapper, AppMessage, target, 'success')
        helper.toastMessageTest(mock.toast, { success: target.notice })
        expect(wrapper.vm.testDelay).toBeNull() // setTimeoutされない
      })
      it('[対象が失敗]エラーメッセージが表示される。次回は実行されない', async () => {
        const target = Object.freeze({ status: 'failure', alert: 'failureメッセージ' })
        await beforeAction(target)

        helper.messageTest(wrapper, AppMessage, target)
        helper.toastMessageTest(mock.toast, { error: target.alert })
        expect(wrapper.vm.testDelay).toBeNull() // setTimeoutされない
      })
    })

    describe('1回', () => {
      const target1 = Object.freeze({ status: 'waiting', notice: 'waitingメッセージ' })
      const beforeAction = async (response: any, data: any) => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, { ...dataPage1, target: target1 }])
          .mockImplementationOnce(() => [response, data])
        wrapper = mountFunction(true, user, { target_id: targetId })
        await flushPromises()

        helper.messageTest(wrapper, AppMessage, target1)
        helper.toastMessageTest(mock.toast, {})
        expect(wrapper.vm.testDelay).toEqual([3000, targetId, 1]) // setTimeout: 3秒後、1回目
        await flushPromises()
      }

      it('[対象が処理待ち→更新ボタン（成功）]成功メッセージが表示される。次回は実行されない', async () => {
        const target2 = Object.freeze({ status: 'success', notice: 'successメッセージ' })
        const downloads = [
          { id: 5, status: 'success' }, // <- waiting
          { id: 4, status: 'success' }
        ]
        await beforeAction({ ok: true, status: 200, headers: mock.headers }, { ...dataPage1, downloads, target: target2 })

        // 更新ボタン
        wrapper.find('#downloads_reload_btn').trigger('click')
        await flushPromises()

        // 完了チェック（setTimeoutの処理）を実行
        wrapper.vm.checkDownloadComplete(targetId, 1)
        await flushPromises()

        apiCalledTest(2, { page: 1, target_id: targetId })
        helper.messageTest(wrapper, AppMessage, target2, 'success')
        helper.toastMessageTest(mock.toast, {})
        expect(wrapper.vm.testDelay).toEqual([3000, targetId, 1]) // setTimeoutされない（前回と同じ）
      })
      it('[対象が処理待ち→接続エラー]エラーメッセージが表示される。次回は実行されない', async () => {
        await beforeAction({ ok: false, status: null }, null)

        // 完了チェック（setTimeoutの処理）を実行
        wrapper.vm.checkDownloadComplete(targetId, 1)
        await flushPromises()

        apiCalledTest(2, { id: targetId, target_id: targetId })
        helper.messageTest(wrapper, AppMessage, target1) // 前回と同じ
        helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
        expect(wrapper.vm.testDelay).toEqual([3000, targetId, 1]) // setTimeoutされない（前回と同じ）
      })
      it('[対象が処理待ち→認証エラー]未ログイン状態になり、ログインページにリダイレクトされる。次回は実行されない', async () => {
        await beforeAction({ ok: false, status: 401 }, messages)

        // 完了チェック（setTimeoutの処理）を実行
        wrapper.vm.checkDownloadComplete(targetId, 1)
        await flushPromises()

        apiCalledTest(2, { id: targetId, target_id: targetId })
        helper.mockCalledTest(mock.useAuthSignOut, 1, true)
        helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
        helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
        helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
        expect(wrapper.vm.testDelay).toEqual([3000, targetId, 1]) // setTimeoutされない（前回と同じ）
      })
      it('[対象が処理待ち→認証エラー（メッセージなし）]未ログイン状態になり、ログインページにリダイレクトされる。次回は実行されない', async () => {
        await beforeAction({ ok: false, status: 401 }, null)

        // 完了チェック（setTimeoutの処理）を実行
        wrapper.vm.checkDownloadComplete(targetId, 1)
        await flushPromises()

        apiCalledTest(2, { id: targetId, target_id: targetId })
        helper.mockCalledTest(mock.useAuthSignOut, 1, true)
        helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
        helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
        helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
        expect(wrapper.vm.testDelay).toEqual([3000, targetId, 1]) // setTimeoutされない（前回と同じ）
      })
      it('[レスポンスエラー]エラーメッセージが表示される。次回は実行されない', async () => {
        await beforeAction({ ok: false, status: 500 }, null)

        // 完了チェック（setTimeoutの処理）を実行
        wrapper.vm.checkDownloadComplete(targetId, 1)
        await flushPromises()

        apiCalledTest(2, { id: targetId, target_id: targetId })
        helper.messageTest(wrapper, AppMessage, target1) // 前回と同じ
        helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
        expect(wrapper.vm.testDelay).toEqual([3000, targetId, 1]) // setTimeoutされない（前回と同じ）
      })
      it('[その他エラー]エラーメッセージが表示される。次回は実行されない', async () => {
        await beforeAction({ ok: false, status: 400 }, messages)

        // 完了チェック（setTimeoutの処理）を実行
        wrapper.vm.checkDownloadComplete(targetId, 1)
        await flushPromises()

        apiCalledTest(2, { id: targetId, target_id: targetId })
        helper.messageTest(wrapper, AppMessage, target1) // 前回と同じ
        helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
        expect(wrapper.vm.testDelay).toEqual([3000, targetId, 1]) // setTimeoutされない（前回と同じ）
      })
      it('[その他エラー（メッセージなし）]エラーメッセージが表示される。次回は実行されない', async () => {
        await beforeAction({ ok: false, status: 400 }, {})

        // 完了チェック（setTimeoutの処理）を実行
        wrapper.vm.checkDownloadComplete(targetId, 1)
        await flushPromises()

        apiCalledTest(2, { id: targetId, target_id: targetId })
        helper.messageTest(wrapper, AppMessage, target1) // 前回と同じ
        helper.toastMessageTest(mock.toast, { error: helper.locales.system.default })
        expect(wrapper.vm.testDelay).toEqual([3000, targetId, 1]) // setTimeoutされない（前回と同じ）
      })
    })

    describe('2回', () => {
      const beforeAction = async (target1: any, target2: any, target3: any, undownloadedCount: number) => {
        mock.useApiRequest = vi.fn()
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, { ...dataPage1, target: target1 }])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, { downloads: [{ id: targetId, status: target2.status }], target: target2 }])
          .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, { downloads: [{ id: targetId, status: target3.status }], target: target3, undownloaded_count: undownloadedCount }])
        wrapper = mountFunction(true, user, { target_id: targetId })
        await flushPromises()

        helper.messageTest(wrapper, AppMessage, target1)
        helper.toastMessageTest(mock.toast, {})
        expect(wrapper.vm.testDelay).toEqual([3000, targetId, 1]) // setTimeout: 3秒後、1回目
        await flushPromises()

        // 完了チェック（setTimeoutの処理）を実行
        wrapper.vm.checkDownloadComplete(targetId, 1)
        await flushPromises()

        apiCalledTest(2, { id: targetId, target_id: targetId })
        expect(wrapper.vm.testDelay).toEqual([6000, targetId, 2]) // setTimeout: 6秒後、2回目

        // 完了チェック（setTimeoutの処理）を実行
        wrapper.vm.checkDownloadComplete(targetId, 2)
        await flushPromises()

        apiCalledTest(3, { id: targetId, target_id: targetId })
        expect(wrapper.vm.testDelay).toEqual([6000, targetId, 2]) // setTimeoutされない
        expect(wrapper.vm.downloads).toEqual([{ id: targetId, status: target3.status }, dataPage1.downloads[1]])
        helper.mockCalledTest(mock.updateUserUndownloadedCount, 1, undownloadedCount)
        helper.messageTest(wrapper, AppMessage, target3, 'success')
      }

      it('[対象が処理待ち→処理待ち→成功]成功まで繰り返し実行され、表示が変更される', async () => {
        const target1 = Object.freeze({ status: 'waiting', notice: 'waitingメッセージ' })
        const target2 = Object.freeze({ status: 'waiting', notice: 'waitingメッセージ' })
        const target3 = Object.freeze({ status: 'success', notice: 'successメッセージ' })
        await beforeAction(target1, target2, target3, 1)

        helper.toastMessageTest(mock.toast, { success: target3.notice })
      })
      it('[対象が処理中→処理中→失敗]失敗まで繰り返し実行され、表示が変更される', async () => {
        const target1 = Object.freeze({ status: 'processing', notice: 'processingメッセージ' })
        const target2 = Object.freeze({ status: 'processing', notice: 'processingメッセージ' })
        const target3 = Object.freeze({ status: 'failure', alert: 'failureメッセージ' })
        await beforeAction(target1, target2, target3, 2)

        helper.toastMessageTest(mock.toast, { error: target3.alert })
      })
    })
  })

  describe('ダウンロード', () => {
    const data = Object.freeze({
      download: {
        total_count: 2,
        current_page: 1,
        total_pages: 1,
        limit_value: 2
      },
      downloads: [
        { id: 2, status: 'success' },
        { id: 1, status: 'success', last_downloaded_at: '2000-01-01T12:34:56+09:00' }
      ]
    })

    let wrapper: any
    const beforeAction = async (downloadResponse: any, query: any, item: any, values: any = {}) => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200, headers: mock.headers }, data])
        .mockImplementationOnce(() => downloadResponse)
      wrapper = mountFunction(true, { ...activeUser, undownloaded_count: 1 }, query, values)
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      const params: any = { page: 1 }
      if (query?.target_id != null) { params.target_id = query.target_id }
      apiCalledTest(1, params)
      viewTest(wrapper, data, '2件', values.messages)

      // ダウンロード
      const beforeCreateObjectURL = URL.createObjectURL
      URL.createObjectURL = vi.fn(() => helper.commonConfig.downloads.fileUrl)

      wrapper.vm.getDownloadsFile({ ...item })
      await flushPromises()

      expect(mock.useApiRequest).toBeCalledTimes(2)
      const url = helper.commonConfig.downloads.fileUrl.replace(':id', item.id)
      expect(mock.useApiRequest).nthCalledWith(2, helper.envConfig.apiBaseURL + url, 'GET', null, null, 'text/csv')
      URL.createObjectURL = beforeCreateObjectURL
    }

    const filename = 'file_12345.csv'
    const successResponse = [{
      ok: true,
      status: 200,
      headers: { get: vi.fn((key: string) => key === 'content-disposition' ? `attachment; filename="${filename}";` : null) }
    }, 'test']
    it('[パラメータなし、未ダウンロード]ダウンロードされる', async () => {
      await beforeAction(successResponse, null, data.downloads[0])

      expect(wrapper.vm.testElement.download).toBe(filename)
      expect(wrapper.vm.downloads[0].last_downloaded_at).toBe(true) // ダウンロード済みに変更される
      helper.messageTest(wrapper, AppMessage, null)
      helper.mockCalledTest(mock.updateUserUndownloadedCount, 1, 0)
    })
    it('[パラメータのIDが一致、未ダウンロード]ダウンロードされ、メッセージがクリアされる', async () => {
      await beforeAction(successResponse, { target_id: data.downloads[0].id }, data.downloads[0], { messages: { alert: '', notice: 'noticeメッセージ' } })

      expect(wrapper.vm.testElement.download).toBe(filename)
      expect(wrapper.vm.downloads[0].last_downloaded_at).toBe(true) // ダウンロード済みに変更される
      helper.messageTest(wrapper, AppMessage, null)
      helper.mockCalledTest(mock.updateUserUndownloadedCount, 1, 0)
    })
    it('[パラメータのIDが不一致、ダウンロード済み]ダウンロードされる', async () => {
      await beforeAction(successResponse, { target_id: data.downloads[1].id }, data.downloads[1])

      expect(wrapper.vm.testElement.download).toBe(filename)
      expect(wrapper.vm.downloads[1].last_downloaded_at).toBe(data.downloads[1].last_downloaded_at) // 変更されない
      helper.messageTest(wrapper, AppMessage, null)
      helper.mockCalledTest(mock.updateUserUndownloadedCount, 0)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: true, status: 200 }, null], null, data.downloads[0])

      expect(wrapper.vm.testElement).toBeNull()
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: null }, null], null, data.downloads[0])

      expect(wrapper.vm.testElement).toBeNull()
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
    })
    it('[認証エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 401 }, messages], null, data.downloads[0])

      expect(wrapper.vm.testElement).toBeNull()
      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー（メッセージなし）]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 401 }, null], null, data.downloads[0])

      expect(wrapper.vm.testElement).toBeNull()
      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 403 }, messages], null, data.downloads[0])

      expect(wrapper.vm.testElement).toBeNull()
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
    })
    it('[権限エラー（メッセージなし）]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 403 }, null], null, data.downloads[0])

      expect(wrapper.vm.testElement).toBeNull()
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.forbidden })
    })
    it('[存在しない]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 404 }, messages], null, data.downloads[0])

      expect(wrapper.vm.testElement).toBeNull()
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
    })
    it('[存在しない（メッセージなし）]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 404 }, null], null, data.downloads[0])

      expect(wrapper.vm.testElement).toBeNull()
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.notfound })
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 500 }, null], null, data.downloads[0])

      expect(wrapper.vm.testElement).toBeNull()
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 400 }, {}], null, data.downloads[0])

      expect(wrapper.vm.testElement).toBeNull()
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.default })
    })
  })
})
