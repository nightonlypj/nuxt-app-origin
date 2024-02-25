import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { dateFormat, dateTimeFormat, timeZoneOffset, timeZoneShortName } from '~/utils/display'
import { apiRequestURL } from '~/utils/api'
import helper from '~/test/helper'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Component from '~/components/invitations/Update.vue'
import { activeUser, destroyUser } from '~/test/data/user'
import { detail as space } from '~/test/data/spaces'
import { detailActive, detailExpired, detailDeleted, detailEmailJoined } from '~/test/data/invitations'

const $config = config.global.mocks.$config
const $t = config.global.mocks.$t

describe('Update.vue', () => {
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
  const fullPath = `/invitations/${space.code}`

  const mountFunction = (loggedIn = true, user: object | null = activeUser) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)
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
          AppRequiredLabel: true,
          UsersAvatar: true
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
  const viewTest = async (wrapper: any, invitation: any, show: any = { delete: null, undoDelete: null }) => {
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)

    // 変更ダイアログ
    expect(wrapper.find('#invitation_update_dialog').exists()).toBe(false)

    // ダイアログ表示
    wrapper.vm.showDialog(invitation)
    await flushPromises()

    // 変更ダイアログ
    const dialog = wrapper.find('#invitation_update_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // 作成、更新
    const usersAvatars = wrapper.findAllComponents(UsersAvatar)
    expect(usersAvatars.at(0).vm.$props.user).toEqual(invitation.created_user)
    expect(dialog.text()).toMatch(dateTimeFormat.value(helper.locale, invitation.created_at))
    if (invitation.last_updated_user != null || invitation.last_updated_at != null) {
      expect(usersAvatars.at(1).vm.$props.user).toEqual(invitation.last_updated_user)
      expect(dialog.text()).toMatch(dateTimeFormat.value(helper.locale, invitation.last_updated_at, 'N/A'))
      expect(usersAvatars.length).toBe(2)
    } else {
      expect(usersAvatars.length).toBe(1)
    }

    // ラベル
    expect(wrapper.findComponent(AppRequiredLabel).exists()).toBe(true)

    // 招待URL
    expect(dialog.text()).toMatch(`${location.protocol}//${location.host}/users/sign_up?code=${invitation.code}`)

    // メールアドレス
    if (invitation.email != null) {
      expect(dialog.text()).toMatch(invitation.email)
    } else {
      for (const domain of invitation.domains) {
        expect(dialog.text()).toMatch(`*@${domain}`)
      }
    }

    // 権限
    expect(dialog.text()).toMatch(invitation.power_i18n)

    // 期限
    expect(dialog.text()).toMatch(`${timeZoneOffset.value}(${timeZoneShortName.value})`)

    // 削除
    expect(wrapper.find('#invitation_update_delete_check').exists()).toBe(show.delete)
    if (show.delete) {
      expect(dialog.text()).toMatch(String(invitation.destroy_schedule_days)) // 招待削除の猶予期間
    }

    // 削除取り消し
    expect(wrapper.find('#invitation_update_undo_delete_check').exists()).toBe(show.undoDelete)
    if (show.undoDelete) {
      expect(dialog.text()).toMatch(dateTimeFormat.value(helper.locale, invitation.destroy_requested_at)) // 削除依頼日時
      expect(dialog.text()).toMatch(dateFormat.value(helper.locale, invitation.destroy_schedule_at)) // 削除予定日
    }

    // 変更ボタン
    const submitButton = wrapper.find('#invitation_update_submit_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.element.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#invitation_update_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.element.disabled).toBe(false) // 有効
    cancelButton.trigger('click')
    await flushPromises()

    // 変更ダイアログ
    expect(dialog.isDisabled()).toBe(false) // 無効（非表示）
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, null)

    // ダイアログ表示
    wrapper.vm.showDialog(detailActive)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { info: $t('auth.unauthenticated') })
    helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
    helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
  })
  describe('ログイン中', () => {
    it('[有効]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { ...detailActive } }])
      const wrapper = mountFunction(true)
      await viewTest(wrapper, detailActive, { delete: true, undoDelete: false })
    })
    it('[期限切れ]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { ...detailExpired } }])
      const wrapper = mountFunction(true)
      await viewTest(wrapper, detailExpired, { delete: false, undoDelete: false })
    })
    it('[削除済み]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { ...detailDeleted } }])
      const wrapper = mountFunction(true)
      await viewTest(wrapper, detailDeleted, { delete: false, undoDelete: true })
    })
    it('[参加済み]表示されない', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { ...detailEmailJoined } }])
      const wrapper = mountFunction(true)

      // ダイアログ表示
      wrapper.vm.showDialog(detailEmailJoined)
      await flushPromises()

      helper.toastMessageTest(mock.toast, { error: $t('alert.invitation.email_joined') })

      // 変更ダイアログ
      expect(wrapper.find('#invitation_update_dialog').exists()).toBe(false)
    })
  })
  it('[ログイン中（削除予約済み）]表示されない', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { ...detailActive } }])
    const wrapper = mountFunction(true, destroyUser)

    // ダイアログ表示
    wrapper.vm.showDialog(detailActive)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: $t('auth.destroy_reserved') })

    // 変更ダイアログ
    expect(wrapper.find('#invitation_update_dialog').exists()).toBe(false)
  })

  describe('招待URL詳細取得', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, apiRequestURL(helper.locale, $config.public.invitations.detailUrl.replace(':space_code', space.code).replace(':code', detailActive.code)))
    }

    const beforeAction = async () => {
      const wrapper = mountFunction()

      // ダイアログ表示
      wrapper.vm.showDialog(detailActive)
      await flushPromises()

      apiCalledTest()
    }

    it('[データなし]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: $t('system.error') } })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: $t('network.failure') } })
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
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: messages })
    })
    it('[権限エラー（メッセージなし）]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: { alert: $t('auth.forbidden') } })
    })
    it('[存在しない]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: messages })
    })
    it('[存在しない（メッセージなし）]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: {} })
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: $t('network.error') } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: $t('system.default') } })
    })
  })

  describe('招待URL設定変更', () => {
    const defaultValues = Object.freeze({
      ended_date: '9999-12-31',
      ended_time: '23:59',
      ended_zone: timeZoneOffset.value,
      memo: '更新メモ'
    })
    const apiCalledTest = (values: object) => {
      expect(mock.useApiRequest).toBeCalledTimes(2)
      expect(mock.useApiRequest).nthCalledWith(2, apiRequestURL(helper.locale, $config.public.invitations.updateUrl.replace(':space_code', space.code).replace(':code', detailActive.code)), 'POST', {
        invitation: values
      })
    }

    let wrapper: any, dialog: any, button: any
    const beforeAction = async (updateResponse: any, invitation: any = detailActive, values: any = defaultValues) => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200 }, { invitation: { ...invitation } }])
        .mockImplementationOnce(() => updateResponse)
      wrapper = mountFunction()
      wrapper.vm.showDialog(invitation)
      await flushPromises()

      // 変更ダイアログ
      dialog = wrapper.find('#invitation_update_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // 入力
      wrapper.find('#invitation_update_ended_date_text').setValue(values.ended_date)
      wrapper.find('#invitation_update_ended_time_text').setValue(values.ended_time)
      wrapper.find('#invitation_update_memo_text').setValue(values.memo)
      if (values.delete) { wrapper.find('#invitation_update_delete_check').setValue(true) }
      if (values.undo_delete) { wrapper.find('#invitation_update_undo_delete_check').setValue(true) }
      await flushPromises()

      // 変更ボタン
      button = wrapper.find('#invitation_update_submit_btn')
      expect(button.element.disabled).toBe(false) // 有効
      button.trigger('click')
      await flushPromises()

      apiCalledTest(values)
    }

    it('[成功]一覧の対象データが更新される', async () => {
      await beforeAction([{ ok: true, status: 200 }, { ...messages, invitation: detailActive }], detailActive, defaultValues)

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, success: messages.notice })
      expect(wrapper.emitted().update).toEqual([[detailActive]]) // 招待URL情報更新
      expect(dialog.isDisabled()).toBe(false) // 無効（非表示）
    })
    it('[成功（削除）]一覧の対象データが更新される', async () => {
      await beforeAction([{ ok: true, status: 200 }, { ...messages, invitation: detailDeleted }], detailActive, { ...defaultValues, delete: true })

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, success: messages.notice })
      expect(wrapper.emitted().update).toEqual([[detailDeleted]]) // 招待URL情報更新
      expect(dialog.isDisabled()).toBe(false) // 無効（非表示）
    })
    it('[成功（削除取り消し）]一覧の対象データが更新される', async () => {
      await beforeAction([{ ok: true, status: 200 }, { ...messages, invitation: detailActive }], detailDeleted, { ...defaultValues, undo_delete: true })

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, success: messages.notice })
      expect(wrapper.emitted().update).toEqual([[detailActive]]) // 招待URL情報更新
      expect(dialog.isDisabled()).toBe(false) // 無効（非表示）
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: true, status: 200 }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('system.error') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: null }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('network.failure') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      await beforeAction([{ ok: false, status: 401 }, messages])

      helper.mockCalledTest(mock.useAuthSignOut, 1, helper.locale, true)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー（メッセージなし）]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      await beforeAction([{ ok: false, status: 401 }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 1, helper.locale, true)
      helper.toastMessageTest(mock.toast, { info: $t('auth.unauthenticated') })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 403 }, messages])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[権限エラー（メッセージなし）]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 403 }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('auth.forbidden') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 406 }, messages])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[削除予約済み（メッセージなし）]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 406 }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('auth.destroy_reserved') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 500 }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('network.error') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 422 }, { ...messages, errors: { email: ['errorメッセージ'] } }])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 400 }, {}])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('system.default') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
  })
})
