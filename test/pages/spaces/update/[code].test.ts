import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import AppMarkdown from '~/components/app/Markdown.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Page from '~/pages/spaces/update/[code].vue'

describe('[code].vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useApiRequest: null,
      useAuthUser: vi.fn(),
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      showError: vi.fn(),
      toast: helper.mockToast
    }
  })

  const defaultSpace = Object.freeze({
    code: 'code0001',
    upload_image: true,
    image_url: {
      medium: 'https://example.com/images/space/medium_noimage.jpg'
    },
    name: 'スペース1',
    description: 'スペース1の説明',
    private: true,
    image: [{}],
    created_user: {
      code: 'code000000000000000000001'
    },
    created_at: '2000-01-01T12:34:56+09:00'
  })
  const spaceAdmin = Object.freeze({
    ...defaultSpace,
    current_member: {
      power: 'admin'
    }
  })
  const spaceUpdated = Object.freeze({
    ...spaceAdmin,
    last_updated_user: {
      code: 'code000000000000000000002'
    },
    last_updated_at: '2000-01-02T12:34:56+09:00'
  })

  const fullPath = '/spaces/update/code0001'
  const mountFunction = (loggedIn = true, user: object | null = {}) => {
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthUser', mock.useAuthUser)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)
    vi.stubGlobal('showError', mock.showError)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn,
        user
      },
      $toast: mock.toast
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({
      fullPath,
      params: {
        code: defaultSpace.code
      }
    })))

    const wrapper = mount(Page, {
      global: {
        stubs: {
          AppLoading: true,
          AppProcessing: true,
          AppMessage: true,
          AppRequiredLabel: true,
          AppMarkdown: true,
          SpacesDestroyInfo: true,
          UsersAvatar: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, space: any) => {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)

    const spacesDestroyInfo = wrapper.findComponent(SpacesDestroyInfo)
    expect(spacesDestroyInfo.vm.space).toEqual(wrapper.vm.space)

    // 作成、更新
    const usersAvatars = wrapper.findAllComponents(UsersAvatar)
    expect(usersAvatars.at(0).vm.$props.user).toBe(space.created_user)
    expect(wrapper.text()).toMatch(wrapper.vm.dateTimeFormat('ja', space.created_at))
    if (space.last_updated_user != null || space.last_updated_at != null) {
      expect(usersAvatars.at(1).vm.$props.user).toBe(space.last_updated_user)
      expect(wrapper.text()).toMatch(wrapper.vm.dateTimeFormat('ja', space.last_updated_at, 'N/A'))
      expect(usersAvatars.length).toBe(2)
    } else {
      expect(usersAvatars.length).toBe(1)
    }

    // ラベル
    expect(wrapper.findComponent(AppRequiredLabel).exists()).toBe(true)

    // 説明
    const appMarkdown = wrapper.findComponent(AppMarkdown)
    expect(appMarkdown.exists()).toBe(true)
    expect(appMarkdown.vm.$props.source).toBe(space.description)

    // 表示
    const privateFalse = wrapper.find('#space_update_private_false')
    const privateTrue = wrapper.find('#space_update_private_true')
    expect(privateFalse.exists()).toBe(helper.commonConfig.enablePublicSpace)
    expect(privateTrue.exists()).toBe(helper.commonConfig.enablePublicSpace)
    if (helper.commonConfig.enablePublicSpace) {
      expect(privateFalse.element.checked).toBe(space.private === false) // [現在の表示]選択
      expect(privateTrue.element.checked).toBe(space.private === true)
    }

    // 画像
    const imageDelete = wrapper.find('#space_update_image_delete_check')
    expect(imageDelete.exists()).toBe(true)
    expect(imageDelete.element.checked).toBe(false) // 未選択

    // 変更ボタン
    const submitButton = wrapper.find('#space_update_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.element.disabled).toBe(true) // 無効

    const links = helper.getLinks(wrapper)
    expect(links.includes(`/spaces/delete/${space.code}`)).toBe(true) // スペース削除
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', async () => {
    const wrapper = mountFunction(false, null)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
    helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
    helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
  })
  describe('ログイン中（管理者）', () => {
    it('[更新なし]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: spaceAdmin }])
      const wrapper = mountFunction(true)
      await flushPromises()

      viewTest(wrapper, spaceAdmin)
    })
    it('[更新あり]表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: spaceUpdated }])
      const wrapper = mountFunction(true)
      await flushPromises()

      viewTest(wrapper, spaceUpdated)
    })
  })
  it('[ログイン中（管理者以外）]スペーストップにリダイレクトされる', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: defaultSpace }])
    mountFunction(true)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.forbidden })
    helper.mockCalledTest(mock.navigateTo, 1, `/-/${defaultSpace.code}`)
  })
  it('[ログイン中（削除予約済み）]スペーストップにリダイレクトされる', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: spaceAdmin }])
    mountFunction(true, { destroy_schedule_at: '2000-01-08T12:34:56+09:00' })
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
    helper.mockCalledTest(mock.navigateTo, 1, `/-/${spaceAdmin.code}`)
  })
  it('[ログイン中][スペース削除予定]スペーストップにリダイレクトされる', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: { ...spaceAdmin, destroy_schedule_at: '2000-01-08T12:34:56+09:00' } }])
    const wrapper = mountFunction(true, { destroy_schedule_at: null })
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: helper.locales.alert.space.destroy_reserved })
    helper.mockCalledTest(mock.navigateTo, 1, `/-/${spaceAdmin.code}`)
  })

  describe('スペース詳細取得', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaces.detailUrl.replace(':code', spaceAdmin.code))
    }

    const beforeAction = async () => {
      mountFunction()
      await flushPromises()

      apiCalledTest()
    }

    it('[データなし]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.system.error } })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: helper.locales.network.failure } })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[存在しない]エラーページが表示される', async () => {
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, data])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: { alert: data.alert, notice: data.notice } })
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: helper.locales.network.error } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: helper.locales.system.default } })
    })
  })

  describe('スペース設定変更', () => {
    const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ', space: spaceAdmin })
    const values = Object.freeze({ name: '更新スペース1', description: '更新スペース1の説明', private: false, image_delete: true, image: {} })
    const apiCalledTest = () => {
      const params: any = {
        'space[name]': values.name,
        'space[description]': values.description || ''
      }
      if (helper.commonConfig.enablePublicSpace) { params['space[private]'] = Number(values.private) }
      if (values.image_delete) { params['space[image_delete]'] = true }
      if (values.image != null) { params['space[image]'] = values.image }
      // TODO: image_delete=false, image=null

      expect(mock.useApiRequest).toBeCalledTimes(2)
      const url = helper.commonConfig.spaces.updateUrl.replace(':code', spaceAdmin.code)
      expect(mock.useApiRequest).nthCalledWith(2, helper.envConfig.apiBaseURL + url, 'POST', params, 'form')
    }

    let wrapper: any, button: any
    const beforeAction = async (updateResponse: any) => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200 }, { space: { ...spaceAdmin } }])
        .mockImplementationOnce(() => updateResponse)
      wrapper = mountFunction()
      await flushPromises()

      // 入力
      wrapper.find('#space_update_name_text').setValue(values.name)
      wrapper.find('#space_update_description_text').setValue(values.description)
      wrapper.find(`#space_update_private_${values.private}`).setValue(true)
      wrapper.find('#space_update_image_delete_check').setValue(values.image_delete)
      // NOTE: InvalidStateError: Input elements of type "file" may only programmatically set the value to empty string.
      // wrapper.find('#space_update_image_file').setValue([values.image])
      expect(wrapper.find('#space_update_image_file').exists()).toBe(true)
      wrapper.vm.space.image = [values.image]
      await flushPromises()

      // 変更ボタン
      button = wrapper.find('#space_update_btn')
      expect(button.element.disabled).toBe(false) // 有効
      button.trigger('click')
      await flushPromises()

      apiCalledTest()
    }

    it('[成功]スペーストップにリダイレクトされる', async () => {
      await beforeAction([{ ok: true, status: 200 }, data])

      helper.mockCalledTest(mock.useAuthUser, 1)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: data.alert, success: data.notice })
      helper.mockCalledTest(mock.navigateTo, 1, `/-/${spaceAdmin.code}`)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: true, status: 200 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.system.error })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: null }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.failure })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      await beforeAction([{ ok: false, status: 401 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: helper.locales.auth.unauthenticated })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 403 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.forbidden })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 406 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.auth.destroy_reserved })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 500 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: helper.locales.network.error })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 422 }, Object.assign({ errors: { email: ['errorメッセージ'] } }, data)])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, data)
      helper.disabledTest(wrapper, AppProcessing, button, true)// 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 400 }, {}])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, { alert: helper.locales.system.default })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
