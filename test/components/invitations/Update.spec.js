import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Processing from '~/components/Processing.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Component from '~/components/invitations/Update.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Update.vue', () => {
  let axiosGetMock, axiosPostMock, authRedirectMock, authLogoutMock, toastedErrorMock, toastedInfoMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    axiosPostMock = null
    authRedirectMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    nuxtErrorMock = jest.fn()
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

  const mountFunction = (loggedIn = true, user = {}) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        Processing: true,
        UsersAvatar: true
      },
      propsData: {
        space
      },
      mocks: {
        $axios: {
          get: axiosGetMock,
          post: axiosPostMock
        },
        $auth: {
          loggedIn,
          user: { ...user },
          redirect: authRedirectMock,
          logout: authLogoutMock
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        },
        $nuxt: {
          error: nuxtErrorMock
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper, invitation, show = { delete: null, undoDelete: null }) => {
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // 変更ダイアログ
    expect(wrapper.find('#invitation_update_dialog').exists()).toBe(false)

    // ダイアログ表示
    wrapper.vm.showDialog(invitation)
    await helper.sleep(1)

    // 変更ダイアログ
    const dialog = wrapper.find('#invitation_update_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // 作成、更新
    const usersAvatars = wrapper.findAllComponents(UsersAvatar)
    expect(usersAvatars.at(0).vm.$props.user).toBe(invitation.created_user)
    expect(dialog.text()).toMatch(wrapper.vm.$timeFormat('ja', invitation.created_at))
    if (invitation.last_updated_user != null || invitation.last_updated_at != null) {
      expect(usersAvatars.at(1).vm.$props.user).toBe(invitation.last_updated_user)
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
    expect(wrapper.find('#invitation_delete_check').exists()).toBe(show.delete)
    if (show.delete) {
      expect(dialog.text()).toMatch(String(invitation.destroy_schedule_days)) // 招待削除の猶予期間
    }

    // 削除取り消し
    expect(wrapper.find('#invitation_undo_delete_check').exists()).toBe(show.undoDelete)
    if (show.undoDelete) {
      expect(dialog.text()).toMatch(wrapper.vm.$timeFormat('ja', invitation.destroy_requested_at)) // 削除依頼日時
      expect(dialog.text()).toMatch(wrapper.vm.$dateFormat('ja', invitation.destroy_schedule_at)) // 削除予定日
    }

    // 変更ボタン
    const submitButton = wrapper.find('#invitation_update_submit_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.vm.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#invitation_update_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.vm.disabled).toBe(false) // 有効
    cancelButton.trigger('click')
    await helper.sleep(1)

    // 変更ダイアログ
    expect(dialog.isVisible()).toBe(false) // 非表示
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false)

    // ダイアログ表示
    wrapper.vm.showDialog(invitationActive)
    await helper.sleep(1)

    helper.mockCalledTest(toastedErrorMock, 0)
    helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
    helper.mockCalledTest(authRedirectMock, 1, 'login')
  })
  describe('ログイン中', () => {
    it('[有効]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { invitation: { ...invitationActive } } }))
      const wrapper = mountFunction(true, {})
      await viewTest(wrapper, invitationActive, { delete: true, undoDelete: false })
    })
    it('[期限切れ]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { invitation: { ...invitationExpired } } }))
      const wrapper = mountFunction(true, {})
      await viewTest(wrapper, invitationExpired, { delete: false, undoDelete: false })
    })
    it('[削除済み]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { invitation: { ...invitationDeleted } } }))
      const wrapper = mountFunction(true, {})
      await viewTest(wrapper, invitationDeleted, { delete: false, undoDelete: true })
    })
    it('[参加済み]表示されない', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { invitation: { ...invitationEmailJoined } } }))
      const wrapper = mountFunction(true, {})

      // ダイアログ表示
      wrapper.vm.showDialog(invitationEmailJoined)
      await helper.sleep(1)

      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.alert.invitation.email_joined)
      helper.mockCalledTest(toastedInfoMock, 0)

      // 変更ダイアログ
      expect(wrapper.find('#invitation_update_dialog').exists()).toBe(false)
    })
  })
  it('[ログイン中（削除予約済み）]表示されない', async () => {
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { invitation: { ...invitationActive } } }))
    const wrapper = mountFunction(true, { destroy_schedule_at: '2000-01-08T12:34:56+09:00' })

    // ダイアログ表示
    wrapper.vm.showDialog(invitationActive)
    await helper.sleep(1)

    helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
    helper.mockCalledTest(toastedInfoMock, 0)

    // 変更ダイアログ
    expect(wrapper.find('#invitation_update_dialog').exists()).toBe(false)
  })

  describe('招待URL詳細取得', () => {
    const beforeAction = async () => {
      const wrapper = mountFunction()

      // ダイアログ表示
      wrapper.vm.showDialog(invitationActive)
      await helper.sleep(1)

      apiCalledTest()
    }
    const apiCalledTest = () => {
      expect(axiosGetMock).toBeCalledTimes(1)
      const url = helper.commonConfig.invitations.detailUrl.replace(':space_code', space.code).replace(':code', invitationActive.code)
      expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + url)
    }

    it('[データなし]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.system.error })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: null, alert: helper.locales.network.failure })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 500, alert: helper.locales.network.error })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 400, alert: helper.locales.system.default })
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
      expect(axiosPostMock).toBeCalledTimes(1)
      const url = helper.commonConfig.invitations.updateUrl.replace(':space_code', space.code).replace(':code', invitationActive.code)
      expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + url, {
        invitation: values
      })
    }

    let wrapper, dialog, button
    const beforeAction = async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { invitation: { ...invitationActive } } }))
      wrapper = mountFunction()
      wrapper.vm.showDialog(invitationActive)
      await helper.sleep(1)

      // 変更ダイアログ
      dialog = wrapper.find('#invitation_update_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // 変更
      wrapper.find('#invitation_delete_check').trigger('change')
      wrapper.vm.$data.invitation = { ...invitationActive, ...values }

      // 変更ボタン
      button = wrapper.find('#invitation_update_submit_btn')
      await helper.waitChangeDisabled(button, false)
      expect(button.vm.disabled).toBe(false) // 有効
      button.trigger('click')
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[成功]一覧の対象データが更新される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      expect(wrapper.emitted().update).toEqual([[data.invitation]]) // 招待URL情報更新
      expect(dialog.isVisible()).toBe(false) // 非表示
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 403 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.forbidden)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 406 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { email: ['errorメッセージ'] } }, data) } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.disabledTest(wrapper, Processing, button, true) // 無効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
  })
})
