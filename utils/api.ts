// APIリクエストURL取得
const apiRequestURL = (locale: string, url: string) => {
  const $config = useRuntimeConfig()

  return $config.public.apiBaseURL + (($config.public.apiLocale as any)[locale] || '') + url
}

export {
  apiRequestURL
}
