import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppProcessing from '~/components/app/Processing.vue'
import Component from '~/components/users/update/Data.vue'
import { activeUser } from '~/test/data/user'

const $config = config.global.mocks.$config
const $t = config.global.mocks.$t

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
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  const fullPath = '/users/update'

  const mountFunction = (user: object, values = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn: true,
        setData: mock.setData
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({
      fullPath
    })))

    const wrapper: any = mount(Component, {
      global: {
        stubs: {
          AppProcessing: true
        }
      },
      props: {
        user
      }
    })
    expect(wrapper.vm).toBeTruthy()
    for (const [key, value] of Object.entries(values)) { wrapper.vm[key] = value }
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, user: any) => {
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.vm.query).toEqual({ name: user.name, email: user.email, password: '', password_confirmation: '', current_password: '' })

    if (user.unconfirmed_email != null) { expect(wrapper.text()).toMatch(user.unconfirmed_email) }
  }

  // テストケース
  it('表示される（メール確認済み）', async () => {
    const user = Object.freeze({ name: 'user1の氏名', email: 'user1@example.com', unconfirmed_email: null })
    const wrapper = mountFunction(user)
    viewTest(wrapper, user)
    await flushPromises()

    // 変更ボタン
    const button: any = wrapper.find('#user_update_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(true) // 無効

    // 入力
    wrapper.find('#user_update_current_password_text').setValue('abc12345')
    wrapper.vm.showPassword = true
    await flushPromises()

    // 変更ボタン
    expect(button.element.disabled).toBe(false) // 有効

    // 入力
    wrapper.find('#user_update_name_text').setValue('newの氏名')
    wrapper.find('#user_update_email_text').setValue('new@example.com')
    wrapper.find('#user_update_password_text').setValue('new12345')
    wrapper.find('#user_update_password_confirmation_text').setValue('new12345')
    await flushPromises()

    // 変更ボタン
    expect(button.element.disabled).toBe(false) // 有効
  })
  it('表示される（メールアドレス変更中）', () => {
    const user = Object.freeze({ name: 'user1の氏名', email: 'user1@example.com', unconfirmed_email: 'new@example.com' })
    const wrapper = mountFunction(user)
    viewTest(wrapper, user)
  })

  describe('ユーザー情報変更', () => {
    const user = Object.freeze({
      name: 'user1の氏名',
      email: 'user1@example.com',
      unconfirmed_email: 'new@example.com'
    })
    const params = Object.freeze({
      name: 'updateの氏名',
      email: 'update@example.com',
      password: 'update12345',
      password_confirmation: 'update12345',
      current_password: 'abc12345'
    })
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, $config.public.apiBaseURL + $config.public.userUpdateUrl, 'POST', {
        ...params,
        confirm_redirect_url: $config.public.frontBaseURL + $config.public.authRedirectSignInURL
      })
    }

    let wrapper: any, button: any
    const beforeAction = async () => {
      wrapper = mountFunction(user, { query: params, ...messages })
      button = wrapper.find('#user_update_btn')
      button.trigger('click')
      await flushPromises()

      apiCalledTest()
    }

    it('[成功]トップページにリダイレクトされる', async () => {
      const data = Object.freeze({ ...messages, user: activeUser })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.mockCalledTest(mock.setData, 1, data)
      helper.toastMessageTest(mock.toast, { error: messages.alert, success: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, '/')
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('system.error') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('network.failure') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー（メッセージなし）]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: $t('auth.unauthenticated') })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 406 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[削除予約済み（メッセージなし）]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 406 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('auth.destroy_reserved') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('network.error') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { ...messages, errors: { password: ['errorメッセージ'] } }])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.emitMessageTest(wrapper, messages)
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.emitMessageTest(wrapper, { alert: $t('system.default'), notice: '' })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
