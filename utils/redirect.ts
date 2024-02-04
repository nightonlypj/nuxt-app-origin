const $config = useRuntimeConfig()

// リダイレクト
function redirectAuth (query: any, localePath: any) {
  const $route = useRoute()
  const { updateRedirectUrl } = useAuthRedirect()

  updateRedirectUrl($route.fullPath)
  redirectPath(localePath($config.public.authRedirectSignInURL), query)
}

function redirectPath (path: string, query: any, success = false) {
  const { $toast } = useNuxtApp()

  if (query.alert != null) { $toast.error(query.alert) }
  if (query.notice != null) {
    if (success) {
      $toast.success(query.notice)
    } else {
      $toast.info(query.notice)
    }
  }
  navigateTo(path)
}
function redirectSignIn (query: any, localePath: any) {
  navigateTo({ path: localePath($config.public.authRedirectSignInURL), query: { alert: query.alert, notice: query.notice } })
}
function redirectPasswordReset (query: any, localePath: any) {
  navigateTo({ path: localePath('/users/password/reset'), query: { alert: query.alert, notice: query.notice } })
}
function redirectConfirmationReset (query: any, localePath: any) {
  navigateTo({ path: localePath('/users/confirmation/resend'), query: { alert: query.alert, notice: query.notice } })
}

function redirectError (statusCode: any, query: any) {
  showError({ statusCode, data: { alert: query.alert, notice: query.notice } })
  /* c8 ignore next */ // eslint-disable-next-line no-throw-literal
  if (!$config.public.env.test) { throw 'showError' }
}

export {
  redirectAuth,
  redirectPath,
  redirectSignIn,
  redirectPasswordReset,
  redirectConfirmationReset,
  redirectError
}
