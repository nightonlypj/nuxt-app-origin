import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Page from '~/pages/spaces/update/_code.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('_code.vue', () => {
  let axiosGetMock, authFetchUserMock, axiosPostMock, authLogoutMock, toastedErrorMock, toastedInfoMock, nuxtErrorMock, routerPushMock

  beforeEach(() => {
    axiosGetMock = null
    axiosPostMock = null
    authFetchUserMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    nuxtErrorMock = jest.fn()
    routerPushMock = jest.fn()
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
    image: {},
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
  const mountFunction = (loggedIn = true, user = {}) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        Loading: true,
        Processing: true,
        Message: true,
        SpacesDestroyInfo: true,
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
          logout: authLogoutMock
        },
        $route: {
          params: {
            code: defaultSpace.code
          }
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        },
        $nuxt: {
          error: nuxtErrorMock
        },
        $router: {
          push: routerPushMock
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, space) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)

    const spacesDestroyInfo = wrapper.findComponent(SpacesDestroyInfo)
    expect(spacesDestroyInfo.vm.space).toEqual(wrapper.vm.$data.space)

    // 作成、更新
    const usersAvatars = wrapper.findAllComponents(UsersAvatar)
    expect(usersAvatars.at(0).vm.$props.user).toBe(space.created_user)
    expect(wrapper.text()).toMatch(wrapper.vm.$timeFormat('ja', space.created_at))
    if (space.last_updated_user != null || space.last_updated_at != null) {
      expect(usersAvatars.at(1).vm.$props.user).toBe(space.last_updated_user)
      expect(wrapper.text()).toMatch(wrapper.vm.$timeFormat('ja', space.last_updated_at, 'N/A'))
      expect(usersAvatars.length).toBe(2)
    } else {
      expect(usersAvatars.length).toBe(1)
    }

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
    const imageDelete = wrapper.find('#space_image_delete')
    expect(imageDelete.exists()).toBe(true)
    expect(imageDelete.element.checked).toBe(false) // 未選択

    // 変更ボタン
    const submitButton = wrapper.find('#space_update_btn')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.vm.disabled).toBe(true) // 無効

    const links = helper.getLinks(wrapper)
    expect(links.includes(`/spaces/delete/${space.code}`)).toBe(true) // スペース削除
  }

  // テストケース
  it('[未ログイン]ログインページにリダイレクトされる', () => {
    const wrapper = mountFunction(false)
    helper.loadingTest(wrapper, Loading)
    expect(wrapper.findComponent(Loading).exists()).toBe(true) // NOTE: Jestでmiddlewareが実行されない為
  })
  describe('ログイン中（管理者）', () => {
    it('[更新なし]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { space: spaceAdmin } }))
      const wrapper = mountFunction(true, {})

      await helper.sleep(1)
      viewTest(wrapper, spaceAdmin)
    })
    it('[更新あり]表示される', async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { space: spaceUpdated } }))
      const wrapper = mountFunction(true, {})

      await helper.sleep(1)
      viewTest(wrapper, spaceUpdated)
    })
  })
  it('[ログイン中（管理者以外）]スペーストップにリダイレクトされる', async () => {
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { space: defaultSpace } }))
    mountFunction(true, {})

    await helper.sleep(1)
    helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.forbidden)
    helper.mockCalledTest(toastedInfoMock, 0)
    helper.mockCalledTest(routerPushMock, 1, { path: `/-/${defaultSpace.code}` })
  })
  it('[ログイン中（削除予約済み）]スペーストップにリダイレクトされる', async () => {
    axiosGetMock = jest.fn(() => Promise.resolve({ data: { space: spaceAdmin } }))
    mountFunction(true, { destroy_schedule_at: '2000-01-08T12:34:56+09:00' })

    await helper.sleep(1)
    helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
    helper.mockCalledTest(toastedInfoMock, 0)
    helper.mockCalledTest(routerPushMock, 1, { path: `/-/${spaceAdmin.code}` })
  })

  describe('スペース詳細取得', () => {
    const space = spaceAdmin
    const beforeAction = async () => {
      mountFunction()

      await helper.sleep(1)
      apiCalledTest()
    }
    const apiCalledTest = () => {
      expect(axiosGetMock).toBeCalledTimes(1)
      expect(axiosGetMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaces.detailUrl.replace(':code', space.code))
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
    it('[存在しない]エラーページが表示される', async () => {
      const data = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
      axiosGetMock = jest.fn(() => Promise.reject({ response: { status: 404, data } }))
      await beforeAction()

      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(nuxtErrorMock, 1, { statusCode: 404, alert: data.alert, notice: data.notice })
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
    const space = spaceAdmin
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
      expect(axiosPostMock).nthCalledWith(1, helper.envConfig.apiBaseURL + helper.commonConfig.spaces.updateUrl.replace(':code', space.code), params)
    }

    let wrapper, button
    const beforeAction = async () => {
      axiosGetMock = jest.fn(() => Promise.resolve({ data: { space: { ...space } } }))
      wrapper = mountFunction()

      // 変更
      await helper.sleep(1)
      wrapper.find('#space_image_delete').trigger('change')
      wrapper.vm.$data.space = values

      // 変更ボタン
      await helper.sleep(1)
      button = wrapper.find('#space_update_btn')
      expect(button.vm.disabled).toBe(false) // 有効
      button.trigger('click')

      await helper.sleep(1)
      apiCalledTest()
    }

    it('[成功]スペーストップにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 1)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, data.alert)
      helper.mockCalledTest(toastedInfoMock, 1, data.notice)
      helper.mockCalledTest(routerPushMock, 1, { path: `/-/${space.code}` })
      helper.messageTest(wrapper, Message, null)
    })
    it('[データなし]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.system.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 0)
      helper.messageTest(wrapper, Message, null)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })

    it('[接続エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.failure)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 0)
      helper.messageTest(wrapper, Message, null)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[認証エラー]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 1)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 1, helper.locales.auth.unauthenticated)
      helper.messageTest(wrapper, Message, null)
      // NOTE: 状態変更・リダイレクトのテストは省略（Mockでは実行されない為）
    })
    it('[権限エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 403 } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.forbidden)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 0)
      helper.messageTest(wrapper, Message, null)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[削除予約済み]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 406 } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.auth.destroy_reserved)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 0)
      helper.messageTest(wrapper, Message, null)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[レスポンスエラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 1, helper.locales.network.error)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 0)
      helper.messageTest(wrapper, Message, null)
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
    it('[入力エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { email: ['errorメッセージ'] } }, data) } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 0)
      helper.messageTest(wrapper, Message, data)
      helper.disabledTest(wrapper, Processing, button, true)// 無効
    })
    it('[その他エラー]エラーメッセージが表示される', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 400, data: {} } }))
      await beforeAction()

      helper.mockCalledTest(authFetchUserMock, 0)
      helper.mockCalledTest(authLogoutMock, 0)
      helper.mockCalledTest(toastedErrorMock, 0)
      helper.mockCalledTest(toastedInfoMock, 0)
      helper.mockCalledTest(routerPushMock, 0)
      helper.messageTest(wrapper, Message, { alert: helper.locales.system.default })
      helper.disabledTest(wrapper, Processing, button, false) // 有効
    })
  })
})
