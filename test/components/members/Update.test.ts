import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Component from '~/components/members/Update.vue'

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
  const memberCreated = Object.freeze({
    user: {
      code: 'code000000000000000000001',
      email: 'user1@example.com'
    },
    power: 'admin'
  })
  const memberInvitationed = Object.freeze({
    ...memberCreated,
    invitationed_user: {
      code: 'code000000000000000000001'
    },
    invitationed_at: '2000-01-01T12:34:56+09:00'
  })
  const memberUpdated = Object.freeze({
    ...memberCreated,
    last_updated_user: {
      code: 'code000000000000000000002'
    },
    last_updated_at: '2000-01-02T12:34:56+09:00'
  })

  const fullPath = '/members/code0001'
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
          AppRequiredLabel: true,
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
  const viewTest = async (wrapper: any, member: any) => {
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)

    // 変更ダイアログ
    expect(wrapper.find('#member_update_dialog').exists()).toBe(false)

    // ダイアログ表示
    wrapper.vm.showDialog(member)
    await flushPromises()

    // 変更ダイアログ
    const dialog = wrapper.find('#member_update_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // ラベル
    expect(wrapper.findComponent(AppRequiredLabel).exists()).toBe(true)

    // メンバー
    const usersAvatars = wrapper.findAllComponents(UsersAvatar)
    expect(usersAvatars.at(0).exists()).toBe(true)
    expect(usersAvatars.at(0).vm.user).toEqual(member.user) // 表示
    expect(dialog.text()).toMatch(member.user.email) // メールアドレス

    // 招待、更新
    let index = 1
    if (member.invitationed_user != null || member.invitationed_at != null) {
      expect(usersAvatars.at(index).vm.$props.user).toBe(member.invitationed_user)
      expect(dialog.text()).toMatch(wrapper.vm.$timeFormat('ja', member.invitationed_at, 'N/A'))
      index += 1
    }
    if (member.last_updated_user != null || member.last_updated_at != null) {
      expect(usersAvatars.at(index).vm.$props.user).toBe(member.last_updated_user)
      expect(dialog.text()).toMatch(wrapper.vm.$timeFormat('ja', member.last_updated_at, 'N/A'))
      index += 1
    }
    expect(usersAvatars.length).toBe(index)

    // 権限
    for (const key in helper.locales.enums.member.power) {
      const power = wrapper.find(`#member_update_power_${key}`)
      expect(power.exists()).toBe(true)
      expect(power.element.checked).toBe(key === member.power) // [現在の権限]選択
    }

    // 変更ボタン
    const submitButton = wrapper.find('#member_update_submit_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.element.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#member_update_cancel_btn')
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
    wrapper.vm.showDialog(memberCreated)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
    helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
    helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
  })
  describe('ログイン中', () => {
    it('[招待なし]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { member: memberCreated }])
      const wrapper = mountFunction(true)
      await viewTest(wrapper, memberCreated)
    })
    it('[招待あり]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { member: memberInvitationed }])
      const wrapper = mountFunction(true)
      await viewTest(wrapper, memberInvitationed)
    })
    it('[更新あり]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { member: memberUpdated }])
      const wrapper = mountFunction(true)
      await viewTest(wrapper, memberUpdated)
    })
  })
  it('[ログイン中（削除予約済み）]表示されない', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { member: memberCreated }])
    const wrapper = mountFunction(true, { destroy_schedule_at: '2000-01-08T12:34:56+09:00' })

    // ダイアログ表示
    wrapper.vm.showDialog(memberCreated)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })

    // 変更ダイアログ
    expect(wrapper.find('#member_update_dialog').exists()).toBe(false)
  })

  describe('メンバー詳細取得', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      const url = helper.commonConfig.members.detailUrl.replace(':space_code', space.code).replace(':user_code', memberCreated.user.code)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + url)
    }

    const beforeAction = async () => {
      const wrapper = mountFunction()

      // ダイアログ表示
      wrapper.vm.showDialog(memberCreated)
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

  describe('メンバー情報変更', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', member: memberCreated })
    const values = Object.freeze({ power: 'writer' })
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(2)
      const url = helper.commonConfig.members.updateUrl.replace(':space_code', space.code).replace(':user_code', memberCreated.user.code)
      expect(mock.useApiRequest).nthCalledWith(2, helper.envConfig.apiBaseURL + url, 'POST', {
        member: values
      })
    }

    let wrapper: any, dialog: any, button: any
    const beforeAction = async (updateResponse: any) => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200 }, { member: { ...memberCreated } }])
        .mockImplementationOnce(() => updateResponse)
      wrapper = mountFunction()
      wrapper.vm.showDialog(memberCreated)
      await flushPromises()

      // 変更ダイアログ
      dialog = wrapper.find('#member_update_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // 入力
      wrapper.find(`#member_update_power_${values.power}`).setValue(true)
      await flushPromises()

      // 変更ボタン
      button = wrapper.find('#member_update_submit_btn')
      expect(button.element.disabled).toBe(false) // 有効
      button.trigger('click')
      await flushPromises()

      apiCalledTest()
    }

    it('[成功]一覧の対象データが更新される', async () => {
      await beforeAction([{ ok: true, status: 200 }, data])

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      expect(wrapper.emitted().update).toEqual([[data.member]]) // メンバー情報更新
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
