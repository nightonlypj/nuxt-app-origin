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
        $config: {
          apiBaseURL: 'https://example.com',
          userImageUpdateUrl: '/users/auth/image/update.json',
          userImageDeleteUrl: '/users/auth/image/delete.json'
        },
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

  const commonMessageTest = (wrapper, alert, notice) => {
    expect(wrapper.emitted().alert).toEqual([[alert]])
    expect(wrapper.emitted().notice).toEqual([[notice]])
  }
  const commonViewTest = (wrapper, uploadImage) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.image).toBe(null)

    // アップロードボタン
    const updateButton = wrapper.find('#user_image_update_btn')
    expect(updateButton.exists()).toBe(true)
    expect(updateButton.vm.disabled).toBe(true) // 有効

    // 画像削除ボタン
    const deleteButton = wrapper.find('#user_image_delete_btn')
    expect(deleteButton.exists()).toBe(true)
    expect(deleteButton.vm.disabled).toBe(!uploadImage) // [アップロード画像]有効
  }
  const commonToastedTest = (alert, notice) => {
    expect(toastedErrorMock).toBeCalledTimes(alert !== null ? 1 : 0)
    if (alert !== null) {
      expect(toastedErrorMock).toBeCalledWith(alert)
    }
    expect(toastedInfoMock).toBeCalledTimes(notice !== null ? 1 : 0)
    if (notice !== null) {
      expect(toastedInfoMock).toBeCalledWith(notice)
    }
  }
  const commonApiCalledTest = (target, values, setUserCalled, logoutCalled) => {
    expect(axiosPostMock).toBeCalledTimes(1)
    if (target === 'update') {
      const params = new FormData()
      params.append('image', values.image)
      expect(axiosPostMock).toBeCalledWith('https://example.com/users/auth/image/update.json', params)
    } else if (target === 'delete') {
      expect(axiosPostMock).toBeCalledWith('https://example.com/users/auth/image/delete.json')
    } else {
      // eslint-disable-next-line no-throw-literal
      throw 'Not defined: commonApiCalledTest target(' + target + ')'
    }
    expect(authSetUserMock).toBeCalledTimes(setUserCalled)
    expect(authLogoutMock).toBeCalledTimes(logoutCalled)
  }
  const commonDisabledTest = (wrapper, button, disabled) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(button.vm.disabled).toBe(disabled)
  }
  const commonSuccessTest = (alert, notice, wrapper, button, disabled) => {
    commonToastedTest(alert, notice)
    commonDisabledTest(wrapper, button, disabled)
    expect(wrapper.vm.$data.image).toBe(null)
  }

  it('[デフォルト画像]表示される', async () => {
    const wrapper = mountFunction(false)
    commonViewTest(wrapper, false)

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
    commonViewTest(wrapper, true)

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

  describe('画像変更API', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const values = Object.freeze({ image: {} })
    it('[成功]変更後の画像が表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest('update', values, 1, 0)
      commonSuccessTest(data.alert, data.notice, wrapper, button, true)
      // Tips: 画像変更のテストは省略（Mockでは実行されない為）
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { image: ['errorメッセージ'] } }, data) } }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest('update', values, 0, 0)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, true)
    })
    it('[連携エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: null }, data) } }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest('update', values, 0, 0)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, false)
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest('update', values, 0, 0)
      commonToastedTest(locales.network.failure, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest('update', values, 0, 1)
      commonToastedTest(null, locales.auth.unauthenticated)
      // Tips: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest('update', values, 0, 0)
      commonToastedTest(locales.network.error, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(true, values)
      const button = wrapper.find('#user_image_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest('update', values, 0, 0)
      commonToastedTest(locales.system.error, null)
      commonDisabledTest(wrapper, button, false)
    })
  })

  describe('画像削除API', () => {
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
      commonApiCalledTest('delete', null, 1, 0)
      commonSuccessTest(data.alert, data.notice, wrapper, button, true)
      // Tips: 画像変更のテストは省略（Mockでは実行されない為）
    })
    it('[連携エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data } }))
      const wrapper = mountFunction(true)
      const button = wrapper.find('#user_image_delete_btn')
      button.trigger('click')

      await helper.sleep(1)
      const yesButton = wrapper.find('#user_image_delete_yes_btn')
      yesButton.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest('delete', null, 0, 0)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, false)
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
      commonApiCalledTest('delete', null, 0, 0)
      commonToastedTest(locales.network.failure, null)
      commonDisabledTest(wrapper, button, false)
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
      commonApiCalledTest('delete', null, 0, 1)
      commonToastedTest(null, locales.auth.unauthenticated)
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
      commonApiCalledTest('delete', null, 0, 0)
      commonToastedTest(locales.network.error, null)
      commonDisabledTest(wrapper, button, false)
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
      commonApiCalledTest('delete', null, 0, 0)
      commonToastedTest(locales.system.error, null)
      commonDisabledTest(wrapper, button, false)
    })
  })
})
