import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/members/OnlyIcon.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('OnlyIcon.vue', () => {
  const mountFunction = (power) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        power
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, power) => {
    expect(wrapper.html()).toMatch(helper.commonConfig.member.powerIcon[power]) // 権限
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[admin]表示される', () => {
    const power = 'admin'
    const wrapper = mountFunction(power)
    viewTest(wrapper, power)
  })
})
