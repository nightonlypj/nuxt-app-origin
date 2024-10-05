import { apiRequestURL } from '~/utils/api'

// ログアウト
export const useAuthSignOut = async (locale: string, skipRequest = false) => {
  const $config = useRuntimeConfig()
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('useAuthSignOut') }

  if (!skipRequest) {
    await useApiRequest(apiRequestURL(locale, $config.public.authSignOutURL), 'POST')
  }

  // Devise Token Auth
  if (localStorage.getItem('token-type') === 'Bearer') {
    const reqAccessToken = localStorage.getItem('access-token')
    if (reqAccessToken != null) {
      localStorage.removeItem('token-type')
      localStorage.removeItem('uid')
      localStorage.removeItem('client')
      localStorage.removeItem('access-token')
      localStorage.removeItem('expiry')
    }
  }

  const { data: authData } = useAuthState()
  authData.value = null
}
