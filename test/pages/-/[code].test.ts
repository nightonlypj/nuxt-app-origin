import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppMarkdown from '~/components/app/Markdown.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesIcon from '~/components/spaces/Icon.vue'
import Page from '~/pages/-/[code].vue'
import { detail, detailPower } from '~/test/data/spaces'

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
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  const fullPath = `/-/${detail.code}`
  const params = Object.freeze({ code: detail.code })

  const mountFunction = (loggedIn: boolean) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({
      fullPath,
      params
    })))

    const wrapper = mount(Page, {
      global: {
        stubs: {
          AppLoading: true,
          AppMarkdown: true,
          SpacesDestroyInfo: true,
          SpacesIcon: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, space: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.vm.space).toEqual(space)

    const spacesDestroyInfo = wrapper.findComponent(SpacesDestroyInfo)
    expect(spacesDestroyInfo.vm.space).toEqual(wrapper.vm.space)

    expect(wrapper.find('#space_image').exists()).toBe(true)
    expect(wrapper.text()).toMatch(space.name)

    const spacesIcon = wrapper.findComponent(SpacesIcon)
    expect(spacesIcon.exists()).toBe(true)
    expect(spacesIcon.vm.$props.space).toEqual(space)

    const appMarkdown = wrapper.findComponent(AppMarkdown)
    expect(appMarkdown.exists()).toBe(true)
    expect(appMarkdown.vm.$props.source).toBe(space.description)
  }

  // テストケース
  describe('スペース情報取得', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaces.detailUrl.replace(':code', params.code))
    }

    let wrapper: any
    const beforeAction = async (loggedIn = false) => {
      wrapper = mountFunction(loggedIn)
      helper.loadingTest(wrapper, AppLoading)
      await flushPromises()

      apiCalledTest()
    }

    it('[管理者]表示される（メンバー一覧・設定変更も表示）', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: detailPower.value('admin') }])
      await beforeAction(true)

      viewTest(wrapper, detailPower.value('admin'))
      expect(wrapper.find('#members_btn').exists()).toBe(true) // 表示
      expect(wrapper.find('#space_update_btn').exists()).toBe(true) // 表示
    })
    it('[投稿者]表示される（メンバー一覧は表示、設定変更は非表示）', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: detailPower.value('writer') }])
      await beforeAction(true)

      viewTest(wrapper, detailPower.value('writer'))
      expect(wrapper.find('#members_btn').exists()).toBe(true) // 表示
      expect(wrapper.find('#space_update_btn').exists()).toBe(false) // 非表示
    })
    it('[閲覧者]表示される（メンバー一覧は表示、設定変更は非表示）', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: detailPower.value('reader') }])
      await beforeAction(true)

      viewTest(wrapper, detailPower.value('reader'))
      expect(wrapper.find('#members_btn').exists()).toBe(true) // 表示
      expect(wrapper.find('#space_update_btn').exists()).toBe(false) // 非表示
    })
    it('[未参加]表示される（メンバー一覧・設定変更は非表示）', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: detail }])
      await beforeAction(true)

      viewTest(wrapper, detail)
      expect(wrapper.find('#members_btn').exists()).toBe(false) // 非表示
      expect(wrapper.find('#space_update_btn').exists()).toBe(false) // 非表示
    })
    it('[データなし]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error } })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure } })
    })
    it('[認証エラー]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, messages])
      await beforeAction(true)

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー（メッセージなし）]ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction(true)

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[権限エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, messages])
      await beforeAction(true)

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: messages })
    })
    it('[権限エラー（メッセージなし）]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, null])
      await beforeAction(true)

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: { alert: helper.locales.auth.forbidden } })
    })
    it('[存在しない]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, messages])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: messages })
    })
    it('[存在しない（メッセージなし）]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: {} })
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default } })
    })
  })
})