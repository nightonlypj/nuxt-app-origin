import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import InfomationsLabel from '~/components/infomations/Label.vue'
import Component from '~/components/index/Infomations.vue'
import { listCount4 } from '~/test/data/infomations'

describe('Infomations.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null
    }
  })

  const mountFunction = () => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)

    const wrapper = mount(Component, {
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
  const viewTest = (wrapper: any, infomations: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.vm.infomations).toEqual(infomations)

    const labels = wrapper.findAllComponents(InfomationsLabel)
    const links = helper.getLinks(wrapper)
    for (const [index, infomation] of infomations.entries()) {
      expect(labels[index].exists()).toBe(true) // ラベル
      expect(labels[index].vm.$props.infomation).toEqual(infomation)
      expect(links.includes(`/infomations/${infomation.id}`)).toBe(infomation.body_present || infomation.summary != null) // [本文or概要あり]お知らせ詳細
      expect(wrapper.text()).toMatch(infomation.title) // タイトル
      expect(wrapper.text()).toMatch(wrapper.vm.dateFormat('ja', infomation.started_at)) // 開始日
    }
  }

  const viewErrorTest = (wrapper: any, alert: string) => {
    expect(wrapper.vm.alert).toBe(alert)
    expect(wrapper.text()).toMatch(alert)
  }

  // テストケース
  describe('大切なお知らせ', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.infomations.importantUrl)
    }

    let wrapper: any
    const beforeAction = async () => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest()
    }

    it('[0件]表示されない', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { infomations: [] }])
      await beforeAction()

      helper.blankTest(wrapper, AppLoading)
    })
    it('[4件]表示される', async () => { // 本文あり・なし × 概要あり・なし
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { infomations: listCount4 }])
      await beforeAction()

      viewTest(wrapper, listCount4)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      viewErrorTest(wrapper, helper.locales.system.error_short)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      viewErrorTest(wrapper, helper.locales.network.failure_short)
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      viewErrorTest(wrapper, helper.locales.network.error_short)
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      viewErrorTest(wrapper, helper.locales.system.default_short)
    })
  })
})
