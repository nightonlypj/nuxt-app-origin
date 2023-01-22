export default ({ $axios }) => {
  $axios.onRequest((config) => {
    // Devise Token Auth
    if (localStorage.getItem('token-type') === 'Bearer' && localStorage.getItem('access-token')) {
      config.headers.uid = localStorage.getItem('uid')
      config.headers.client = localStorage.getItem('client')
      config.headers['access-token'] = localStorage.getItem('access-token')
    }
  })

  $axios.onResponse((response) => {
    setDeviseTokenAuth(response.headers)
  })

  $axios.onError((error) => {
    setDeviseTokenAuth(error.response.headers)
  })
}

const setDeviseTokenAuth = (headers) => {
  if (headers['token-type'] === 'Bearer' && headers['access-token']) {
    localStorage.setItem('token-type', headers['token-type'])
    localStorage.setItem('uid', headers.uid)
    localStorage.setItem('client', headers.client)
    localStorage.setItem('access-token', headers['access-token'])
    localStorage.setItem('expiry', headers.expiry)
  }
}
