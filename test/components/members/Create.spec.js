import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import Component from '~/components/members/Create.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Create.vue', () => {
  let axiosPostMock, authLogoutMock, toastedErrorMock, toastedInfoMock

  beforeEach(() => {
    axiosPostMock = null
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
  })

  const space = Object.freeze({ code: 'code0001' })

  const mountFunction = () => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        Processing: true,
        Message: true
      },
      propsData: {
        space
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

    // メンバー招待ボタン
    const button = wrapper.find('#member_create_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')

    // 初期化
    expect(wrapper.vm.$data.alert).toBeNull()
    expect(wrapper.vm.$data.notice).toBeNull()

    // メンバー招待ダイアログ
    await helper.sleep(1)
    const dialog = wrapper.find('#member_create_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // 権限
    for (const key in helper.locales.enums.member.power) {
      const power = wrapper.find('#power_' + key)
      expect(power.exists()).toBe(true)
      expect(power.element.checked).toBe(false) // 未選択
    }

    // 招待ボタン
    const submitButton = wrapper.find('#member_create_submit_btn')
    expect(submitButton.exists()).toBe(true)
    await helper.waitChangeDisabled(submitButton, true)
    expect(submitButton.vm.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#member_create_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.vm.disabled).toBe(false) // 有効
    cancelButton.trigger('click')

    // メンバー招待ダイアログ
    await helper.sleep(1)
    expect(dialog.isVisible()).toBe(false) // 非表示
  }

  const apiCalledTest = (values) => {
    expect(axiosPostMock).toBeCalledTimes(1)
    expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.membersCreateUrl.replace(':code', space.code), {
      member: values
    })
  }

  // テストケース
  it('表示される', async () => {
    const wrapper = mountFunction()
    await viewTest(wrapper)
  })

  describe('メンバー招待', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ emails: 'user1@example.com', power: 'admin' })

    let wrapper, dialog, button
    const beforeAction = async () => {
      wrapper = mountFunction()
      wrapper.find('#member_create_btn').trigger('click')

      // メンバー招待ダイアログ
      await helper.sleep(1)
      dialog = wrapper.find('#member_create_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // 入力
      wrapper.vm.$data.member = values

      // 招待ボタン
      button = wrapper.find('#member_create_submit_btn')
      await helper.waitChangeDisabled(button, false)
      expect(button.vm.disabled).toBe(false) // 有効
      button.trigger('click')

      await helper.sleep(1)
    }

    it('[成功]メンバー招待結果が表示され、一覧が再取得される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      expect(wrapper.emitted().result).toEqual([[data]]) // メンバー招待結果表示
      expect(wrapper.emitted().reload).toEqual([[]]) // メンバー一覧再取得
      expect(wrapper.vm.$data.member).toEqual({ emails: '', power: null }) // 初期化
      expect(dialog.isVisible()).toBe(false) // [メンバー招待ダイアログ]非表示
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー招待ダイアログ]表示
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー招待ダイアログ]表示
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
      expect(dialog.isVisible()).toBe(true) // [メンバー招待ダイアログ]表示
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { email: ['errorメッセージ'] } }, data) } }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.messageTest(wrapper, Message, data)
      helper.disabledTest(wrapper, Processing, button, true)
      expect(dialog.isVisible()).toBe(true) // [メンバー招待ダイアログ]表示
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      apiCalledTest(values)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.messageTest(wrapper, Message, { alert: helper.locales.system.default })
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー招待ダイアログ]表示
    })
  })
})