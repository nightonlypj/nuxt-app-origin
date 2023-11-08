import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import AppMarkdown from '~/components/app/Markdown.vue'
import Component from '~/components/spaces/Create.vue'

describe('Create.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthUser: vi.fn(),
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      toast: helper.mockToast
    }
  })

  const fullPath = '/spaces'
  const mountFunction = (loggedIn = true, user: object | null = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthUser', mock.useAuthUser)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn,
        user
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({
      fullPath
    })))

    const wrapper = mount(Component, {
      global: {
        stubs: {
          AppProcessing: true,
          AppRequiredLabel: true,
          AppMarkdown: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper: any) => {
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)

    // 表示ボタン
    const button = wrapper.find('#space_create_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await flushPromises()

    // 作成ダイアログ
    const dialog = wrapper.find('#space_create_dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.isVisible()).toBe(true) // 表示

    // ラベル
    expect(wrapper.findComponent(AppRequiredLabel).exists()).toBe(true)

    // 説明
    const appMarkdown = wrapper.findComponent(AppMarkdown)
    expect(appMarkdown.exists()).toBe(true)
    expect(appMarkdown.vm.$props.source).toBe(null)

    // 表示
    const privateFalse = wrapper.find('#space_create_private_false')
    const privateTrue = wrapper.find('#space_create_private_true')
    expect(privateFalse.exists()).toBe(helper.commonConfig.enablePublicSpace)
    expect(privateTrue.exists()).toBe(helper.commonConfig.enablePublicSpace)
    if (helper.commonConfig.enablePublicSpace) {
      expect(privateFalse.element.checked).toBe(false) // 未選択
      expect(privateTrue.element.checked).toBe(true) // 選択
    }
    await flushPromises()

    // 作成ボタン
    const submitButton = wrapper.find('#space_create_submit_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.element.disabled).toBe(true) // 無効

    // キャンセルボタン
    const cancelButton = wrapper.find('#space_create_cancel_btn')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.element.disabled).toBe(false) // 有効
    cancelButton.trigger('click')
    await flushPromises()

    // 作成ダイアログ
    expect(dialog.isDisabled()).toBe(false) // 非表示
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, null)

    // 表示ボタン
    const button = wrapper.find('#space_create_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await flushPromises()

    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
    helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
    helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
  })
  it('[ログイン中]表示される', async () => {
    const wrapper = mountFunction(true)
    await viewTest(wrapper)
  })
  it('[ログイン中（削除予約済み）]表示されない', async () => {
    const wrapper = mountFunction(true, { destroy_schedule_at: '2000-01-08T12:34:56+09:00' })

    // 表示ボタン
    const button = wrapper.find('#space_create_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })

    // 作成ダイアログ
    expect(wrapper.find('#space_create_dialog').exists()).toBe(false)
  })

  describe('スペース作成', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const space = Object.freeze({ code: 'code0001' })
    const values = Object.freeze({ name: 'スペース1', description: 'スペース1の説明', private: true, image: {} })
    const apiCalledTest = () => {
      const params: any = {
        'space[name]': values.name,
        'space[description]': values.description,
        'space[image]': values.image
      }
      if (helper.commonConfig.enablePublicSpace) { params['space[private]'] = Number(values.private) }

      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaces.createUrl, 'POST', params, 'form')
    }

    let wrapper: any, dialog: any, button: any
    const beforeAction = async () => {
      wrapper = mountFunction()
      wrapper.find('#space_create_btn').trigger('click')
      await flushPromises()

      // 作成ダイアログ
      dialog = wrapper.find('#space_create_dialog')
      expect(dialog.isVisible()).toBe(true) // 表示

      // 入力
      wrapper.find('#space_create_name_text').setValue(values.name)
      wrapper.find('#space_create_description_text').setValue(values.description)
      wrapper.find(`#space_create_private_${values.private}`).setValue(true)
      // NOTE: InvalidStateError: Input elements of type "file" may only programmatically set the value to empty string.
      // wrapper.find('#space_create_image_file').setValue([values.image])
      expect(wrapper.find('#space_create_image_file').exists()).toBe(true)
      wrapper.vm.space.image = [values.image]
      await flushPromises()

      // 作成ボタン
      button = wrapper.find('#space_create_submit_btn')
      expect(button.element.disabled).toBe(false) // 有効
      button.trigger('click')
      await flushPromises()

      apiCalledTest()
    }

    it('[成功（コードあり）]作成したスペースにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { ...data, space }])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthUser, 1)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      helper.mockCalledTest(mock.navigateTo, 1, `/-/${space.code}`)
    })
    it('[成功（コードなし）]ダイアログが閉じられる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, data])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthUser, 1)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      helper.mockCalledTest(mock.navigateTo, 0)
      expect(dialog.isDisabled()).toBe(false) // 非表示
      expect(wrapper.vm.space).toEqual(helper.commonConfig.enablePublicSpace ? { private: true } : {}) // 初期化
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 406 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 422 }, Object.assign({ errors: { email: ['errorメッセージ'] } }, data)])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: data.alert, info: data.notice })
      helper.disabledTest(wrapper, AppProcessing, button, true) // 無効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.default })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
      expect(dialog.isVisible()).toBe(true) // 表示
    })
  })
})
