import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesIcon from '~/components/spaces/Icon.vue'
import Page from '~/pages/-/[code].vue'

describe('[code].vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      showError: vi.fn(),
      toast: helper.mockToast
    }
  })

  const params = Object.freeze({ code: 'code0001' })
  const fullPath = `/-/${params.code}`
  const mountFunction = (loggedIn: boolean) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)

    const wrapper = mount(Page, {
      global: {
        stubs: {
          AppLoading: true,
          SpacesDestroyInfo: true,
          SpacesIcon: true
        },
        mocks: {
          $auth: {
            loggedIn
          },
          $route: {
            fullPath,
            params
          },
          $toast: mock.toast
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const space = Object.freeze({
    code: 'code0001',
    image_url: {
      small: 'https://example.com/images/space/small_noimage.jpg'
    },
    name: 'スペース1',
    description: 'スペース1の説明'
  })

  // テスト内容
  const viewTest = (wrapper: any, data: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.vm.$data.space).toEqual(data.space)

    const spacesDestroyInfo = wrapper.findComponent(SpacesDestroyInfo)
    expect(spacesDestroyInfo.vm.space).toEqual(wrapper.vm.$data.space)

    expect(wrapper.find('#space_image').exists()).toBe(true)
    expect(wrapper.text()).toMatch(data.space.name)

    const spacesIcon = wrapper.findComponent(SpacesIcon)
    expect(spacesIcon.exists()).toBe(true)
    expect(spacesIcon.vm.$props.space).toEqual(data.space)
  }

  // テストケース
  describe('スペース情報取得', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaces.detailUrl.replace(':code', params.code))
    }

    let wrapper: any
    const beforeAction = async (loggedIn = true) => {
      wrapper = mountFunction(loggedIn)
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest()
    }

    it('[管理者]表示される（メンバー一覧・設定変更も表示）', async () => {
      const data = Object.freeze({
        space: {
          ...space,
          current_member: {
            power: 'admin'
          }
        }
      })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      viewTest(wrapper, data)
      expect(wrapper.find('#members_btn').exists()).toBe(true) // 表示
      expect(wrapper.find('#space_update_btn').exists()).toBe(true) // 表示
    })
    it('[投稿者]表示される（メンバー一覧は表示、設定変更は非表示）', async () => {
      const data = Object.freeze({
        space: {
          ...space,
          current_member: {
            power: 'writer'
          }
        }
      })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      viewTest(wrapper, data)
      expect(wrapper.find('#members_btn').exists()).toBe(true) // 表示
      expect(wrapper.find('#space_update_btn').exists()).toBe(false) // 非表示
    })
    it('[閲覧者]表示される（メンバー一覧は表示、設定変更は非表示）', async () => {
      const data = Object.freeze({
        space: {
          ...space,
          current_member: {
            power: 'reader'
          }
        }
      })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      viewTest(wrapper, data)
      expect(wrapper.find('#members_btn').exists()).toBe(true) // 表示
      expect(wrapper.find('#space_update_btn').exists()).toBe(false) // 非表示
    })
    it('[未参加]表示される（メンバー一覧・設定変更は非表示）', async () => {
      const data = Object.freeze({ space })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      viewTest(wrapper, data)
      expect(wrapper.find('#members_btn').exists()).toBe(false) // 非表示
      expect(wrapper.find('#space_update_btn').exists()).toBe(false) // 非表示
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
    it('[認証エラー][未ログイン]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction(false)

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 1, { path: '/users/sign_in', query: { alert: helper.locales.auth.unauthenticated } })
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー][ログイン中]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[権限エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: { alert: helper.locales.auth.forbidden, notice: null } })
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
