import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/downloads/Lists.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Lists.vue', () => {
  const mountFunction = (downloads, query = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        downloads
      },
      mocks: {
        $route: {
          query: { ...query }
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, downloads, row = { active: 0, inactive: 0 }) => {
    // ヘッダ
    expect(wrapper.text()).toMatch('依頼日時')
    expect(wrapper.text()).toMatch('ステータス')
    expect(wrapper.text()).toMatch('ファイル')
    expect(wrapper.text()).toMatch('対象・形式等')

    for (const download of downloads) {
      // (状態)
      expect(wrapper.findAll('.row_active').length).toBe(row.active)
      expect(wrapper.findAll('.row_inactive').length).toBe(row.inactive)
      // 依頼日時
      expect(wrapper.text()).toMatch(wrapper.vm.$timeFormat(download.requested_at, 'ja'))
      // ステータス
      const color = ['success', 'failure'].includes(download.status) ? download.status : 'info'
      expect(wrapper.find(`#icon_${color}_${download.id}`).exists()).toBe(true)
      // ファイル
      expect(wrapper.find(`#download_link_${download.id}`).exists()).toBe(download.status === 'success')
      expect(wrapper.find(`#download_done_${download.id}`).exists()).toBe(download.status === 'success' && download.last_downloaded_at != null)
      // 対象・形式等
      if (download.model === 'member' && download.space != null && download.space.name != null) {
        expect(wrapper.text()).toMatch(`${download.space.name}のメンバー`)
      } else {
        expect(wrapper.text()).toMatch(download.model_i18n || '')
      }
      expect(wrapper.text()).toMatch(download.target_i18n || '')
      expect(wrapper.text()).toMatch(download.format_i18n || '')
      expect(wrapper.text()).toMatch(download.char_i18n || '')
      expect(wrapper.text()).toMatch(download.newline_i18n || '')
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
    const downloads = Object.freeze([
      {
        id: 5,
        status: 'waiting',
        status_i18n: '処理待ち',
        requested_at: '2000-01-05T12:34:56+09:00',
        model: 'member',
        model_i18n: 'メンバー1',
        space: {
          name: 'スペース1'
        },
        target_i18n: '全て',
        format_i18n: 'CSV',
        char_i18n: 'Shift_JIS',
        newline_i18n: 'CR+LF'
      },
      {
        id: 4,
        status: 'processing',
        status_i18n: '処理中',
        requested_at: '2000-01-04T12:34:56+09:00',
        model: 'member',
        model_i18n: 'メンバー2',
        space: {}
      },
      {
        id: 3,
        status: 'success',
        status_i18n: '成功',
        requested_at: '2000-01-03T12:34:56+09:00',
        model: 'member',
        model_i18n: 'メンバー3'
      },
      {
        id: 2,
        status: 'success',
        status_i18n: '成功',
        requested_at: '2000-01-02T12:34:56+09:00',
        last_downloaded_at: '2000-02-02T12:34:56+09:00',
        model_i18n: 'モデル1'
      },
      {
        id: 1,
        status: 'failure',
        status_i18n: '失敗',
        requested_at: '2000-01-01T12:34:56+09:00'
      }
    ])

    it('[パラメータなし]表示され、activeが1件(3)、inactiveが2件(2,1)になる', () => {
      const wrapper = mountFunction(downloads, null)
      viewTest(wrapper, downloads, { active: 1, inactive: 2 })
    })
    it('[パラメータのIDが一致]表示され、activeが2件(5,3)、inactiveが2件(2,1)になる', () => {
      const wrapper = mountFunction(downloads, { id: '5' })
      viewTest(wrapper, downloads, { active: 2, inactive: 2 })
    })
  })
})
