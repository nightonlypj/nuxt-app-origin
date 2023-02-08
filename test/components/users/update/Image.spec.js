import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Processing from '~/components/Processing.vue'
import Component from '~/components/users/update/Image.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Image.vue', () => {
  let axiosPostMock, authSetUserMock, authLogoutMock, toastedErrorMock, toastedInfoMock

  beforeEach(() => {
    axiosPostMock = null
    authSetUserMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
  })

  const mountFunction = (uploadImage, values = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        Processing: true
      },
      mocks: {
        $axios: {
          post: axiosPostMock
        },
        $auth: {
          loggedIn: true,
          user: {
            image_url: {
              xlarge: 'https://example.com/images/user/xlarge_noimage.jpg'
            },
            upload_image: uploadImage
          },
          setUser: authSetUserMock,
          logout: authLogoutMock
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        }
      },
      data () {
        return { ...values }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, uploadImage) => {
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.image).toBeNull()

    // アップロードボタン
    const updateButton = wrapper.find('#user_image_update_btn')
    expect(updateButton.exists()).toBe(true)
    expect(updateButton.vm.disabled).toBe(true) // 有効

    // 画像削除ボタン
    const deleteButton = wrapper.find('#user_image_delete_btn')
    expect(deleteButton.exists()).toBe(true)
    expect(deleteButton.vm.disabled).toBe(!uploadImage) // [アップロード画像]有効
  }

  const updateViewTest = (wrapper) => {
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.image).toBeNull()
    // NOTE: 画像変更のテストは省略（Mockでは実行されない為）
  }

  // テストケース
  it('[デフォルト画像]表示される', async () => {
    const wrapper = mountFunction(false)
    viewTest(wrapper, false)

    // アップロードボタン
    const button = wrapper.find('#user_image_update_btn')
    expect(button.exists()).toBe(true)
    expect(button.vm.disabled).toBe(true) // 無効

    // 入力
    wrapper.vm.$data.image = {}

    // アップロードボタン
    await helper.waitChangeDisabled(button, false)
    expect(button.vm.disabled).toBe(false) // 有効
  })
  it('[アップロード画像]表示される', async () => {
    const wrapper = mountFunction(true)
    viewTest(wrapper, true)

    // 画像削除ボタン
    const button = wrapper.find('#user_image_delete_btn')
    expect(button.exists()).toBe(true)
    expect(button.vm.disabled).toBe(false) // 有効
    button.trigger('click')
    await helper.sleep(1)

    // 確認ダイアログ
    const dialog = wrapper.find('#user_image_delete_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // はいボタン
    const yesButton = wrapper.find('#user_image_delete_yes_btn')
    expect(yesButton.exists()).toBe(true)
    expect(yesButton.vm.disabled).toBe(false) // 有効

    // いいえボタン
    const noButton = wrapper.find('#user_image_delete_no_btn')
    expect(noButton.exists()).toBe(true)
    expect(noButton.vm.disabled).toBe(false) // 有効
    noButton.trigger('click')
    await helper.sleep(1)

    // 確認ダイアログ
    expect(dialog.isVisible()).toBe(false) // 非表示
  })

  describe('画像変更', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', user: { name: 'user1の氏名' } })
    const image = Object.freeze({})
    const apiCalledTest = () => {
      const params = new FormData()
      params.append('image', image)
      expect(axiosPostMock).toBeCalledTimes(1)
      expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userImageUpdateUrl, params)
    }

    let wrapper, button
    const beforeAction = async () => {
      wrapper = mountFunction(true, { image })
      button = wrapper.find('#user_image_update_btn')
      button.trigger('click')
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[成功]変更後の画像が表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 1, { name: 'user1の氏名' })
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.disabledTest(wrapper, Processing, button, true) // 無効
      updateViewTest(wrapper)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 406 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { image: ['errorメッセージ'] } }, data) } }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.emitMessageTest(wrapper, data)
      helper.disabledTest(wrapper, Processing, button, true) // 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.emitMessageTest(wrapper, { alert: helper.locales.system.default, notice: null })
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
  })

  describe('画像削除', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', user: { name: 'user1の氏名' } })
    const apiCalledTest = () => {
      expect(axiosPostMock).toBeCalledTimes(1)
      expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userImageDeleteUrl)
    }

    let wrapper, button
    const beforeAction = async (changeDefault = false) => {
      wrapper = mountFunction(true)
      button = wrapper.find('#user_image_delete_btn')
      button.trigger('click')
      await helper.sleep(1)

      wrapper.find('#user_image_delete_yes_btn').trigger('click')
      if (changeDefault) { wrapper.vm.$auth.user.upload_image = false } // NOTE: 状態変更（Mockでは実行されない為）
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[成功]デフォルト画像が表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction(true)

      helper.mockCalledTest(authSetUserMock, 1, { name: 'user1の氏名' })
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.disabledTest(wrapper, Processing, button, true) // 無効
      updateViewTest(wrapper)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 406 } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.emitMessageTest(wrapper, { alert: helper.locales.system.default, notice: null })
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
  })
})
