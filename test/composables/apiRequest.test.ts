import lodash from 'lodash'
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
  const defaultFormParams = Object.freeze({
    method: 'GET',
    mode: 'cors',
    headers: {
      Accept: 'application/json'
    },
    body: null
  })
  const defaultParams = Object.freeze({
    ...defaultFormParams,
    headers: {
      ...defaultFormParams.headers,
      'Content-type': 'application/json; charset=utf-8'
    }
  })

  const beforeAction = (reqToken: any = {}, resToken: any = {}, result = {}, resData: string | null = null) => {
    vi.stubGlobal('localStorage', { getItem: vi.fn((key: string) => reqToken[key]), setItem: mock.setItem })

    if (lodash.isEmpty(resToken) && lodash.isEmpty(result) && resData == null) {
      mock.fetch = vi.fn(() => null)
    } else {
      mock.fetch = vi.fn(() => ({ ...result, headers: { get: vi.fn((key: string) => resToken[key]) }, json: vi.fn(() => resData) }))
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

  describe('method', () => {
    it('[GET]GETでリクエストされる', async () => {
      beforeAction()

      await useApiRequest(url, 'GET')
      helper.mockCalledTest(mock.fetch, 1, url, defaultParams)
    })
    it('[POST]POSTでリクエストされる', async () => {
      beforeAction()

      await useApiRequest(url, 'POST')
      helper.mockCalledTest(mock.fetch, 1, url, {
        ...defaultParams,
        method: 'POST'
      })
    })
  })

  describe('type', () => {
    const params = Object.freeze({ param1: 'value1' })
    it('[なし]jsonでリクエストされる', async () => {
      beforeAction()

      await useApiRequest(url, undefined, params)
      helper.mockCalledTest(mock.fetch, 1, url, {
        ...defaultParams,
        body: JSON.stringify(params)
      })
    })
    it('[json]jsonでリクエストされる', async () => {
      beforeAction()

      await useApiRequest(url, undefined, params, 'json')
      helper.mockCalledTest(mock.fetch, 1, url, {
        ...defaultParams,
        body: JSON.stringify(params)
      })
    })
    it('[form]formでリクエストされる', async () => {
      beforeAction()

      await useApiRequest(url, undefined, params, 'form')
      const body = new FormData()
      for (const [key, value] of Object.entries(params)) {
        body.append(key, value)
      }
      helper.mockCalledTest(mock.fetch, 1, url, {
        ...defaultFormParams,
        body
      })
    })
  })

  describe('response/data', () => {
    it('[なし]nullが返却される', async () => {
      beforeAction(undefined, undefined, {}, null)

      const [response, data] = await useApiRequest(url)
      expect(response).toBeNull()
      expect(data).toBeNull()
    })
    it('[あり/なし]responseとnullが返却される', async () => {
      const result = Object.freeze({ ok: false, status: 404 })
      beforeAction(undefined, undefined, result, null)

      const [response, data] = await useApiRequest(url)
      expect(response.ok).toBe(result.ok)
      expect(response.status).toBe(result.status)
      expect(data).toBeNull()
    })
    it('[あり/json]responseとjsonが返却される', async () => {
      const result = Object.freeze({ ok: true, status: 200 })
      const resData = JSON.stringify({ key1: 'value1' })
      beforeAction(undefined, undefined, result, resData)

      const [response, data] = await useApiRequest(url)
      expect(response.ok).toBe(result.ok)
      expect(response.status).toBe(result.status)
      expect(data).toBe(resData)
    })
    it('[あり/text]responseとtextが返却される', async () => {
      const result = Object.freeze({ ok: false, status: 500 })
      const resData = '<html>errorメッセージ</html>'
      beforeAction(undefined, undefined, result, resData)

      const [response, data] = await useApiRequest(url)
      expect(response.ok).toBe(result.ok)
      expect(response.status).toBe(result.status)
      expect(data).toBe(resData)
    })
  })
})
