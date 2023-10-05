// APIリクエスト
export const useApiRequest = async (url: string, method = 'GET', params: object | null = null, type: string | null = 'json', accept: string | null = 'application/json') => {
  const $config = useRuntimeConfig()
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('useApiRequest', method, url) }

  // Devise Token Auth
  let authHeaders = {}
  if (localStorage.getItem('token-type') === 'Bearer') {
    const reqAccessToken = localStorage.getItem('access-token')
    if (reqAccessToken != null) {
      authHeaders = {
        uid: localStorage.getItem('uid'),
        client: localStorage.getItem('client'),
        'access-token': reqAccessToken
      }
    }
  }

  let contentType = {}
  let urlParam = ''
  let body: any = null
  if (method === 'GET') {
    if (params != null) { urlParam = '?' + new URLSearchParams(params) }
  } else if (type === 'json') {
    contentType = { 'Content-type': 'application/json; charset=utf-8' }
    if (params != null) {
      body = JSON.stringify(params)
    }
  } else { // 'form'
    // eslint-disable-next-line no-lonely-if
    if (params != null) {
      body = new FormData()
      for (const [key, value] of Object.entries(params)) {
        body.append(key, value)
      }
    }
  }

  let acceptHeader = {}
  if (accept != null) {
    acceptHeader = { Accept: accept }
  }

  let response: any = null
  try {
    response = await fetch(url + urlParam, {
      method,
      mode: 'cors',
      headers: {
        ...contentType,
        ...acceptHeader,
        ...authHeaders
      },
      body
    })
  /* c8 ignore start */
  } catch (error) {
    // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log(error) }
  }
  /* c8 ignore stop */

  // Devise Token Auth
  if (response != null) {
    const resTokenType = response.headers.get('token-type')
    const resAccessToken = response.headers.get('access-token') || ''
    if (resTokenType === 'Bearer' && resAccessToken !== '') {
      localStorage.setItem('token-type', resTokenType)
      localStorage.setItem('uid', response.headers.get('uid'))
      localStorage.setItem('client', response.headers.get('client'))
      localStorage.setItem('access-token', resAccessToken)
      localStorage.setItem('expiry', response.headers.get('expiry'))
    }
  }

  let data: any = null
  try {
    if (response != null) {
      if (accept === 'application/json') {
        data = await response.json()
      } else {
        data = await response.blob()
      }
    }
  /* c8 ignore start */
  } catch (error) {
    // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log(error) }
  }

  // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log(response, data) }
  /* c8 ignore stop */

  return [response, data]
}
