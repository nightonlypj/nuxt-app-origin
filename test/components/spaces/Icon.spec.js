import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/spaces/Icon.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Icon.vue', () => {
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
  const viewTest = (wrapper, space, visible) => {
    // console.log(wrapper.html())
    expect(wrapper.find('#space_private_' + space.code).exists()).toBe(visible) // 非公開
    expect(wrapper.find('#space_power_' + space.code).exists()).toBe(visible) // 権限
    expect(wrapper.find('#space_destroy_schedule_' + space.code).exists()).toBe(visible) // 削除予定
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[なし]表示されない', () => {
    const space = Object.freeze({
      code: 'code0001',
      private: false
    })
    const wrapper = mountFunction(space)
    viewTest(wrapper, space, false)
  })
  it('[あり]表示される', () => {
    const space = Object.freeze({
      code: 'code0001',
      private: true,
      destroy_schedule_at: '2021-01-01T09:00:00+09:00',
      current_member: {
        power: 'admin',
        power_i18n: '管理者'
      }
    })
    const wrapper = mountFunction(space)
    viewTest(wrapper, space, true)
  })
})
