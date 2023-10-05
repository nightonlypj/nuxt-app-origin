import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import AppProcessing from '~/components/app/Processing.vue'
import Component from '~/components/users/update/Image.vue'

describe('Image.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      setData: vi.fn(),
      toast: helper.mockToast
    }
  })

  const fullPath = '/users/update'
  const mountFunction = (uploadImage: boolean, values = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)

    const wrapper = mount(Component, {
      global: {
        stubs: {
          AppProcessing: true
        },
        mocks: {
          $auth: {
            loggedIn: true,
            user: {
              image_url: {
                xlarge: 'https://example.com/images/user/xlarge_noimage.jpg'
              },
              upload_image: uploadImage
            },
            setData: mock.setData
          },
          $route: {
            fullPath
          },
          $toast: mock.toast
        }
      },
      data () {
        return values
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, uploadImage: boolean) => {
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.vm.$data.image).toBeNull()

    // アップロードボタン
    const updateButton: any = wrapper.find('#user_image_update_btn')
    expect(updateButton.exists()).toBe(true)
    expect(updateButton.element.disabled).toBe(true) // 有効

    // 画像削除ボタン
    const deleteButton: any = wrapper.find('#user_image_delete_btn')
    expect(deleteButton.exists()).toBe(true)
    expect(deleteButton.element.disabled).toBe(!uploadImage) // [アップロード画像]有効
  }

  const updateViewTest = (wrapper: any) => {
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
    expect(wrapper.vm.$data.image).toBeNull()
    // NOTE: 画像変更のテストは省略（Mockでは実行されない為）
  }

  // テストケース
  it('[デフォルト画像]表示される', async () => {
    const wrapper: any = mountFunction(false)
    viewTest(wrapper, false)

    // アップロードボタン
    const button: any = wrapper.find('#user_image_update_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(true) // 無効

    // 入力
    const file = new File([], 'test.jpg', { type: 'image/jpeg' })
    // wrapper.find('#input_image').setValue([file]) // NOTE: InvalidStateError: Input elements of type "file" may only programmatically set the value to empty string.
    wrapper.vm.image = [file]

    // アップロードボタン
    await helper.waitChangeDisabled(button, false)
    expect(button.element.disabled).toBe(false) // 有効
  })
  it('[アップロード画像]表示される', async () => {
    const wrapper = mountFunction(true)
    viewTest(wrapper, true)

    // 画像削除ボタン
    const button: any = wrapper.find('#user_image_delete_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(false) // 有効
    button.trigger('click')
    await helper.sleep(1)

    // 確認ダイアログ
    const dialog: any = wrapper.find('#user_image_delete_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // はいボタン
    const yesButton: any = wrapper.find('#user_image_delete_yes_btn')
    expect(yesButton.exists()).toBe(true)
    expect(yesButton.element.disabled).toBe(false) // 有効

    // いいえボタン
    const noButton: any = wrapper.find('#user_image_delete_no_btn')
    expect(noButton.exists()).toBe(true)
    expect(noButton.element.disabled).toBe(false) // 有効
    noButton.trigger('click')
    await helper.sleep(1)

    // 確認ダイアログ
    expect(dialog.isDisabled()).toBe(false) // 非表示
  })

  describe('画像変更', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', user: { name: 'user1の氏名' } })
    const image = Object.freeze([{}])
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userImageUpdateUrl, 'POST', {
        image: image[0]
      }, 'form')
    }

    let wrapper: any, button: any
    const beforeAction = async () => {
      wrapper = mountFunction(true, { image })
      button = wrapper.find('#user_image_update_btn')
      button.trigger('click')
      await helper.sleep(1)

      apiCalledTest()
    }

    it('[成功]変更後の画像が表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.mockCalledTest(mock.setData, 1, data)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
      updateViewTest(wrapper)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 406 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, { ...data, errors: { image: ['errorメッセージ'] } }])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.emitMessageTest(wrapper, data)
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.emitMessageTest(wrapper, { alert: helper.locales.system.default, notice: null })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })

  describe('画像削除', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', user: { name: 'user1の氏名' } })
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.userImageDeleteUrl, 'POST')
    }

    let wrapper: any, button: any
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
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction(true)

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
      updateViewTest(wrapper)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 406 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.emitMessageTest(wrapper, { alert: helper.locales.system.default, notice: null })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
