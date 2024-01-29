import { config } from '@vue/test-utils'
import { updateAuthUser, checkHeadersUid } from '~/utils/auth'
import helper from '~/test/helper'

const $config = config.global.mocks.$config
const $t = config.global.mocks.$t

describe('auth.ts', () => {
  // ユーザー情報更新 // NOTE: 最新の状態で確認する為
  describe('updateAuthUser', () => {
    let mock: any
    beforeEach(() => {
      mock = {
        useAuthSignOut: vi.fn(),
        useAuthRedirect: { updateRedirectUrl: vi.fn() },
        navigateTo: vi.fn(),
        showError: vi.fn(),
        toast: helper.mockToast
      }
      vi.stubGlobal('showError', mock.showError)
      vi.stubGlobal('useNuxtApp', vi.fn(() => ({
        $toast: mock.toast
      })))
      vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
      vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
      vi.stubGlobal('navigateTo', mock.navigateTo)
      vi.stubGlobal('showError', mock.showError)
      vi.stubGlobal('useNuxtApp', vi.fn(() => ({
        $toast: mock.toast
      })))
      vi.stubGlobal('useRoute', vi.fn(() => ({
        fullPath
      })))
    })
    const messages = Object.freeze({ alert: 'alertメッセージ', notice: 'noticeメッセージ' })
    const fullPath = '/path'
    const localePath = (url: string) => url

    it('[成功]trueが返却される', async () => {
      vi.stubGlobal('useAuthUser', vi.fn(() => [{ ok: true, status: 200 }, {}]))
      expect(await updateAuthUser($t, localePath)).toBe(true)

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.navigateTo, 0)
      helper.mockCalledTest(mock.showError, 0)
    })
    it('[接続エラー]falseが返却され、エラーページが表示される', async () => {
      vi.stubGlobal('useAuthUser', vi.fn(() => [{ ok: false, status: null }, null]))
      expect(await updateAuthUser($t, localePath)).toBe(false)

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: null, data: { alert: $t('network.failure') } })
    })
    it('[認証エラー]falseが返却され、未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      vi.stubGlobal('useAuthUser', vi.fn(() => [{ ok: false, status: 401 }, messages]))
      expect(await updateAuthUser($t, localePath)).toBe(false)

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { error: messages.alert, info: messages.notice })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[認証エラー（メッセージなし）]falseが返却され、未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      vi.stubGlobal('useAuthUser', vi.fn(() => [{ ok: false, status: 401 }, null]))
      expect(await updateAuthUser($t, localePath)).toBe(false)

      helper.mockCalledTest(mock.useAuthSignOut, 1, true)
      helper.toastMessageTest(mock.toast, { info: $t('auth.unauthenticated') })
      helper.mockCalledTest(mock.navigateTo, 1, $config.public.authRedirectSignInURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 1, fullPath)
    })
    it('[レスポンスエラー]falseが返却され、エラーページが表示される', async () => {
      vi.stubGlobal('useAuthUser', vi.fn(() => [{ ok: false, status: 500 }, null]))
      expect(await updateAuthUser($t, localePath)).toBe(false)

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 500, data: { alert: $t('network.error') } })
    })
    it('[その他エラー]falseが返却され、エラーページが表示される', async () => {
      vi.stubGlobal('useAuthUser', vi.fn(() => [{ ok: false, status: 400 }, {}]))
      expect(await updateAuthUser($t, localePath)).toBe(false)

      helper.mockCalledTest(mock.useAuthSignOut, 0)
      helper.toastMessageTest(mock.toast, {})
      helper.mockCalledTest(mock.showError, 1, { statusCode: 400, data: { alert: $t('system.default') } })
    })
  })

  // レスポンスのuidチェック // NOTE: 無限スクロールの途中で未ログインや別ユーザーに変わったらリロードする
  describe('checkHeadersUid', () => {
    let mockReload: any
    beforeEach(() => {
      mockReload = vi.fn()
      Object.defineProperty(window, 'location', { value: { reload: mockReload } })
    })

    it('[エラー]trueが返却される', () => {
      expect(checkHeadersUid({ ok: false }, ref(1), ref(''))).toBe(true)
      helper.mockCalledTest(mockReload, 0)
    })
    it('[1頁目]trueが返却され、uidがセットされる', () => {
      const response: any = { ok: true, headers: { get: vi.fn((key: string) => key === 'uid' ? '1' : null) } }
      const page = ref(1)
      const uid = ref<string | null>(null)
      expect(checkHeadersUid(response, page, uid)).toBe(true)
      expect(uid.value).toBe('1')
      helper.mockCalledTest(mockReload, 0)
    })
    it('[2頁目、uidが一致]trueが返却される', () => {
      const response: any = { ok: true, headers: { get: vi.fn((key: string) => key === 'uid' ? '1' : null) } }
      const page = ref(2)
      const uid = ref<string | null>('1')
      expect(checkHeadersUid(response, page, uid)).toBe(true)
      expect(uid.value).toBe('1')
      helper.mockCalledTest(mockReload, 0)
    })
    it('[2頁目、uidが不一致]falseが返却され、リロードされる', () => {
      const response: any = { ok: true, headers: { get: vi.fn((key: string) => key === 'uid' ? '' : null) } }
      const page = ref(2)
      const uid = ref<string | null>('1')
      expect(checkHeadersUid(response, page, uid)).toBe(false)
      helper.mockCalledTest(mockReload, 1)
    })
  })
})
