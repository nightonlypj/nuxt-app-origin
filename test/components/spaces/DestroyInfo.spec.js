import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/spaces/DestroyInfo.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('DestroyInfo.vue', () => {
  const mountFunction = (space) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        space
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, space, link) => {
    expect(wrapper.text()).toMatch(wrapper.vm.$dateFormat('ja', space.destroy_schedule_at)) // 削除予定日
    const links = helper.getLinks(wrapper)
    expect(links.includes(`/spaces/undo_delete/${space.code}`)).toBe(link) // スペース削除取り消し
  }

  // テストケース
  it('[削除予定なし]表示されない', () => {
    const space = Object.freeze({ destroy_schedule_at: null })
    const wrapper = mountFunction(space)
    helper.blankTest(wrapper)
  })
  it('[削除予定あり（管理者）]取り消しリンクも表示される', () => {
    const space = Object.freeze({
      code: 'code0001',
      destroy_schedule_at: '2000-01-01T12:34:56+09:00',
      current_member: {
        power: 'admin'
      }
    })
    const wrapper = mountFunction(space)
    viewTest(wrapper, space, true)
  })
  it('[削除予定あり（管理者以外）]取り消しリンクは表示されない', () => {
    const space = Object.freeze({
      code: 'code0001',
      destroy_schedule_at: '2000-01-01T12:34:56+09:00'
    })
    const wrapper = mountFunction(space)
    viewTest(wrapper, space, false)
  })
})
