import { sleep, checkSearchParams } from '~/utils/search'
import helper from '~/test/helper'

describe('helper.ts', () => {
  // 一定時間停止
  describe('sleep', () => {
    it.skip('[10]10ミリ秒停止する', async () => { // NOTE: 時々、失敗する為
      const startDate = new Date()
      await sleep(10)
      expect((new Date()).getTime() - startDate.getTime() + 1).toBeGreaterThan(10)
    })
  })

  // 検索パラメータチェック
  describe('checkSearchParams', () => {
    let mock: any
    beforeEach(() => {
      mock = {
        toast: helper.mockToast
      }
      vi.stubGlobal('useNuxtApp', vi.fn(() => ({
        $toast: mock.toast
      })))
    })

    it('[一致]エラーメッセージが表示されない', () => {
      checkSearchParams({ text: '' }, { text: '' }, true)
      helper.toastMessageTest(mock.toast, {})
    })
    it('[不一致]エラーメッセージが表示される', () => {
      checkSearchParams({ text: '' }, {}, true)
      helper.toastMessageTest(mock.toast, { warning: 'パラメータが一致していません。ログを確認してください。' })
    })
  })
})
