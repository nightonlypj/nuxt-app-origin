import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { apiRequestURL } from '~/utils/api'
import helper from '~/test/helper'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import Component from '~/components/members/Create.vue'
import { activeUser, destroyUser } from '~/test/data/user'
import { detail as space } from '~/test/data/spaces'

const $config = config.global.mocks.$config
const $t = config.global.mocks.$t
const $tm = config.global.mocks.$tm

describe('Create.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      toast: helper.mockToast
    }
  })
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  const fullPath = `/members/${space.code}`

  const mountFunction = (loggedIn = true, user: object | null = activeUser) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn,
        user
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({ fullPath })))

    const wrapper = mount(Component, {
      global: {
        stubs: {
          AppProcessing: true,
          AppRequiredLabel: true
        }
      },
      props: {
        space
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper: any) => {
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)

    // 表示ボタン
    const button = wrapper.find('#member_create_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await flushPromises()

    // 招待ダイアログ
    const dialog = wrapper.find('#member_create_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // ラベル
    expect(wrapper.findComponent(AppRequiredLabel).exists()).toBe(true)

    // 権限
    for (const key in $tm('enums.member.power')) {
      const power = wrapper.find(`#member_create_power_${key}`)
      expect(power.exists()).toBe(true)
      expect(power.element.checked).toBe(false) // 未選択
    }
    await flushPromises()

    // 招待ボタン
    const submitButton = wrapper.find('#member_create_submit_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.element.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#member_create_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.element.disabled).toBe(false) // 有効
    cancelButton.trigger('click')
    await flushPromises()

    // 招待ダイアログ
    expect(dialog.isDisabled()).toBe(false) // 無効（非表示）
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, null)

    // 表示ボタン
    const button = wrapper.find('#member_create_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await flushPromises()

    helper.toastMessageTest(mock.toast, { info: $t('auth.unauthenticated') })
    helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
    helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
  })
  it('[ログイン中]表示される', async () => {
    const wrapper = mountFunction(true)
    await viewTest(wrapper)
  })
  it('[ログイン中（削除予約済み）]表示されない', async () => {
    const wrapper = mountFunction(true, destroyUser)

    // 表示ボタン
    const button = wrapper.find('#member_create_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: $t('auth.destroy_reserved') })

    // 招待ダイアログ
    expect(wrapper.find('#member_create_dialog').exists()).toBe(false)
  })

  describe('メンバー招待', () => {
    const values = Object.freeze({ emails: 'user1@example.com', power: 'admin' })
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, apiRequestURL.value(helper.locale, $config.public.members.createUrl.replace(':space_code', space.code)), 'POST', {
        member: values
      })
    }

    let wrapper: any, dialog: any, button: any
    const beforeAction = async () => {
      wrapper = mountFunction()
      wrapper.find('#member_create_btn').trigger('click')
      await flushPromises()

      // 招待ダイアログ
      dialog = wrapper.find('#member_create_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // 入力
      wrapper.find('#member_create_emails_text').setValue(values.emails)
      wrapper.find(`#member_create_power_${values.power}`).setValue(true)
      await flushPromises()

      // 招待ボタン
      button = wrapper.find('#member_create_submit_btn')
      expect(button.element.disabled).toBe(false) // 有効
      button.trigger('click')
      await flushPromises()

      apiCalledTest()
    }

    it('[成功]メンバー招待結果が表示され、一覧が再取得される', async () => {
      const data = Object.freeze({ ...messages, email: {}, emails: [] })
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, success: messages.notice })
      expect(wrapper.emitted().result).toEqual([[data]]) // メンバー招待結果表示
      expect(wrapper.emitted().reload).toEqual([[]]) // メンバー一覧再取得
      expect(dialog.isDisabled()).toBe(false) // 無効（非表示）
      expect(wrapper.vm.member).toEqual({}) // 初期化
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('system.error') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('network.failure') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, helper.locale, true)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー（メッセージなし）]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, helper.locale, true)
      helper.toastMessageTest(mock.toast, { info: $t('auth.unauthenticated') })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[権限エラー（メッセージなし）]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('auth.forbidden') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 406 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[削除予約済み（メッセージなし）]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 406 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('auth.destroy_reserved') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('network.error') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { ...messages, errors: { email: ['errorメッセージ'] } }])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('system.default') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
  })
})
