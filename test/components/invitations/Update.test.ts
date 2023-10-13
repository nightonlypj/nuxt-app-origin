import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppProcessing from '~/components/app/Processing.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Component from '~/components/invitations/Update.vue'

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

  const space = Object.freeze({ code: 'code0001' })
  const defaultInvitation = Object.freeze({
    code: 'invitation000000000000001',
    power: 'admin',
    power_i18n: '管理者',
    created_user: {
      code: 'code000000000000000000001'
    },
    created_at: '2000-01-01T12:34:56+09:00',
    destroy_schedule_days: 789
  })
  const invitationActive = Object.freeze({
    ...defaultInvitation,
    status: 'active',
    domains: ['a.example.com', 'b.example.com'],
    memo: 'メモ'
  })
  const invitationExpired = Object.freeze({
    ...defaultInvitation,
    status: 'expired',
    domains: ['example.com'],
    ended_at: '2000-01-31T12:34:56+09:00',
    last_updated_user: {
      code: 'code000000000000000000002'
    },
    last_updated_at: '2000-01-02T12:34:56+09:00'
  })
  const invitationDeleted = Object.freeze({
    ...defaultInvitation,
    status: 'deleted',
    domains: ['example.com'],
    memo: 'メモ',
    destroy_requested_at: '2000-01-02T12:34:56+09:00',
    destroy_schedule_at: '2000-01-09T12:34:56+09:00',
    created_user: {
      deleted: true
    },
    last_updated_user: {
      deleted: true
    },
    last_updated_at: '2000-01-02T12:34:56+09:00'
  })
  const invitationEmailJoined = Object.freeze({
    ...defaultInvitation,
    status: 'email_joined',
    email: 'user1@example.com',
    email_joined_at: '2000-01-02T12:34:56+09:00'
  })

  const fullPath = '/invitations/code0001'
  const mountFunction = (loggedIn = true, user: object | null = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)

    const wrapper = mount(Component, {
      global: {
        stubs: {
          AppProcessing: true,
          UsersAvatar: true
        },
        mocks: {
          $auth: {
            loggedIn,
            user
          },
          $route: {
            fullPath
          },
          $toast: mock.toast
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
    expect(dialog.text()).toMatch(wrapper.vm.$timeFormat('ja', invitation.created_at))
    if (invitation.last_updated_user != null || invitation.last_updated_at != null) {
      expect(usersAvatars.at(1).vm.$props.user).toEqual(invitation.last_updated_user)
      expect(dialog.text()).toMatch(wrapper.vm.$timeFormat('ja', invitation.last_updated_at, 'N/A'))
      expect(usersAvatars.length).toBe(2)
    } else {
      expect(usersAvatars.length).toBe(1)
    }

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
    expect(dialog.text()).toMatch(`${helper.envConfig.timeZoneOffset}(${helper.envConfig.timeZoneShort})`)

    // 削除
    expect(wrapper.find('#invitation_update_delete_check').exists()).toBe(show.delete)
    if (show.delete) {
      expect(dialog.text()).toMatch(String(invitation.destroy_schedule_days)) // 招待削除の猶予期間
    }

    // 削除取り消し
    expect(wrapper.find('#invitation_update_undo_delete_check').exists()).toBe(show.undoDelete)
    if (show.undoDelete) {
      expect(dialog.text()).toMatch(wrapper.vm.$timeFormat('ja', invitation.destroy_requested_at)) // 削除依頼日時
      expect(dialog.text()).toMatch(wrapper.vm.$dateFormat('ja', invitation.destroy_schedule_at)) // 削除予定日
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
    expect(dialog.isDisabled()).toBe(false) // 非表示
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, null)

    // ダイアログ表示
    wrapper.vm.showDialog(invitationActive)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
    helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
    helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
  })
  describe('ログイン中', () => {
    it('[有効]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { ...invitationActive } }])
      const wrapper = mountFunction(true)
      await viewTest(wrapper, invitationActive, { delete: true, undoDelete: false })
    })
    it('[期限切れ]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { ...invitationExpired } }])
      const wrapper = mountFunction(true)
      await viewTest(wrapper, invitationExpired, { delete: false, undoDelete: false })
    })
    it('[削除済み]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { ...invitationDeleted } }])
      const wrapper = mountFunction(true)
      await viewTest(wrapper, invitationDeleted, { delete: false, undoDelete: true })
    })
    it('[参加済み]表示されない', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { ...invitationEmailJoined } }])
      const wrapper = mountFunction(true)

      // ダイアログ表示
      wrapper.vm.showDialog(invitationEmailJoined)
      await flushPromises()

      helper.toastMessageTest(mock.toast, { error: helper.locales.alert.invitation.email_joined })

      // 変更ダイアログ
      expect(wrapper.find('#invitation_update_dialog').exists()).toBe(false)
    })
  })
  it('[ログイン中（削除予約済み）]表示されない', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { invitation: { ...invitationActive } }])
    const wrapper = mountFunction(true, { destroy_schedule_at: '2000-01-08T12:34:56+09:00' })

    // ダイアログ表示
    wrapper.vm.showDialog(invitationActive)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })

    // 変更ダイアログ
    expect(wrapper.find('#invitation_update_dialog').exists()).toBe(false)
  })

  describe('招待URL詳細取得', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      const url = helper.commonConfig.invitations.detailUrl.replace(':space_code', space.code).replace(':code', invitationActive.code)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + url)
    }

    const beforeAction = async () => {
      const wrapper = mountFunction()

      // ダイアログ表示
      wrapper.vm.showDialog(invitationActive)
      await flushPromises()

      apiCalledTest()
    }

    it('[データなし]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error, notice: null } })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure, notice: null } })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error, notice: null } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default, notice: null } })
    })
  })

  describe('招待URL設定変更', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', invitation: invitationActive })
    const values = Object.freeze({
      ended_date: '9999-12-31',
      ended_time: '23:59',
      ended_zone: helper.envConfig.timeZoneOffset,
      memo: '更新メモ',
      delete: true
      // TODO: undo_delete
    })
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(2)
      const url = helper.commonConfig.invitations.updateUrl.replace(':space_code', space.code).replace(':code', invitationActive.code)
      expect(mock.useApiRequest).nthCalledWith(2, helper.envConfig.apiBaseURL + url, 'POST', {
        invitation: values
      })
    }

    let wrapper: any, dialog: any, button: any
    const beforeAction = async (updateResponse: any) => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200 }, { invitation: { ...invitationActive } }])
        .mockImplementationOnce(() => updateResponse)
      wrapper = mountFunction()
      wrapper.vm.showDialog(invitationActive)
      await flushPromises()

      // 変更ダイアログ
      dialog = wrapper.find('#invitation_update_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // 入力
      wrapper.find('#invitation_update_ended_date_text').setValue(values.ended_date)
      wrapper.find('#invitation_update_ended_time_text').setValue(values.ended_time)
      wrapper.find('#invitation_update_memo_text').setValue(values.memo)
      wrapper.find('#invitation_update_delete_check').setValue(values.delete)
      await flushPromises()

      // 変更ボタン
      button = wrapper.find('#invitation_update_submit_btn')
      expect(button.element.disabled).toBe(false) // 有効
      button.trigger('click')
      await flushPromises()

      apiCalledTest()
    }

    it('[成功]一覧の対象データが更新される', async () => {
      await beforeAction([{ ok: true, status: 200 }, data])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      expect(wrapper.emitted().update).toEqual([[data.invitation]]) // 招待URL情報更新
      expect(dialog.isDisabled()).toBe(false) // 非表示
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: true, status: 200 }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: null }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      await beforeAction([{ ok: false, status: 401 }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 403 }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.forbidden })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 406 }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 500 }, null])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 422 }, Object.assign({ errors: { email: ['errorメッセージ'] } }, data)])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: data.alert, info: data.notice })
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 400 }, {}])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.default })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
  })
})
