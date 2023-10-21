import { useAuthUser } from '~/composables/authUser'

// ユーザー情報更新
describe('authUser.ts', () => {
  let mock: any, authData: any
  beforeEach(() => {
    mock = {
      useApiRequest: null
    }
    authData = ref(null)
  })

  const beforeAction = async (result: any, resData: string) => {
    mock.useApiRequest = vi.fn(() => [result, resData])
    vi.stubGlobal('useApiRequest', mock.useApiRequest)
    vi.stubGlobal('useAuthState', vi.fn(() => ({ data: authData })))

    const [response, data] = await useAuthUser()
    expect(response.ok).toBe(result.ok)
    expect(response.status).toBe(result.status)
    expect(data).toBe(resData)
  }

  describe('response', () => {
    it('[OK]ユーザー情報が更新される', async () => {
      const result = Object.freeze({ ok: true })
      const resData = JSON.stringify({ name: 'user1の氏名' })
      await beforeAction(result, resData)

      expect(authData.value).toBe(resData)
    })
    it('[NG]ユーザー情報が更新されない', async () => {
      const result = Object.freeze({ ok: false })
      const resData = JSON.stringify({ alert: 'alertメッセージ' })
      await beforeAction(result, resData)

      expect(authData.value).toBeNull()
    })
  })
})
