import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import InfomationsLabel from '~/components/infomations/Label.vue'
import Page from '~/pages/infomations/[id].vue'

describe('[id].vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      showError: vi.fn(),
      toast: helper.mockToast
    }
  })

  const params = { id: '1' }
  const mountFunction = () => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('showError', mock.showError)

    const wrapper = mount(Page, {
      global: {
        stubs: {
          AppLoading: true,
          InfomationsLabel: true
        },
        mocks: {
          $route: {
            params
          },
          $toast: mock.toast
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, data: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.vm.$data.infomation).toEqual(data.infomation)

    expect(wrapper.findComponent(InfomationsLabel).exists()).toBe(true) // ラベル
    expect(wrapper.findComponent(InfomationsLabel).vm.$props.infomation).toEqual(data.infomation)

    expect(wrapper.text()).toMatch(data.infomation.title) // タイトル
    expect(wrapper.text()).toMatch(wrapper.vm.$dateFormat('ja', data.infomation.started_at)) // 開始日
    if (data.infomation.body != null) {
      expect(wrapper.text()).toMatch(data.infomation.body) // 本文
      expect(wrapper.text()).not.toMatch(data.infomation.summary) // 概要
    } else {
      expect(wrapper.text()).toMatch(data.infomation.summary)
    }

    const links = helper.getLinks(wrapper)
    expect(links.includes('/infomations')).toBe(true) // お知らせ一覧
  }

  // テストケース
  describe('お知らせ詳細取得', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      const url = helper.commonConfig.infomations.detailUrl.replace(':id', params.id)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + url)
    }

    let wrapper: any
    const beforeAction = async () => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest()
    }

    it('[ラベル・本文あり]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          label_i18n: 'メンテナンス',
          title: 'タイトル1',
          summary: '概要1',
          body: '本文1',
          started_at: '2000-01-01T12:34:56+09:00'
        }
      })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      viewTest(wrapper, data)
    })
    it('[ラベル・本文なし]表示される', async () => {
      const data = Object.freeze({
        infomation: {
          label_i18n: null,
          title: 'タイトル1',
          summary: '概要1',
          body: null,
          started_at: '2000-01-01T12:34:56+09:00'
        }
      })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      viewTest(wrapper, data)
    })
    it('[データなし]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error, notice: null } })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure, notice: null } })
    })
    it('[存在しない]エラーページが表示される', async () => {
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, data])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: { alert: data.alert, notice: data.notice } })
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error, notice: null } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default, notice: null } })
    })
  })
})
