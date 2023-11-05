const $config = useRuntimeConfig()

// リダイレクト
function redirectAuth (query: any) {
  const $route = useRoute()
  const { updateRedirectUrl } = useAuthRedirect()

  updateRedirectUrl($route.fullPath)
  redirectPath($config.public.authRedirectSignInURL, query)
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
function redirectSignIn (query: any) {
  navigateTo({ path: $config.public.authRedirectSignInURL, query: { alert: query.alert, notice: query.notice } })
}
function redirectPasswordReset (query: any) {
  navigateTo({ path: '/users/password/reset', query: { alert: query.alert, notice: query.notice } })
}
function redirectConfirmationReset (query: any) {
  navigateTo({ path: '/users/confirmation/resend', query: { alert: query.alert, notice: query.notice } })
}

function redirectError (statusCode: any, query: any) {
  showError({ statusCode, data: { alert: query.alert, notice: query.notice } })
  /* c8 ignore next */ // eslint-disable-next-line no-throw-literal
  if (process.env.NODE_ENV !== 'test') { throw 'showError' }
}

export {
  redirectAuth,
  redirectPath,
  redirectSignIn,
  redirectPasswordReset,
  redirectConfirmationReset,
  redirectError
}
