
import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import DownloadsLists from '~/components/downloads/Lists.vue'
import Page from '~/pages/downloads.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('downloads.vue', () => {
  let axiosGetMock, authSetUserMock, authLogoutMock, toastedErrorMock, toastedInfoMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    authSetUserMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    nuxtErrorMock = jest.fn()
    URL.createObjectURL = jest.fn(() => helper.commonConfig.downloadFileUrl)
  })
  afterEach(() => {
    URL.createObjectURL.mockReset()
  })

  const beforeLocation = window.location
  const beforeBody = document.body
  beforeAll(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: { reload: jest.fn() } })
    Object.defineProperty(document, 'body', { configurable: true, value: { appendChild: jest.fn(), removeChild: jest.fn() } })
  })
  afterAll(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: beforeLocation })
    Object.defineProperty(document, 'body', { configurable: true, value: beforeBody })
  })

  const mountFunction = (loggedIn, user = null, query = null) => {
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
        DownloadsLists: true
      },
      mocks: {
        $axios: {
          get: axiosGetMock
        },
        $auth: {
          loggedIn,
          user: { ...user },
          setUser: authSetUserMock,
          logout: authLogoutMock
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
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const dataPage1 = Object.freeze({
    download: {
      total_count: 5,
      current_page: 1,
      total_pages: 3,
      limit_value: 2
    },
    downloads: [
      { id: 5, status: 'waiting' },
      { id: 4, status: 'success' }
    ]
  })
  const dataPage2 = Object.freeze({
    download: {
      total_count: 5,
      current_page: 2,
      total_pages: 3,
      limit_value: 2
    },
    downloads: [
      { id: 3, status: 'success' },
      { id: 2, status: 'processing' }
    ]
  })
  const dataPage3 = Object.freeze({
    download: {
      total_count: 5,
      current_page: 3,
      total_pages: 3,
      limit_value: 2
    },
    downloads: [
      { id: 1, status: 'failure' }
    ]
  })

  // テスト内容
  const apiCalledTest = (count, page = count) => {
    expect(axiosGetMock).toBeCalledTimes(count)
    expect(axiosGetMock).nthCalledWith(count, helper.envConfig.apiBaseURL + helper.commonConfig.downloadsUrl, { params: { page } })
  }

  const viewTest = (wrapper, data, countView, values = null, show = { existInfinite: false, testState: null }, error = false) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    helper.messageTest(wrapper, Message, values, { alert: false, notice: true })

    expect(wrapper.vm.$data.error).toBe(error)
    expect(wrapper.vm.$data.testState).toBe(show.testState)
    expect(wrapper.vm.$data.page).toBe(data.download.current_page)
    expect(wrapper.vm.$data.download).toEqual(data.download)
    expect(wrapper.vm.$data.downloads).toEqual(data.downloads)

    // 一覧
    const downloadsLists = wrapper.findComponent(DownloadsLists)
    if (data.downloads == null || data.downloads.length === 0) {
      expect(wrapper.text()).toMatch('ダウンロード結果が見つかりません。')
      expect(downloadsLists.exists()).toBe(false)
    } else {
      expect(downloadsLists.vm.downloads).toBe(wrapper.vm.$data.downloads)
    }
    expect(wrapper.text()).toMatch(countView) // [1件以上]件数

    const infiniteLoading = wrapper.findComponent(InfiniteLoading)
    expect(infiniteLoading.exists()).toBe(show.existInfinite)
    return infiniteLoading
  }

  const infiniteErrorTest = async (alert, notice) => {
    const wrapper = mountFunction(true)
    helper.loadingTest(wrapper, Loading)

    await helper.sleep(1)
    apiCalledTest(1)
    const infiniteLoading = viewTest(wrapper, dataPage1, '5件', null, { existInfinite: true, testState: null })

    // スクロール（2頁目）
    infiniteLoading.vm.$emit('infinite')

    await helper.sleep(1)
    apiCalledTest(2)
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
    viewTest(wrapper, dataPage1, '5件', null, { existInfinite: true, testState: 'error' }, true)
  }

  // テストケース
  describe('未ログイン', () => {
    it('ログインページにリダイレクトされる', () => {
      const wrapper = mountFunction(false)
      helper.loadingTest(wrapper, Loading)
      expect(wrapper.findComponent(Loading).exists()).toBe(true) // NOTE: Jestでmiddlewareが実行されない為
    })
  })

  describe('ダウンロード結果一覧取得', () => {
    describe('0件', () => {
      const data = Object.freeze({
        download: {
          total_count: 0,
          current_page: 1,
          total_pages: 0,
          limit_value: 2
        }
      })
      it('表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        viewTest(wrapper, data, '')
      })
    })
    describe('1件', () => {
      const data = Object.freeze({
        download: {
          total_count: 1,
          current_page: 1,
          total_pages: 1,
          limit_value: 2
        },
        downloads: [
          { id: 1 }
        ]
      })
      it('表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.resolve({ data }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        viewTest(wrapper, data, '1件')
      })
    })
    describe('無限スクロール', () => {
      let wrapper, infiniteLoading
      const beforeAction = async (uid1, uid2, uid3 = null) => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1, headers: { uid: uid1 } }))
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage2, headers: { uid: uid2 } }))
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage3, headers: { uid: uid3 } }))
        wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        infiniteLoading = viewTest(wrapper, dataPage1, '5件', null, { existInfinite: true, testState: null })
      }
      const completeTestAction = async () => {
        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(2)
        const downloads = dataPage1.downloads.concat(dataPage2.downloads)
        infiniteLoading = viewTest(wrapper, { ...dataPage2, downloads }, '5件', null, { existInfinite: true, testState: 'loaded' })

        // スクロール（3頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        apiCalledTest(3)
        viewTest(wrapper, { ...dataPage3, downloads: downloads.concat(dataPage3.downloads) }, '5件', null, { existInfinite: false, testState: 'complete' })
      }
      const reloadTestAction = async () => {
        const count = window.location.reload.mock.calls.length

        // スクロール（2頁目）
        infiniteLoading.vm.$emit('infinite')

        await helper.sleep(1)
        helper.mockCalledTest(window.location.reload, count + 1)

        apiCalledTest(2)
        viewTest(wrapper, dataPage1, '5件', null, { existInfinite: true, testState: 'error' }, true)
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
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
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
        axiosGetMock = jest.fn(() => Promise.resolve({ data: { ...dataPage1, download: { ...dataPage1.download, current_page: 9 } } }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 0)
        helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.resolve({ data: { ...dataPage2, download: { ...dataPage2.download, current_page: 9 } } }))
        await infiniteErrorTest(helper.locales.system.error, null)
      })
    })

    describe('接続エラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
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
    describe('認証エラー', () => {
      it('[初期表示]ログインページにリダイレクトされる', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
        helper.mockCalledTest(authLogoutMock, 1)
        helper.mockCalledTest(toastedErrorMock, 0)
        helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
        // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
      })
      it('[無限スクロール]エラーメッセージが表示される', async () => {
        axiosGetMock = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({ data: dataPage1 }))
          .mockImplementationOnce(() => Promise.reject({ response: { status: 401 } }))
        await infiniteErrorTest(null, helper.locales.auth.unauthenticated)
      })
    })
    describe('レスポンスエラー', () => {
      it('[初期表示]エラーページが表示される', async () => {
        axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
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
        const wrapper = mountFunction(true)
        helper.loadingTest(wrapper, Loading)

        await helper.sleep(1)
        apiCalledTest(1)
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

  describe('ダウンロード', () => {
    const user = Object.freeze({ undownloaded_count: 1 })
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

    const filename = 'file_12345.csv'
    const setSuccessMock = () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data }))
        .mockImplementationOnce(() => Promise.resolve({ data: 'test', headers: { 'content-disposition': `attachment; filename="${filename}";` } }))
    }

    let wrapper, count
    const beforeAction = async (query, item, values = null) => {
      wrapper = mountFunction(true, user, query)
      helper.loadingTest(wrapper, Loading)

      await helper.sleep(1)
      apiCalledTest(1)
      viewTest(wrapper, data, '2件', values)

      // ダウンロード
      count = document.body.appendChild.mock.calls.length
      wrapper.vm.downloadFile({ ...item })

      await helper.sleep(1)
      expect(axiosGetMock).toBeCalledTimes(2)
      expect(axiosGetMock).nthCalledWith(2, helper.envConfig.apiBaseURL + helper.commonConfig.downloadFileUrl.replace(':id', item.id), { responseType: 'blob' })
    }
    const downloadTest = () => {
      const element = document.createElement('a')
      element.href = helper.commonConfig.downloadFileUrl
      element.download = filename
      expect(document.body.appendChild).nthCalledWith(count + 1, element)
      expect(document.body.removeChild).nthCalledWith(count + 1, element)
    }

    it('[パラメータなし、未ダウンロード]ダウンロードされる', async () => {
      setSuccessMock()
      await beforeAction(null, data.downloads[0])

      downloadTest()
      helper.messageTest(wrapper, Message, null)
      helper.mockCalledTest(authSetUserMock, 1)
    })
    it('[パラメータのIDが一致、未ダウンロード]ダウンロードされ、メッセージがクリアされる', async () => {
      setSuccessMock()
      const notice = helper.locales.notice.download.status[data.downloads[1].status]
      await beforeAction({ id: data.downloads[0].id }, data.downloads[0], { notice })

      downloadTest()
      helper.messageTest(wrapper, Message, null)
      helper.mockCalledTest(authSetUserMock, 1)
    })
    it('[パラメータのIDが不一致、ダウンロード済み]ダウンロードされる', async () => {
      setSuccessMock()
      await beforeAction({ id: data.downloads[1].id }, data.downloads[1])

      downloadTest()
      helper.messageTest(wrapper, Message, null)
      helper.mockCalledTest(authSetUserMock, 0)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data }))
        .mockImplementationOnce(() => Promise.reject({ response: null }))
      await beforeAction(null, data.downloads[0])

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 0)
    })
    it('[認証エラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data }))
        .mockImplementationOnce(() => Promise.reject({ response: { status: 401 } }))
      await beforeAction(null, data.downloads[0])

      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data }))
        .mockImplementationOnce(() => Promise.reject({ response: { status: 403 } }))
      await beforeAction(null, data.downloads[0])

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.forbidden)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 0)
    })
    it('[存在しない]エラーページが表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data }))
        .mockImplementationOnce(() => Promise.reject({ response: { status: 404 } }))
      await beforeAction(null, data.downloads[0])

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.notfound)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 0)
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data }))
        .mockImplementationOnce(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction(null, data.downloads[0])

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 0)
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({ data }))
        .mockImplementationOnce(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction(null, data.downloads[0])

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 0)
    })
  })
})
