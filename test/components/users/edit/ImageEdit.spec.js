import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Processing from '~/components/Processing.vue'
import Component from '~/components/users/edit/ImageEdit.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('ImageEdit.vue', () => {
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
      mocks: {
        $axios: {
          post: axiosPostMock
        },
        $auth: {
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
    // console.log(wrapper.html())
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

  const updateApiCalledTest = (values) => {
    const params = new FormData()
    params.append('image', values.image)
    expect(axiosPostMock).toBeCalledTimes(1)
    expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userImageUpdateUrl, params)
  }

  const deleteApiCalledTest = () => {
    expect(axiosPostMock).toBeCalledTimes(1)
    expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userImageDeleteUrl)
  }

  const updateViewTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.image).toBeNull()
    // Tips: 画像変更のテストは省略（Mockでは実行されない為）
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
    for (let i = 0; i < 100; i++) {
      await helper.sleep(10)
      if (!button.vm.disabled) { break }
    }
    expect(button.vm.disabled).toBe(false) // 有効
  })
  it('[アップロード画像]表示される', async () => {
    const wrapper = mountFunction(true)
    viewTest(wrapper, true)

    // 削除ボタン
    const button = wrapper.find('#user_image_delete_btn')
    expect(button.exists()).toBe(true)
    expect(button.vm.disabled).toBe(false) // 有効
    button.trigger('click')

    // 確認ダイアログ
    await helper.sleep(1)
    const dialog = wrapper.find('#user_image_delete_dialog')
    expect(dialog.exists()).toBe(true)

    // いいえボタン
    const noButton = wrapper.find('#user_image_delete_no_btn')
    expect(noButton.exists()).toBe(true)
    expect(noButton.vm.disabled).toBe(false) // 有効
    noButton.trigger('click')
  })

  describe('画像変更', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ image: {} })
    it('[成功]変更後の画像が表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(10)
      updateApiCalledTest(values)
      helper.mockCalledTest(authSetUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.disabledTest(wrapper, Processing, button, true)
      updateViewTest(wrapper)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(10)
      updateApiCalledTest(values)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(10)
      updateApiCalledTest(values)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(10)
      updateApiCalledTest(values)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, locales.auth.unauthenticated)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(10)
      updateApiCalledTest(values)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { image: ['errorメッセージ'] } }, data) } }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(10)
      updateApiCalledTest(values)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.emitMessageTest(wrapper, data)
      helper.disabledTest(wrapper, Processing, button, true)
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(10)
      updateApiCalledTest(values)
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.emitMessageTest(wrapper, { alert: locales.system.default })
      helper.disabledTest(wrapper, Processing, button, false)
    })
  })

  describe('画像削除', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    it('[成功]デフォルト画像が表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true)
      const button = wrapper.find('#user_image_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_image_delete_yes_btn')
      yesButton.trigger('click')
      wrapper.vm.$auth.user.upload_image = false // Tips: 状態変更（Mockでは実行されない為）

      await helper.sleep(1)
      deleteApiCalledTest()
      helper.mockCalledTest(authSetUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.disabledTest(wrapper, Processing, button, true)
      updateViewTest(wrapper)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(true)
      const button = wrapper.find('#user_image_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_image_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      deleteApiCalledTest()
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true)
      const button = wrapper.find('#user_image_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_image_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      deleteApiCalledTest()
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true)
      const button = wrapper.find('#user_image_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_image_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      deleteApiCalledTest()
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, locales.auth.unauthenticated)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(true)
      const button = wrapper.find('#user_image_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_image_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      deleteApiCalledTest()
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.disabledTest(wrapper, Processing, button, false)
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      const wrapper = mountFunction(true)
      const button = wrapper.find('#user_image_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_image_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      deleteApiCalledTest()
      helper.mockCalledTest(authSetUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.emitMessageTest(wrapper, { alert: locales.system.default })
      helper.disabledTest(wrapper, Processing, button, false)
    })
  })
})
