import { config } from '@vue/test-utils'
import { apiRequestURL } from '~/utils/api'
import helper from '~/test/helper'
import { useAuthUser } from '~/composables/authUser'
import { activeUser } from '~/test/data/user'

const $config = config.global.mocks.$config

// ユーザー情報更新
describe('authUser.ts', () => {
  let mock: any, authData: any
  beforeEach(() => {
    mock = {
      useApiRequest: null
    }
    authData = ref(null)
  })
  const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })

  const beforeAction = async (result: any, resData: any) => {
    mock.useApiRequest = vi.fn(() => [result, resData])
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthState', vi.fn(() => ({ data: authData })))

    const [response, data] = await useAuthUser(helper.locale)
    helper.mockCalledTest(mock.useApiRequest, 1, apiRequestURL.value(helper.locale, $config.public.authUserURL))
    expect(response.ok).toBe(result.ok)
    expect(response.status).toBe(result.status)
    expect(data).toBe(resData)
  }

  describe('response', () => {
    it('[OK]ユーザー情報が更新される', async () => {
      await beforeAction({ ok: true }, activeUser)

      expect(authData.value).toBe(activeUser)
    })
    it('[NG]ユーザー情報が更新されない', async () => {
      await beforeAction({ ok: false }, messages)

      expect(authData.value).toBeNull()
    })
  })
})
