// ログアウト
export const useAuthSignOut = async (skipRequest = false) => {
  const $config = useRuntimeConfig()
  // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('useAuthSignOut') }

  if (!skipRequest) {
    await useApiRequest($config.public.apiBaseURL + $config.public.authSignOutURL, 'POST')
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

  const { data:authData } = useAuthState()
  authData.value = null
}
