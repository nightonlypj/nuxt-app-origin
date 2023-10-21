import { isEmpty } from 'lodash'
import helper from '~/test/helper'
import { useApiRequest } from '~/composables/apiRequest'

// APIリクエスト
describe('apiRequest.ts', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      setItem: vi.fn(),
      fetch: null
    }
  })

  const url = 'http://localhost/api'
  const params = Object.freeze({ page: 1 })
  const defaultParams = Object.freeze({
    method: 'GET',
    mode: 'cors',
    headers: {
      Accept: 'application/json'
    },
    body: null
  })
  const defaultPostParams = Object.freeze({
    ...defaultParams,
    method: 'POST',
    headers: {
      ...defaultParams.headers,
      'Content-type': 'application/json; charset=utf-8'
    }
  })

  const beforeAction = (reqToken: any = {}, resToken: any = {}, result = {}, resData: string | null = null, useJson = true) => {
    vi.stubGlobal('localStorage', { getItem: vi.fn((key: string) => reqToken[key]), setItem: mock.setItem })

    if (isEmpty(resToken) && isEmpty(result) && resData == null) {
      mock.fetch = vi.fn(() => null)
    } else {
      const body = useJson ? { json: vi.fn(() => resData) } : { blob: vi.fn(() => resData) }
      mock.fetch = vi.fn(() => ({ ...result, headers: { get: vi.fn((key: string) => resToken[key]) }, ...body }))
    }
    vi.stubGlobal('fetch', mock.fetch)
  }

  describe('localStorage', () => {
    it('[未ログイン]保存されない', async () => {
      beforeAction()

      await useApiRequest(url)
      helper.mockCalledTest(mock.fetch, 1, url, defaultParams)
      helper.mockCalledTest(mock.setItem, 0)
    })
    it('[ログイン中]保存される', async () => {
      const reqToken = Object.freeze({ 'token-type': 'Bearer', uid: 'uid1', client: 'client1', 'access-token': 'token1' })
      const resToken = Object.freeze({ ...reqToken, 'access-token': 'token2', expiry: '123' })
      beforeAction(reqToken, resToken)

      await useApiRequest(url)
      helper.mockCalledTest(mock.fetch, 1, url, {
        ...defaultParams,
        headers: {
          ...defaultParams.headers,
          uid: reqToken.uid,
          client: reqToken.client,
          'access-token': reqToken['access-token']
        }
      })
      expect(mock.setItem).toBeCalledTimes(5)
      expect(mock.setItem).nthCalledWith(1, 'token-type', resToken['token-type'])
      expect(mock.setItem).nthCalledWith(2, 'uid', resToken.uid)
      expect(mock.setItem).nthCalledWith(3, 'client', resToken.client)
      expect(mock.setItem).nthCalledWith(4, 'access-token', resToken['access-token'])
      expect(mock.setItem).nthCalledWith(5, 'expiry', resToken.expiry)
    })
  })

  describe('method/params/type/accept', () => {
    it('[なし]GETでリクエストされる', async () => {
      beforeAction()

      await useApiRequest(url)
      helper.mockCalledTest(mock.fetch, 1, url, defaultParams)
    })
    it('[GET/あり]GETでリクエストされる', async () => {
      beforeAction()

      await useApiRequest(url, 'GET', params)
      helper.mockCalledTest(mock.fetch, 1, url + '?' + new URLSearchParams(params), defaultParams)
    })
    it('[GET/なし/なし/csv]GETとCSVでリクエストされる', async () => {
      beforeAction()

      await useApiRequest(url, 'GET', null, null, 'text/csv')
      helper.mockCalledTest(mock.fetch, 1, url, {
        ...defaultParams,
        headers: {
          ...defaultParams.headers,
          Accept: 'text/csv'
        }
      })
    })
    it('[POST/なし]POSTでリクエストされる', async () => {
      beforeAction()

      await useApiRequest(url, 'POST')
      helper.mockCalledTest(mock.fetch, 1, url, defaultPostParams)
    })
    it('[POST/あり]POSTとJSONでリクエストされる', async () => {
      beforeAction()

      await useApiRequest(url, 'POST', params)
      helper.mockCalledTest(mock.fetch, 1, url, { ...defaultPostParams, body: JSON.stringify(params) })
    })
    it('[POST/あり/json]POSTとJSONでリクエストされる', async () => {
      beforeAction()

      await useApiRequest(url, 'POST', params, 'json')
      helper.mockCalledTest(mock.fetch, 1, url, { ...defaultPostParams, body: JSON.stringify(params) })
    })
    it('[POST/あり/json/json]JSONが返却される', async () => {
      beforeAction()

      await useApiRequest(url, 'POST', params, 'json', 'application/json')
      helper.mockCalledTest(mock.fetch, 1, url, { ...defaultPostParams, body: JSON.stringify(params) })
    })
    it('[POST/あり/form]POSTとFormDataでリクエストされる', async () => {
      beforeAction()
      const body = new FormData()
      for (const [key, value] of Object.entries(params)) {
        body.append(key, String(value))
      }

      await useApiRequest(url, 'POST', params, 'form')
      helper.mockCalledTest(mock.fetch, 1, url, { ...defaultParams, method: 'POST', body })
    })
  })

  describe('response', () => {
    it('[なし]nullが返却される', async () => {
      beforeAction({}, {}, {}, null)

      const [response, data] = await useApiRequest(url)
      expect(response).toBeNull()
      expect(data).toBeNull()
    })
    it('[200/json]responseとJSONが返却される', async () => {
      const result = Object.freeze({ ok: true, status: 200 })
      const resData = JSON.stringify({ key1: 'value1' })
      beforeAction({}, {}, result, resData)

      const [response, data] = await useApiRequest(url)
      expect(response.ok).toBe(result.ok)
      expect(response.status).toBe(result.status)
      expect(data).toBe(resData)
    })
    it('[200/csv]responseとCSVが返却される', async () => {
      const result = Object.freeze({ ok: true, status: 200 })
      const resData = 'key1,key2\nvalue1,value2\n'
      beforeAction({}, {}, result, resData, false)

      const [response, data] = await useApiRequest(url, 'GET', null, null, 'text/csv')
      expect(response.ok).toBe(result.ok)
      expect(response.status).toBe(result.status)
      expect(data).toBe(resData)
    })
    it('[404/なし]responseとnullが返却される', async () => {
      const result = Object.freeze({ ok: false, status: 404 })
      beforeAction({}, {}, result, null)

      const [response, data] = await useApiRequest(url)
      expect(response.ok).toBe(result.ok)
      expect(response.status).toBe(result.status)
      expect(data).toBeNull()
    })
    it('[500/html]responseとnullが返却される', async () => {
      const result = Object.freeze({ ok: false, status: 500 })
      const resData = '<html>errorメッセージ</html>'
      beforeAction({}, {}, result, resData, false)

      const [response, data] = await useApiRequest(url)
      expect(response.ok).toBe(result.ok)
      expect(response.status).toBe(result.status)
      expect(data).toBeNull()
    })
  })
})
