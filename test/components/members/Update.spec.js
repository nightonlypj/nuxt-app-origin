import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Processing from '~/components/Processing.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Component from '~/components/members/Update.vue'

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
  const member = Object.freeze({
    user: {
      code: 'code000000000000000000001',
      email: 'user1@example.com'
    },
    power: 'admin',
    invitationed_user: {
      code: 'code000000000000000000001'
    },
    last_updated_user: {
      code: 'code000000000000000000002'
    },
    invitationed_at: '2000-01-01T12:34:56+09:00',
    last_updated_at: '2000-02-01T12:34:56+09:00'
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
  const viewTest = async (wrapper) => {
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    // メンバー情報変更ダイアログ
    expect(wrapper.find('#member_update_dialog').exists()).toBe(false)

    // ダイアログ表示
    wrapper.vm.showDialog(member)

    // メンバー情報変更ダイアログ
    await helper.sleep(1)
    const dialog = wrapper.find('#member_update_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // メンバー
    const usersAvatars = wrapper.findAllComponents(UsersAvatar)
    expect(usersAvatars.at(0).exists()).toBe(true)
    expect(usersAvatars.at(0).vm.user).toEqual(member.user) // 表示
    expect(dialog.text()).toMatch(member.user.email) // メールアドレス

    // 招待、更新
    expect(usersAvatars.at(1).vm.$props.user).toBe(member.invitationed_user)
    expect(usersAvatars.at(2).vm.$props.user).toBe(member.last_updated_user)
    expect(dialog.text()).toMatch(wrapper.vm.$timeFormat(member.invitationed_at, 'ja'))
    expect(dialog.text()).toMatch(wrapper.vm.$timeFormat(member.last_updated_at, 'ja'))

    // 権限
    for (const key in helper.locales.enums.member.power) {
      const power = wrapper.find(`#power_${key}`)
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

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false)

    // ダイアログ表示
    wrapper.vm.showDialog(member)

    await helper.sleep(1)
    helper.mockCalledTest(toastedErrorMock, 0)
    helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
    helper.mockCalledTest(authRedirectMock, 1, 'login')
  })
  it('[ログイン中]表示される', async () => {
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { member } }))
    const wrapper = mountFunction(true, {})
    await viewTest(wrapper)
  })
  it('[ログイン中（削除予約済み）]表示されない', async () => {
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { member } }))
    const wrapper = mountFunction(true, { destroy_schedule_at: '2000-01-08T12:34:56+09:00' })

    // ダイアログ表示
    wrapper.vm.showDialog(member)

    await helper.sleep(1)
    helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
    helper.mockCalledTest(toastedInfoMock, 0)

    // メンバー情報変更ダイアログ
    expect(wrapper.find('#member_update_dialog').exists()).toBe(false)
  })

  describe('メンバー詳細取得', () => {
    const beforeAction = async () => {
      const wrapper = mountFunction()

      // ダイアログ表示
      wrapper.vm.showDialog(member)

      await helper.sleep(1)
      apiCalledTest()
    }
    const apiCalledTest = () => {
      expect(axiosGetMock).toBeCalledTimes(1)
      const url = helper.commonConfig.memberDetailUrl.replace(':space_code', space.code).replace(':user_code', member.user.code)
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

  describe('メンバー情報変更', () => {
    const data = Object.freeze({ member, alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ power: 'writer' })
    const apiCalledTest = () => {
      expect(axiosPostMock).toBeCalledTimes(1)
      const url = helper.commonConfig.memberUpdateUrl.replace(':space_code', space.code).replace(':user_code', member.user.code)
      expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + url, {
        member: values
      })
    }

    let wrapper, dialog, button
    const beforeAction = async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { member: { ...member } } }))
      wrapper = mountFunction()
      wrapper.vm.showDialog(member)

      // メンバー情報変更ダイアログ
      await helper.sleep(1)
      dialog = wrapper.find('#member_update_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // 変更
      wrapper.find(`#power_${values.power}`).trigger('change')

      // 変更ボタン
      await helper.sleep(1)
      button = wrapper.find('#member_update_submit_btn')
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
      expect(wrapper.emitted().update).toEqual([[data.member]]) // メンバー情報更新
      expect(dialog.isVisible()).toBe(false) // [メンバー情報変更ダイアログ]非表示
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
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
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 406 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { email: ['errorメッセージ'] } }, data) } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.disabledTest(wrapper, Processing, button, true)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [メンバー情報変更ダイアログ]表示
    })
  })
})
