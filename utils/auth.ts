const $config = useRuntimeConfig()

// ユーザー情報更新
async function updateAuthUser ($t: any) {
  const [response, data] = await useAuthUser()
  if (response?.ok) { return true }

  if (response?.status === 401) {
    useAuthSignOut(true)
    redirectAuth($t)
  } else if (data == null) {
    redirectError(response?.status, { alert: $t(`network.${response?.status == null ? 'failure' : 'error'}`) })
  } else {
    redirectError(response?.status, { alert: data.alert || $t('system.default'), notice: data.notice })
  }
  return false
}

// リダイレクト
function redirectAuth ($t: any) {
  const { $toast } = useNuxtApp()
  const $route = useRoute()
  const { updateRedirectUrl } = useAuthRedirect()

  $toast.info($t('auth.unauthenticated'))
  updateRedirectUrl($route?.fullPath)
  navigateTo($config.public.authRedirectSignInURL)
}

function redirectAlreadyAuth ($t: any) {
  redirectTop({ notice: $t('auth.already_authenticated') })
}
function redirectAlreadySignedOut ($t: any) {
  redirectTop({ notice: $t('auth.already_signed_out') })
}

function redirectDestroyReserved ($t: any) {
  redirectTop({ alert: $t('auth.destroy_reserved') })
}
function redirectNotDestroyReserved ($t: any) {
  redirectTop({ alert: $t('auth.not_destroy_reserved') })
}

function redirectTop (query: any, success = false) {
  const { $toast } = useNuxtApp()

  if (query.alert != null) { $toast.error(query.alert) }
  if (query.notice != null) {
    if (success) {
      $toast.success(query.notice)
    } else {
      $toast.info(query.notice)
    }
  }
  navigateTo('/')
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
  updateAuthUser,
  redirectAuth,
  redirectAlreadyAuth,
  redirectAlreadySignedOut,
  redirectDestroyReserved,
  redirectNotDestroyReserved,
  redirectTop,
  redirectSignIn,
  redirectPasswordReset,
  redirectConfirmationReset,
  redirectError
}
