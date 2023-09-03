// ログイン後のリダイレク先を保存
export const useAuthRedirect = () => {
  const redirect = useState<string | null>("auth:redirect", () => null)
  const update = (path: string | null) => { redirect.value = path }
  return {
    redirectUrl: readonly(redirect),
    updateRedirectUrl: update
  }
}
