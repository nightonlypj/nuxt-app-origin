import { sortBy, isEqual } from 'lodash'

// 一定時間停止
/* c8 ignore next */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 検索パラメータチェック
const checkSearchParams = (reqParams: object, resParams: object, $t: any, test = false) => {
  const $config = useRuntimeConfig()
  /* c8 ignore next */
  if (!$config.public.debug && !test) { return }

  const req = sortBy(Object.entries(reqParams).filter(param => param[1] != null))
  const res = sortBy(Object.entries(resParams).filter(param => param[1] != null))
  const result = isEqual(req, res)
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log(`response params: ${result ? 'OK' : 'NG'}`, reqParams, resParams) }

  const { $toast } = useNuxtApp()
  if (!result) { $toast.warning($t('パラメータ不一致')) }
}

export {
  sleep,
  checkSearchParams
}
