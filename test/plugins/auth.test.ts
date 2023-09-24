import Plugin from '~/plugins/auth'

describe('auth.ts', () => {
  const _nuxtApp: any = null
  const user = Object.freeze({ name: 'user1の氏名' })

  describe('loggedIn', () => {
    const responseTest = (status: string, result: boolean) => {
      vi.stubGlobal('useAuthState', vi.fn(() => ({ status: ref(status) })))
      expect(Plugin(_nuxtApp).provide.auth.loggedIn).toEqual(result)
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
      expect(Plugin(_nuxtApp).provide.auth.data).toEqual(result)
    }

    it('[未ログイン]undefinedが返却される', () => {
      responseTest(undefined, undefined)
    })
    it('[ログイン中]ユーザー情報が返却される', () => {
      responseTest({ user }, { user })
    })
  })

  describe('user', () => {
    const responseTest = (data: object | undefined, result: object | undefined) => {
      vi.stubGlobal('useAuthState', vi.fn(() => ({ data: ref(data) })))
      expect(Plugin(_nuxtApp).provide.auth.user).toEqual(result)
    }

    it('[未ログイン]undefinedが返却される', () => {
      responseTest(undefined, undefined)
    })
    it('[ログイン中]ユーザー情報が返却される', () => {
      responseTest({ user }, user)
    })
  })

  describe('setData', () => {
    it('保存される', () => {
      const authData = ref(null)
      vi.stubGlobal('useAuthState', vi.fn(() => ({ data: authData })))

      Plugin(_nuxtApp).provide.auth.setData({ user })
      expect(authData.value).toEqual({ user })
    })
  })

  describe('setUser', () => {
    it('保存される', () => {
      const authData = ref(null)
      vi.stubGlobal('useAuthState', vi.fn(() => ({ data: authData })))

      Plugin(_nuxtApp).provide.auth.setUser(user)
      expect(authData.value).toEqual({ user })
    })
  })
})
