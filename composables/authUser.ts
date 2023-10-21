// ユーザー情報更新
export const useAuthUser = async () => {
  const $config = useRuntimeConfig()
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('useAuthUser') }

  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.authUserURL)

  if (response?.ok) {
    const { data: authData } = useAuthState()
    authData.value = data
  }

  return [response, data]
}
