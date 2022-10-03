import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Component from '~/components/members/Update.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Update.vue', () => {
  let axiosPostMock, authLogoutMock, toastedErrorMock, toastedInfoMock

  beforeEach(() => {
    axiosPostMock = null
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
  })

  const space = Object.freeze({ code: 'code0001' })
  const member = Object.freeze({ user: { code: 'code000000000000000000001' }, power: 'admin' })

  const mountFunction = () => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        Processing: true,
        Message: true,
        UsersAvatar: true
      },
      mocks: {
        $axios: {
          post: axiosPostMock
        },
        $auth: {
          loggedIn: true,
          logout: authLogoutMock
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper) => {
    // 前回メッセージ
    wrapper.vm.$data.alert = 'alertメッセージ'
    wrapper.vm.$data.notice = 'noticeメッセージ'

    // メンバー情報変更ダイアログ
    expect(wrapper.find('#member_update_dialog').exists()).toBe(false)

    // ダイアログ表示
    wrapper.vm.showDialog(space, member)
    await helper.sleep(1)

    // 初期化
    expect(wrapper.vm.$data.alert).toBeNull()
    expect(wrapper.vm.$data.notice).toBeNull()

    // メンバー情報変更ダイアログ
    const dialog = wrapper.find('#member_update_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // メンバー
    const avatar = wrapper.findComponent(UsersAvatar)
    expect(avatar.exists()).toBe(true)
    expect(avatar.vm.user).toEqual(member.user) // 表示

    // 権限
    for (const key in helper.locales.enums.member.power) {
      const power = wrapper.find('#power_' + key)
      expect(power.exists()).toBe(true)
      expect(power.element.checked).toBe(key === member.power) // [現在の権限]選択
    }

    // 変更ボタン
    const submitButton = wrapper.find('#member_update_submit_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.vm.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#member_update_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.vm.disabled).toBe(false) // 有効
    cancelButton.trigger('click')

    // メンバー情報変更ダイアログ
    await helper.sleep(1)
    expect(dialog.isVisible()).toBe(false) // 非表示
  }

  const apiCalledTest = (values) => {
    expect(axiosPostMock).toBeCalledTimes(1)
    const url = helper.commonConfig.membersUpdateUrl.replace(':code', space.code).replace(':user_code', member.user.code)
    expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + url, {
      member: values
    })
  }

  // テストケース
  it('表示される', async () => {
    const wrapper = mountFunction()
    await viewTest(wrapper)
  })

  describe('メンバー情報変更', () => {
    const data = Object.freeze({ member, alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ power: 'writer' })

    let wrapper, dialog, button
    const beforeAction = async () => {
      wrapper = mountFunction()
      wrapper.vm.showDialog(space, member)

      // メンバー情報変更ダイアログ
      await helper.sleep(1)
      dialog = wrapper.find('#member_update_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // 変更
      wrapper.find('#power_' + values.power).trigger('change')

      // 変更ボタン
      button = wrapper.find('#member_update_submit_btn')
      await helper.waitChangeDisabled(button, false)
      expect(button.vm.disabled).toBe(false) // 有効
      button.trigger('click')

      await helper.sleep(1)
    }

    it('[成功]一覧の対象データが更新される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      expect(wrapper.emitted().update).toEqual([[data.member]]) // メンバー情報更新
      expect(dialog.isVisible()).toBe(false) // [メンバー情報変更ダイアログ]非表示
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { email: ['errorメッセージ'] } }, data) } }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.messageTest(wrapper, Message, data)
      helper.disabledTest(wrapper, Processing, button, true)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.messageTest(wrapper, Message, { alert: helper.locales.system.default })
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
    })
  })
})
