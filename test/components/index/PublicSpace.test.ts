import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { apiRequestURL } from '~/utils/api'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import Component from '~/components/index/PublicSpace.vue'
import { listMiniCount2 } from '~/test/data/spaces'

const $config = config.global.mocks.$config
const $t = config.global.mocks.$t

describe('PublicSpace.vue', () => {
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
          AppLoading: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, spaces: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.vm.spaces).toEqual(spaces)

    const links = helper.getLinks(wrapper)
    for (const space of spaces) {
      expect(links.includes(`/-/${space.code}`)).toBe(true)
      expect(wrapper.find(`#public_space_link_${space.code}`).exists()).toBe(true)
      expect(wrapper.find(`#public_space_image_${space.code}`).exists()).toBe(space.image_url != null)
      expect(wrapper.html()).toMatch(space.name)
    }
  }

  const viewErrorTest = (wrapper: any, alert: string) => {
    expect(wrapper.vm.alert).toBe(alert)
    expect(wrapper.text()).toMatch(alert)
  }

  // テストケース
  describe('スペース一覧取得（公開）', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      const params = { text: '', public: 1, private: 0, join: 1, nojoin: 1, active: 1, destroy: 0 }
      expect(mock.useApiRequest).nthCalledWith(1, apiRequestURL(helper.locale, $config.public.spaces.listUrl), 'GET', params)
    }

    let wrapper: any
    const beforeAction = async () => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest()
    }

    it('[0件]表示されない', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { spaces: [] }])
      await beforeAction()

      helper.blankTest(wrapper, AppLoading)
    })
    it('[2件]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { spaces: listMiniCount2 }])
      await beforeAction()

      viewTest(wrapper, listMiniCount2)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      viewErrorTest(wrapper, $t('system.error_short'))
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      viewErrorTest(wrapper, $t('network.failure_short'))
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      viewErrorTest(wrapper, $t('network.error_short'))
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      viewErrorTest(wrapper, $t('system.default_short'))
    })
  })
})
