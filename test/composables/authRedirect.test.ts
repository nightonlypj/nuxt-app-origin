import { useAuthRedirect } from '~/composables/authRedirect'

// ログイン後のリダイレク先を保存
describe('authRedirect.ts', () => {
  it('リダイレクトURLが取得・更新できる', () => {
    vi.stubGlobal('useState', vi.fn(() => ref(null)))
    const { redirectUrl, updateRedirectUrl } = useAuthRedirect()

    expect(redirectUrl.value).toBeNull()

    updateRedirectUrl('/back')
    expect(redirectUrl.value).toBe('/back')

    updateRedirectUrl(null)
    expect(redirectUrl.value).toBeNull()
  })
})
