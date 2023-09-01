// APIリクエスト
export const useApiRequest = async (url: string, method = 'GET', body: any = null) => {
  // Devise Token Auth
  let authHeaders = {}
  if (localStorage.getItem('token-type') === 'Bearer' && localStorage.getItem('access-token')) {
    authHeaders = {
      uid: localStorage.getItem('uid'),
      client: localStorage.getItem('client'),
      'access-token': localStorage.getItem('access-token')
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
    const $config = useRuntimeConfig()
    if ($config.public.debug) { console.log(error) }
  }

  // Devise Token Auth
  if (response?.headers['token-type'] === 'Bearer' && response?.headers['access-token']) {
    localStorage.setItem('token-type', response.headers['token-type'])
    localStorage.setItem('uid', response.headers.uid)
    localStorage.setItem('client', response.headers.client)
    localStorage.setItem('access-token', response.headers['access-token'])
    localStorage.setItem('expiry', response.headers.expiry)
  }

  let data: any = null
  try {
    if (response != null) { data = await response.json() }
  } catch (error) {
    // eslint-disable-next-line no-console
    const $config = useRuntimeConfig()
    if ($config.public.debug) { console.log(error) }
  }

  return [response, data]
}
