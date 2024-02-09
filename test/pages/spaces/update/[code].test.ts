import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { dateTimeFormat } from '~/utils/display'
import { apiRequestURL } from '~/utils/api'
import helper from '~/test/helper'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import AppMarkdown from '~/components/app/Markdown.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Page from '~/pages/spaces/update/[code].vue'
import { activeUser, destroyUser } from '~/test/data/user'
import { detail, detailPower, detailDestroy } from '~/test/data/spaces'

const $config = config.global.mocks.$config
const $t = config.global.mocks.$t

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
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
  const fullPath = `/spaces/update/${detail.code}`
  const spacePath = `/-/${detail.code}`

  const mountFunction = (loggedIn = true, user: object | null = activeUser) => {
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
        code: detail.code
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
    expect(usersAvatars.at(0).vm.$props.user).toEqual(space.created_user)
    if (space.created_at != null) {
      expect(wrapper.text()).toMatch(dateTimeFormat.value(helper.locale, space.created_at))
    }
    if (space.last_updated_user != null || space.last_updated_at != null) {
      expect(usersAvatars.at(1).vm.$props.user).toBe(space.last_updated_user)
      expect(wrapper.text()).toMatch(dateTimeFormat.value(helper.locale, space.last_updated_at, 'N/A'))
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
    expect(privateFalse.exists()).toBe($config.public.enablePublicSpace)
    expect(privateTrue.exists()).toBe($config.public.enablePublicSpace)
    if ($config.public.enablePublicSpace) {
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

    helper.toastMessageTest(mock.toast, { info: $t('auth.unauthenticated') })
    helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
    helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
  })
  it('[ログイン中][管理者、削除予定なし]表示される', async () => {
    const space = Object.freeze({
      ...detailPower.value('admin'),
      created_user: {
        code: 'code000000000000000000001'
      },
      created_at: '2000-01-01T12:34:56+09:00',
      last_updated_user: {
        code: 'code000000000000000000002'
      },
      last_updated_at: '2000-01-02T12:34:56+09:00'
    })
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space }])
    const wrapper = mountFunction(true)
    await flushPromises()

    viewTest(wrapper, space)
  })
  it('[ログイン中][管理者、削除予定なし、作成・更新者・日時なし]表示される', async () => {
    const space = Object.freeze({
      ...detailPower.value('admin'),
      created_user: null,
      created_at: null,
      last_updated_user: null,
      last_updated_at: null
    })
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space }])
    const wrapper = mountFunction(true)
    await flushPromises()

    viewTest(wrapper, space)
  })
  it('[ログイン中][管理者以外、削除予定なし]スペーストップにリダイレクトされる', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: detailPower.value('writer') }])
    mountFunction(true)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: $t('auth.forbidden') })
    helper.mockCalledTest(mock.navigateTo, 1, spacePath)
  })
  it('[ログイン中（削除予約済み）]スペーストップにリダイレクトされる', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: detailPower.value('admin') }])
    mountFunction(true, destroyUser)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: $t('auth.destroy_reserved') })
    helper.mockCalledTest(mock.navigateTo, 1, spacePath)
  })
  it('[ログイン中][管理者、削除予定あり]スペーストップにリダイレクトされる', async () => {
    mock.useApiRequest = vi.fn(() => [{ ok: true, status: 200 }, { space: detailDestroy.value('admin') }])
    const wrapper = mountFunction(true)
    helper.loadingTest(wrapper, AppLoading)
    await flushPromises()

    helper.toastMessageTest(mock.toast, { error: $t('alert.space.destroy_reserved') })
    helper.mockCalledTest(mock.navigateTo, 1, spacePath)
  })

  describe('スペース詳細取得', () => {
    const apiCalledTest = () => {
      expect(mock.useApiRequest).toBeCalledTimes(1)
      expect(mock.useApiRequest).nthCalledWith(1, apiRequestURL.value(helper.locale, $config.public.spaces.detailUrl.replace(':code', detail.code)))
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
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: $t('system.error') } })
    })

    it('[接続エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: null }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: $t('network.failure') } })
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, helper.locale, true)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー（メッセージなし）]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 401 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 1, helper.locale, true)
      helper.toastMessageTest(mock.toast, { info: $t('auth.unauthenticated') })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: messages })
    })
    it('[権限エラー（メッセージなし）]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 403 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 403, data: { alert: $t('auth.forbidden') } })
    })
    it('[存在しない]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, messages])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: messages })
    })
    it('[存在しない（メッセージなし）]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 404 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 404, data: {} })
    })
    it('[レスポンスエラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 500 }, null])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: $t('network.error') } })
    })
    it('[その他エラー]エラーページが表示される', async () => {
      mock.useApiRequest = vi.fn(() => [{ ok: false, status: 400 }, {}])
      await beforeAction()

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: $t('system.default') } })
    })
  })

  describe('スペース設定変更', () => {
    const values = Object.freeze({ name: '更新スペース1', description: '更新スペース1の説明', private: false, image_delete: true, image: {} })
    const apiCalledTest = () => {
      const params: any = {
        'space[name]': values.name,
        'space[description]': values.description || ''
      }
      if ($config.public.enablePublicSpace) { params['space[private]'] = Number(values.private) }
      if (values.image_delete) { params['space[image_delete]'] = true }
      if (values.image != null) { params['space[image]'] = values.image }
      // TODO: image_delete=false, image=null

      expect(mock.useApiRequest).toBeCalledTimes(2)
      expect(mock.useApiRequest).nthCalledWith(2, apiRequestURL.value(helper.locale, $config.public.spaces.updateUrl.replace(':code', detail.code)), 'POST', params, 'form')
    }

    let wrapper: any, button: any
    const beforeAction = async (updateResponse: any) => {
      mock.useApiRequest = vi.fn()
        .mockImplementationOnce(() => [{ ok: true, status: 200 }, { space: detailPower.value('admin') }])
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
      await beforeAction([{ ok: true, status: 200 }, { ...messages, space: activeUser }])

      helper.mockCalledTest(mock.useAuthUser, 1, helper.locale)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, success: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, spacePath)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: true, status: 200 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('system.error') })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: null }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('network.failure') })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      await beforeAction([{ ok: false, status: 401 }, messages])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 1, helper.locale, true)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー（メッセージなし）]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      await beforeAction([{ ok: false, status: 401 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 1, helper.locale, true)
      helper.toastMessageTest(mock.toast, { info: $t('auth.unauthenticated') })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 403 }, messages])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[権限エラー（メッセージなし）]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 403 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('auth.forbidden') })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 406 }, messages])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[削除予約済み（メッセージなし）]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 406 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('auth.destroy_reserved') })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 500 }, null])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, { error: $t('network.error') })
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, null)
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 422 }, { ...messages, errors: { email: ['errorメッセージ'] } }])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, messages)
      helper.disabledTest(wrapper, AppProcessing, button, true)// 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      await beforeAction([{ ok: false, status: 400 }, {}])

      helper.mockCalledTest(mock.useAuthUser, 0)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.messageTest(wrapper, AppMessage, { alert: $t('system.default') })
      helper.disabledTest(wrapper, AppProcessing, button, false) // 有効
    })
  })
})
