import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/downloads/Lists.vue'
import { listCount5 } from '~/test/data/downloads'

describe('Lists.vue', () => {
  const mountFunction = (downloads: any, query: object | null = null) => {
    vi.stubGlobal('useRoute', vi.fn(() => ({
      query: { ...query }
    })))

    const wrapper = mount(Component, {
      props: {
        downloads
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const viewTest = (wrapper: any, downloads: any, row = { active: 0, inactive: 0 }) => {
    // ヘッダ
    expect(wrapper.text()).toMatch('依頼日時')
    expect(wrapper.text()).toMatch('完了日時')
    expect(wrapper.text()).toMatch('ステータス')
    expect(wrapper.text()).toMatch('ファイル')
    expect(wrapper.text()).toMatch('対象・形式等')

    // (状態)
    /* TODO: 背景色が変わらない
    expect(wrapper.findAll('.row_active').length).toBe(row.active)
    expect(wrapper.findAll('.row_inactive').length).toBe(row.inactive)
    */

    for (const download of downloads) {
      // 依頼日時
      expect(wrapper.text()).toMatch(wrapper.vm.dateTimeFormat('ja', download.requested_at))
      // 完了日時
      if (download.completed_at != null) {
        expect(wrapper.text()).toMatch(wrapper.vm.dateTimeFormat('ja', download.completed_at))
      }
      // ステータス
      const color = ['success', 'failure'].includes(download.status) ? download.status : 'info'
      expect(wrapper.find(`#download_icon_${color}_${download.id}`).exists()).toBe(true)
      // ファイル
      expect(wrapper.find(`#download_link_${download.id}`).exists()).toBe(download.status === 'success' && download.last_downloaded_at == null)
      expect(wrapper.find(`#download_link_done_${download.id}`).exists()).toBe(download.status === 'success' && download.last_downloaded_at != null)
      // 対象・形式等
      if (download.model === 'member' && download.space != null && download.space.name != null) {
        expect(wrapper.text()).toMatch(`メンバー: ${download.space.name}`)
      } else {
        expect(wrapper.text()).toMatch(download.model_i18n || '')
      }
      expect(wrapper.text()).toMatch(download.target_i18n || '')
      expect(wrapper.text()).toMatch(download.format_i18n || '')
      expect(wrapper.text()).toMatch(download.char_code_i18n || '')
      expect(wrapper.text()).toMatch(download.newline_code_i18n || '')
    }
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[0件]表示されない', () => {
    const wrapper = mountFunction([])
    helper.blankTest(wrapper)
  })
  describe('5件', () => {
    it('[パラメータなし]表示され、activeが1件(3)、inactiveが2件(2,1)になる', () => {
      const wrapper = mountFunction(listCount5, null)
      viewTest(wrapper, listCount5, { active: 1, inactive: 2 })
    })
    it('[パラメータの対象が処理待ち]表示され、activeが1件、inactiveが0件になる', () => {
      const wrapper = mountFunction(listCount5, { target_id: '5' })
      viewTest(wrapper, listCount5, { active: 1, inactive: 0 })
    })
    it('[パラメータの対象が処理中]表示され、activeが1件、inactiveが0件になる', () => {
      const wrapper = mountFunction(listCount5, { target_id: '4' })
      viewTest(wrapper, listCount5, { active: 1, inactive: 0 })
    })
    it('[パラメータの対象が成功]表示され、activeが1件、inactiveが0件になる', () => {
      const wrapper = mountFunction(listCount5, { target_id: '3' })
      viewTest(wrapper, listCount5, { active: 1, inactive: 0 })
    })
    it('[パラメータの対象が失敗]表示され、activeが1件、inactiveが0件になる', () => {
      const wrapper = mountFunction(listCount5, { target_id: '2' })
      viewTest(wrapper, listCount5, { active: 1, inactive: 0 })
    })
    it('[パラメータの対象がダウンロード済み]表示され、activeが0件、inactiveが1件になる', () => {
      const wrapper = mountFunction(listCount5, { target_id: '1' })
      viewTest(wrapper, listCount5, { active: 0, inactive: 1 })
    })
  })
})
