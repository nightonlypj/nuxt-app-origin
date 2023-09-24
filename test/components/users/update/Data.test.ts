import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import AppProcessing from '~/components/app/Processing.vue'
import Component from '~/components/users/update/Data.vue'

describe('Data.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      setData: vi.fn(),
      toast: helper.mockToast
    }
  })

  const fullPath = '/users/update'
  const mountFunction = (user: object, values = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)

    const wrapper = mount(Component, {
      global: {
        stubs: {
          AppProcessing: true
        },
        mocks: {
          $auth: {
            loggedIn: true,
            setData: mock.setData
          },
          $route: {
            fullPath
          },
          $toast: mock.toast
        }
      },
      props: {
        user
      },
      data () {
        return values
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, user: any) => {
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.vm.$data.query).toEqual({ name: user.name, email: user.email, password: '', password_confirmation: '', current_password: '' })
  }

  // テストケース
  it('表示される', async () => {
    const user = Object.freeze({ name: 'user1の氏名', email: 'user1@example.com', unconfirmed_email: 'new@example.com' })
    const wrapper = mountFunction(user)
    viewTest(wrapper, user)

    // 変更ボタン
    const button: any = wrapper.find('#user_update_btn')
    expect(button.exists()).toBe(true)
    await helper.waitChangeDisabled(button, true)
    expect(button.element.disabled).toBe(true) // 無効

    // 入力
    wrapper.find('#input_current_password').setValue('abc12345')
    wrapper.vm.$data.showPassword = true

    // 変更ボタン
    await helper.waitChangeDisabled(button, false)
    expect(button.element.disabled).toBe(false) // 有効
  })

  describe('ユーザー情報変更', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', user: { name: 'user1の氏名' } })
    const user = Object.freeze({ name: 'user1の氏名', email: 'user1@example.com', unconfirmed_email: 'new@example.com' })
    const params = Object.freeze({ name: 'updateの氏名', email: 'update@example.com', password: 'update12345', password_confirmation: 'update12345', current_password: 'abc12345' })
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userUpdateUrl, 'POST', {
        ...params,
        confirm_redirect_url: helper.envConfig.frontBaseURL + helper.commonConfig.authRedirectSignInURL
      })
    }

    let wrapper: any, button: any
    const beforeAction = async () => {
      wrapper = mountFunction(user, { query: params })
      button = wrapper.find('#user_update_btn')
      button.trigger('click')
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[成功]トップページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.mockCalledTest(mock.setData, 1, data)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 406 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { ...data, errors: { password: ['errorメッセージ'] } }])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.emitMessageTest(wrapper, data)
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.emitMessageTest(wrapper, { alert: helper.locales.system.default, notice: null })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
