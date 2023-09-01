// APIリクエスト
export const useApiRequest = async (url: string, method = 'GET', body: any = null) => {
  const $config = useRuntimeConfig()
  // eslint-disable-next-line no-console
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

  let response: any = null
  try {
    response = await fetch(url, {
      method,
      mode: 'cors',
      headers: {
        'Content-type': 'application/json; charset=utf-8',
        Accept: 'application/json',
        ...authHeaders
      },
      body
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log(error) }
  }

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
    if (response != null) { data = await response.json() }
  } catch (error) {
    // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log(error) }
  }

  // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log(response, data) }

  return [response, data]
}
