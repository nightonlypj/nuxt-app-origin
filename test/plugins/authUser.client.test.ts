import helper from '~/test/helper'
import Plugin from '~/plugins/authUser.client'

describe('authUser.client.ts', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useAuthUser: null,
      useAuthSignOut: vi.fn()
    }
  })
  const _nuxtApp: any = null

  const beforeAction = (reqToken: any = {}) => {
    vi.stubGlobal('localStorage', { getItem: vi.fn((key: string) => reqToken[key]) })
    vi.stubGlobal('useAuthUser', mock.useAuthUser)
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
  }

  it('[未ログイン]ユーザー情報が更新されない', async () => {
    mock.useAuthUser = vi.fn()
    beforeAction()

    await Plugin(_nuxtApp)
    helper.mockCalledTest(mock.useAuthUser, 0)
    helper.mockCalledTest(mock.useAuthSignOut, 0)
  })
  describe('ログイン中', () => {
    const reqToken = Object.freeze({ 'token-type': 'Bearer', 'access-token': 'token1' })
    const locale = 'unknown'
    it('[レスポンスOK]ユーザー情報更新が更新される。ログアウトされない', async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: true }])
      beforeAction(reqToken)

      await Plugin(_nuxtApp)
      helper.mockCalledTest(mock.useAuthUser, 1, locale)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
    })
    it('[レスポンスNG]ユーザー情報更新が更新される。ログアウトされない', async () => {
      mock.useAuthUser = vi.fn(() => [{ ok: false }])
      beforeAction(reqToken)

      await Plugin(_nuxtApp)
      helper.mockCalledTest(mock.useAuthUser, 1, locale)
      helper.mockCalledTest(mock.useAuthSignOut, 0)
    })
    it('[レスポンス401]ユーザー情報が更新されない。ログアウトされる', async () => {
      mock.useAuthUser = vi.fn(() => [{ status: 401 }])
      beforeAction(reqToken)

      await Plugin(_nuxtApp)
      helper.mockCalledTest(mock.useAuthUser, 1, locale)
      helper.mockCalledTest(mock.useAuthSignOut, 1, locale, true)
    })
  })
})
