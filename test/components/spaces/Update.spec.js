import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Processing from '~/components/Processing.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Component from '~/components/spaces/Update.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Update.vue', () => {
  let axiosGetMock, authFetchUserMock, axiosPostMock, authRedirectMock, authLogoutMock, toastedErrorMock, toastedInfoMock, nuxtErrorMock

  beforeEach(() => {
    axiosGetMock = null
    axiosPostMock = null
    authFetchUserMock = jest.fn()
    authRedirectMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    nuxtErrorMock = jest.fn()
  })

  const space = Object.freeze({
    code: 'code0001',
    upload_image: true,
    image_url: {
      medium: 'https://example.com/images/space/medium_noimage.jpg'
    },
    name: 'スペース1',
    description: 'スペース1の説明',
    private: true,
    image: {},
    created_user: {
      code: 'code000000000000000000001'
    },
    last_updated_user: {
      code: 'code000000000000000000002'
    },
    created_at: '2000-01-01T12:34:56+09:00',
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
      mocks: {
        $axios: {
          get: axiosGetMock,
          post: axiosPostMock
        },
        $auth: {
          loggedIn,
          user: { ...user },
          fetchUser: authFetchUserMock,
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

    // スペース設定変更ダイアログ
    expect(wrapper.find('#space_update_dialog').exists()).toBe(false)

    // ダイアログ表示
    wrapper.vm.showDialog(space)

    // スペース設定変更ダイアログ
    await helper.sleep(1)
    const dialog = wrapper.find('#space_update_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // 作成、最終更新
    const usersAvatars = wrapper.findAllComponents(UsersAvatar)
    expect(usersAvatars.at(0).vm.$props.user).toBe(space.created_user)
    expect(usersAvatars.at(1).vm.$props.user).toBe(space.last_updated_user)
    expect(dialog.text()).toMatch(wrapper.vm.$timeFormat(space.created_at, 'ja'))
    expect(dialog.text()).toMatch(wrapper.vm.$timeFormat(space.last_updated_at, 'ja'))

    // 表示
    const privateFalse = wrapper.find('#private_false')
    const privateTrue = wrapper.find('#private_true')
    expect(privateFalse.exists()).toBe(helper.commonConfig.enablePublicSpace)
    expect(privateTrue.exists()).toBe(helper.commonConfig.enablePublicSpace)
    if (helper.commonConfig.enablePublicSpace) {
      expect(privateFalse.element.checked).toBe(space.private === false) // [現在の表示]選択
      expect(privateTrue.element.checked).toBe(space.private === true)
    }

    // 画像
    const imageDelete = wrapper.find('#image_delete')
    expect(imageDelete.exists()).toBe(true)
    expect(imageDelete.element.checked).toBe(false) // 未選択

    // 変更ボタン
    const submitButton = wrapper.find('#space_update_submit_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.vm.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#space_update_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.vm.disabled).toBe(false) // 有効
    cancelButton.trigger('click')

    // スペース設定変更ダイアログ
    await helper.sleep(1)
    expect(dialog.isVisible()).toBe(false) // 非表示
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false)

    // ダイアログ表示
    wrapper.vm.showDialog(space)

    await helper.sleep(1)
    helper.mockCalledTest(toastedErrorMock, 0)
    helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
    helper.mockCalledTest(authRedirectMock, 1, 'login')
  })
  it('[ログイン中]表示される', async () => {
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { space } }))
    const wrapper = mountFunction(true, {})
    await viewTest(wrapper)
  })
  it('[ログイン中（削除予約済み）]表示されない', async () => {
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { space } }))
    const wrapper = mountFunction(true, { destroy_schedule_at: '2000-01-08T12:34:56+09:00' })

    // ダイアログ表示
    wrapper.vm.showDialog(space)

    await helper.sleep(1)
    helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
    helper.mockCalledTest(toastedInfoMock, 0)

    // スペース設定変更ダイアログ
    expect(wrapper.find('#space_update_dialog').exists()).toBe(false)
  })

  describe('スペース詳細取得', () => {
    const beforeAction = async () => {
      const wrapper = mountFunction()

      // ダイアログ表示
      wrapper.vm.showDialog(space)

      await helper.sleep(1)
      apiCalledTest()
    }
    const apiCalledTest = () => {
      expect(axiosGetMock).toBeCalledTimes(1)
      const url = helper.commonConfig.spaceDetailUrl.replace(':code', space.code)
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

  describe('スペース設定変更', () => {
    const data = Object.freeze({ space, alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ ...space, name: '更新スペース1', description: '更新スペース1の説明', private: false, image_delete: true })
    const apiCalledTest = () => {
      const params = new FormData()
      params.append('space[name]', values.name)
      params.append('space[description]', values.description)
      if (helper.commonConfig.enablePublicSpace) {
        params.append('space[private]', Number(values.private))
      }
      params.append('space[image_delete]', Number(values.image_delete))
      params.append('space[image]', values.image)
      expect(axiosPostMock).toBeCalledTimes(1)
      expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaceUpdateUrl.replace(':code', space.code), params)
    }

    let wrapper, dialog, button
    const beforeAction = async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { space: { ...space } } }))
      wrapper = mountFunction()
      wrapper.vm.showDialog(space)

      // スペース設定変更ダイアログ
      await helper.sleep(1)
      dialog = wrapper.find('#space_update_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // 変更
      wrapper.find('#image_delete').trigger('change')
      wrapper.vm.$data.space = values

      // 変更ボタン
      await helper.sleep(1)
      button = wrapper.find('#space_update_submit_btn')
      expect(button.vm.disabled).toBe(false) // 有効
      button.trigger('click')

      await helper.sleep(1)
      apiCalledTest()
    }

    it('[成功]スペーストップのデータが更新される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      expect(wrapper.emitted().space).toEqual([[data.space]]) // スペース情報更新
      expect(dialog.isVisible()).toBe(false) // [スペース設定変更ダイアログ]非表示
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [スペース設定変更ダイアログ]表示
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [スペース設定変更ダイアログ]表示
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 403 } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.forbidden)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [スペース設定変更ダイアログ]表示
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 406 } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [スペース設定変更ダイアログ]表示
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [スペース設定変更ダイアログ]表示
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { email: ['errorメッセージ'] } }, data) } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.disabledTest(wrapper, Processing, button, true)
      expect(dialog.isVisible()).toBe(true) // [スペース設定変更ダイアログ]表示
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.default)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
      expect(dialog.isVisible()).toBe(true) // [スペース設定変更ダイアログ]表示
    })
  })
})
