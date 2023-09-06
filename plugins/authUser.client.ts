// リロードや再表示時にログイン状態に戻す
export default defineNuxtPlugin(async (_nuxtApp) => {
  const $config = useRuntimeConfig()
  // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('authUser') }

  // Devise Token Auth
  if (localStorage.getItem('token-type') !== 'Bearer' || localStorage.getItem('access-token') == null) {
    // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log('...Skip') }
    return
  }

  await useAuthUser()
})
