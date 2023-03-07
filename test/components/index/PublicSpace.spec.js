import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import Component from '~/components/index/PublicSpace.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('PublicSpace.vue', () => {
  let axiosGetMock

  beforeEach(() => {
    axiosGetMock = null
  })

  const mountFunction = () => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        Loading: true
      },
      mocks: {
        $axios: {
          get: axiosGetMock
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, data) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.vm.$data.spaces).toEqual(data.spaces)

    const links = helper.getLinks(wrapper)
    for (const space of data.spaces) {
      expect(links.includes(`/-/${space.code}`)).toBe(true)
      expect(wrapper.find(`#public_space_link_${space.code}`).exists()).toBe(true)
      expect(wrapper.find(`#public_space_image_${space.code}`).exists()).toBe(space.image_url != null)
      expect(wrapper.html()).toMatch(space.name)
    }
  }

  const viewErrorTest = (wrapper, errorMessage, localesMessage) => {
    expect(wrapper.vm.$data.errorMessage).toBe(errorMessage)
    expect(wrapper.text()).toMatch(localesMessage)
  }

  // テストケース
  describe('スペース一覧取得（公開）', () => {
    const apiCalledTest = () => {
      expect(axiosGetMock).toBeCalledTimes(1)
      const params = { text: null, public: 1, private: 0, join: 1, nojoin: 1, active: 1, destroy: 0 }
      expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaces.listUrl, { params })
    }

    let wrapper
    const beforeAction = async () => {
      wrapper = mountFunction()
      helper.loadingTest(wrapper, Loading)
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[0件]表示されない', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { spaces: [] } }))
      await beforeAction()

      helper.blankTest(wrapper, Loading)
    })
    it('[2件]表示される', async () => {
      const data = Object.freeze({
        spaces: [
          {
            code: 'code0001',
            image_url: {
              mini: 'https://example.com/images/space/mini_noimage.jpg'
            },
            name: 'スペース1'
          },
          {
            code: 'code0002',
            name: 'スペース2'
          }
        ]
      })
      axiosGetMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      viewTest(wrapper, data)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      viewErrorTest(wrapper, 'system.error', helper.locales.system.error_short)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      viewErrorTest(wrapper, 'network.failure', helper.locales.network.failure_short)
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      viewErrorTest(wrapper, 'network.error', helper.locales.network.error_short)
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      viewErrorTest(wrapper, 'system.default', helper.locales.system.default_short)
    })
  })
})
