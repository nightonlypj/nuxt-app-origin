import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import InfomationsLabel from '~/components/infomations/Label.vue'
import Page from '~/pages/infomations/[id].vue'
import { detail } from '~/test/data/infomations'

describe('[id].vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      showError: vi.fn(),
      toast: helper.mockToast
    }
  })
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })

  const mountFunction = (params: any) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('showError', mock.showError)
    vi.stubGlobal('useRoute', vi.fn(() => ({
      params
    })))

    const wrapper = mount(Page, {
      global: {
        stubs: {
          AppLoading: true,
          InfomationsLabel: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, infomation: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.vm.infomation).toEqual(infomation)

    expect(wrapper.findComponent(InfomationsLabel).exists()).toBe(true) // ラベル
    expect(wrapper.findComponent(InfomationsLabel).vm.$props.infomation).toEqual(infomation)

    expect(wrapper.text()).toMatch(infomation.title) // タイトル
    expect(wrapper.text()).toMatch(wrapper.vm.dateFormat('ja', infomation.started_at)) // 開始日
    if (infomation.body != null) {
      expect(wrapper.text()).toMatch(infomation.body) // 本文
      expect(wrapper.text()).not.toMatch(infomation.summary) // 概要
    } else {
      expect(wrapper.text()).toMatch(infomation.summary)
    }

    const links = helper.getLinks(wrapper)
    expect(links.includes('/infomations')).toBe(true) // お知らせ一覧
  }

  // テストケース
  it('[パラメータ不正（文字）]エラーページが表示される', () => {
    const wrapper = mountFunction({ id: 'x' })
    helper.loadingTest(wrapper, AppLoading)
    helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: {} })
  })
  it('[パラメータ不正（0始まり）]エラーページが表示される', () => {
    const wrapper = mountFunction({ id: '01' })
    helper.loadingTest(wrapper, AppLoading)
    helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: {} })
  })

  describe('お知らせ詳細取得', () => {
    const apiCalledTest = (params: any) => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      const url = helper.commonConfig.infomations.detailUrl.replace(':id', params.id)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + url)
    }

    let wrapper: any
    const beforeAction = async (params = { id: '1' }) => {
      wrapper = mountFunction(params)
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest(params)
    }

    it('[ラベル・本文あり]表示される', async () => {
      const infomation = Object.freeze({ ...detail, label_i18n: 'メンテナンス', body: '本文1' })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { infomation }])
      await beforeAction()

      viewTest(wrapper, infomation)
    })
    it('[ラベル・本文なし]表示される', async () => {
      const infomation = Object.freeze({ ...detail, label_i18n: null, body: null })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { infomation }])
      await beforeAction()

      viewTest(wrapper, infomation)
    })
    it('[データなし]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error } })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure } })
    })
    it('[存在しない]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: messages })
    })
    it('[存在しない（メッセージなし）]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: {} })
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default } })
    })
  })
})
