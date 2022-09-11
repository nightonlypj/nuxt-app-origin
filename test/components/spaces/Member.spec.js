import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/spaces/Member.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Member.vue', () => {
  const mountFunction = (member) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        member
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, icon) => {
    // console.log(wrapper.html())
    expect(wrapper.html()).toMatch(icon)
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[管理者]表示されない', () => {
    const member = Object.freeze({ power: 'Admin', power_i18n: '管理者' })
    const wrapper = mountFunction(member)
    viewTest(wrapper, 'mdi-account-cog')
  })
  it('[投稿者]表示される', () => {
    const member = Object.freeze({ power: 'Writer', power_i18n: '投稿者' })
    const wrapper = mountFunction(member)
    viewTest(wrapper, 'mdi-account-edit')
  })
  it('[閲覧者]表示される', () => {
    const member = Object.freeze({ power: 'Reader', power_i18n: '閲覧者' })
    const wrapper = mountFunction(member)
    viewTest(wrapper, 'mdi-account')
  })
})
