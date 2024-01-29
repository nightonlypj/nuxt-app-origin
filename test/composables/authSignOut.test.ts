import { config } from '@vue/test-utils'
import helper from '~/test/helper'
import { useAuthSignOut } from '~/composables/authSignOut'
import { activeUser } from '~/test/data/user'

const $config = config.global.mocks.$config

// ログアウト
describe('authSignOut.ts', () => {
  let mock: any, authData: any
  beforeEach(() => {
    mock = {
      removeItem: vi.fn(),
      useApiRequest: vi.fn()
    }
    authData = ref(activeUser)
  })

  const beforeAction = async (skipRequest: boolean | undefined = undefined, reqToken: any = {}) => {
    vi.stubGlobal('localStorage', { getItem: vi.fn((key: string) => reqToken[key]), removeItem: mock.removeItem })
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthState', vi.fn(() => ({ data: authData })))

    await useAuthSignOut(skipRequest)
  }

  describe('localStorage', () => {
    it('[未ログイン]削除されない', async () => {
      await beforeAction(true)

      helper.mockCalledTest(mock.removeItem, 0)
    })
    it('[ログイン中]削除される', async () => {
      const reqToken = Object.freeze({ 'token-type': 'Bearer', uid: 'uid1', client: 'client1', 'access-token': 'token1' })
      await beforeAction(true, reqToken)

      expect(mock.removeItem).toBeCalledTimes(5)
      expect(mock.removeItem).nthCalledWith(1, 'token-type')
      expect(mock.removeItem).nthCalledWith(2, 'uid')
      expect(mock.removeItem).nthCalledWith(3, 'client')
      expect(mock.removeItem).nthCalledWith(4, 'access-token')
      expect(mock.removeItem).nthCalledWith(5, 'expiry')
    })
  })

  describe('skipRequest', () => {
    it('[なし]APIリクエストされる。ユーザー情報がnullになる', async () => {
      await beforeAction()

      helper.mockCalledTest(mock.useApiRequest, 1, $config.public.apiBaseURL + $config.public.authSignOutURL, 'POST')
      expect(authData.value).toBeNull()
    })
    it('[false]APIリクエストされる。ユーザー情報がnullになる', async () => {
      await beforeAction(false)

      helper.mockCalledTest(mock.useApiRequest, 1, $config.public.apiBaseURL + $config.public.authSignOutURL, 'POST')
      expect(authData.value).toBeNull()
    })
    it('[true]APIリクエストされない。ユーザー情報がnullになる', async () => {
      await beforeAction(true)

      helper.mockCalledTest(mock.useApiRequest, 0)
      expect(authData.value).toBeNull()
    })
  })
})
