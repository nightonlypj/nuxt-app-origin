import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Processing from '~/components/Processing.vue'
import Component from '~/components/invitations/Create.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Create.vue', () => {
  let axiosPostMock, authRedirectMock, authLogoutMock, toastedErrorMock, toastedInfoMock

  beforeEach(() => {
    axiosPostMock = null
    authRedirectMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
  })

  const space = Object.freeze({ code: 'code0001' })
  const mountFunction = (loggedIn = true, user = {}) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        Processing: true
      },
      propsData: {
        space
      },
      mocks: {
        $axios: {
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
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper) => {
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // 表示ボタン
    const button = wrapper.find('#invitation_create_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await helper.sleep(1)

    // 作成ダイアログ
    const dialog = wrapper.find('#invitation_create_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // 権限
    for (const key in helper.locales.enums.invitation.power) {
      const power = wrapper.find(`#invitation_power_${key}`)
      expect(power.exists()).toBe(true)
      expect(power.element.checked).toBe(false) // 未選択
    }

    // 期限
    expect(dialog.text()).toMatch(`${helper.envConfig.timeZoneOffset}(${helper.envConfig.timeZoneShort})`)

    // 作成ボタン
    const submitButton = wrapper.find('#invitation_create_submit_btn')
    expect(submitButton.exists()).toBe(true)
    await helper.waitChangeDisabled(submitButton, true)
    expect(submitButton.vm.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#invitation_create_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.vm.disabled).toBe(false) // 有効
    cancelButton.trigger('click')
    await helper.sleep(1)

    // 作成ダイアログ
    expect(dialog.isVisible()).toBe(false) // 非表示
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, null)

    // 表示ボタン
    const button = wrapper.find('#invitation_create_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await helper.sleep(1)

    helper.mockCalledTest(toastedErrorMock, 0)
    helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
    helper.mockCalledTest(authRedirectMock, 1, 'login')
  })
  it('[ログイン中]表示される', async () => {
    const wrapper = mountFunction(true, {})
    await viewTest(wrapper)
  })
  it('[ログイン中（削除予約済み）]表示されない', async () => {
    const wrapper = mountFunction(true, { destroy_schedule_at: '2000-01-08T12:34:56+09:00' })

    // 表示ボタン
    const button = wrapper.find('#invitation_create_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await helper.sleep(1)

    helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
    helper.mockCalledTest(toastedInfoMock, 0)

    // 作成ダイアログ
    expect(wrapper.find('#invitation_create_dialog').exists()).toBe(false)
  })

  describe('招待URL作成', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ domains: 'example.com', power: 'admin', ended_date: '9999-12-31', ended_time: '23:59', memo: 'メモ' })
    const apiCalledTest = () => {
      expect(axiosPostMock).toBeCalledTimes(1)
      expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.invitations.createUrl.replace(':space_code', space.code), {
        invitation: {
          ...values,
          ended_zone: helper.envConfig.timeZoneOffset
        }
      })
    }

    let wrapper, dialog, button
    const beforeAction = async () => {
      wrapper = mountFunction()
      wrapper.find('#invitation_create_btn').trigger('click')
      await helper.sleep(1)

      // 作成ダイアログ
      dialog = wrapper.find('#invitation_create_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // 入力
      wrapper.vm.$data.invitation = values
      await helper.sleep(1)

      // 作成ボタン
      button = wrapper.find('#invitation_create_submit_btn')
      expect(button.vm.disabled).toBe(false) // 有効
      button.trigger('click')
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[成功]一覧が再取得される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      expect(wrapper.emitted().reload).toEqual([[]]) // 招待URL一覧再取得
      expect(dialog.isVisible()).toBe(false) // 非表示
      expect(wrapper.vm.$data.invitation).toEqual({ ended_time: '23:59' }) // 初期化
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
