import Plugin from '~/plugins/auth'
import { activeUser } from '~/test/data/user'

describe('auth.ts', () => {
  const _nuxtApp: any = null

  describe('loggedIn', () => {
    const responseTest = (status: string, result: boolean) => {
      vi.stubGlobal('useAuthState', vi.fn(() => ({ status: ref(status) })))
      expect(((Plugin(_nuxtApp) as any).provide.auth as any).loggedIn).toEqual(result)
    }

    it('[未ログイン]falseが返却される', () => {
      responseTest('unauthenticated', false)
    })
    it('[ログイン中]trueが返却される', () => {
      responseTest('authenticated', true)
    })
  })

  describe('data', () => {
    const responseTest = (data: object | undefined, result: object | undefined) => {
      vi.stubGlobal('useAuthState', vi.fn(() => ({ data: ref(data) })))
      expect((Plugin(_nuxtApp) as any).provide.auth.data).toEqual(result)
    }

    it('[未ログイン]undefinedが返却される', () => {
      responseTest(undefined, undefined)
    })
    it('[ログイン中]ユーザー情報が返却される', () => {
      responseTest({ user: activeUser }, { user: activeUser })
    })
  })

  describe('user', () => {
    const responseTest = (data: object | undefined, result: object | undefined) => {
      vi.stubGlobal('useAuthState', vi.fn(() => ({ data: ref(data) })))
      expect((Plugin(_nuxtApp) as any).provide.auth.user).toEqual(result)
    }

    it('[未ログイン]undefinedが返却される', () => {
      responseTest(undefined, undefined)
    })
    it('[ログイン中]ユーザー情報が返却される', () => {
      responseTest({ user: activeUser }, activeUser)
    })
  })

  describe('setData', () => {
    it('設定される', () => {
      const authData = ref(null)
      vi.stubGlobal('useAuthState', vi.fn(() => ({ data: authData })))

      expect((Plugin(_nuxtApp) as any).provide.auth.setData({ user: activeUser, other: 1 })).toBeUndefined()
      expect(authData.value).toEqual({ user: activeUser, other: 1 })
    })
  })

  describe('setUser', () => {
    it('設定される', () => {
      const authData = ref({ other: 1 })
      vi.stubGlobal('useAuthState', vi.fn(() => ({ data: authData })))

      expect((Plugin(_nuxtApp) as any).provide.auth.setUser(activeUser)).toBeUndefined()
      expect(authData.value).toEqual({ user: activeUser, other: 1 })
    })
  })

  describe('resetUserInfomationUnreadCount', () => {
    it('1から0に変更される', () => {
      const authData = ref({ user: { ...activeUser, infomation_unread_count: 1 } })
      vi.stubGlobal('useAuthState', vi.fn(() => ({ data: authData })))

      expect((Plugin(_nuxtApp) as any).provide.auth.resetUserInfomationUnreadCount()).toBeUndefined()
      expect(authData.value).toEqual({ user: { ...activeUser, infomation_unread_count: 0 } })
    })
  })

  describe('updateUserUndownloadedCount', () => {
    it('2から1に変更される', () => {
      const authData = ref({ user: { ...user, undownloaded_count: 2 } })
      vi.stubGlobal('useAuthState', vi.fn(() => ({ data: authData })))

      Plugin(_nuxtApp).provide.auth.updateUserUndownloadedCount(1)
      expect(authData.value).toEqual({ user: { ...user, undownloaded_count: 1 } })
    })
  })
})
