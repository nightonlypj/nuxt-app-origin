// リロードや再表示時にログイン状態に戻す
export default defineNuxtPlugin(async ({ $config, $i18n }) => {
  const locale = ($i18n as any).locale.value // NOTE: 初回はdefaultLocaleになる
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('plugins/authUser.client', locale) }

  // Devise Token Auth
  if (localStorage.getItem('token-type') !== 'Bearer' || localStorage.getItem('access-token') == null) {
    /* c8 ignore next */ // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log('...Skip') }
    return
  }

  const [response] = await useAuthUser(locale)
  if (!response?.ok && response?.status === 401) { useAuthSignOut(locale, true) }
})
