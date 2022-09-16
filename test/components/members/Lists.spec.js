import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import OnlyIcon from '~/components/members/OnlyIcon.vue'
import Component from '~/components/members/Lists.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Lists.vue', () => {
  const mountFunction = (members) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        OnlyIcon: true
      },
      propsData: {
        members
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, members) => {
    // TODO
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[0件]表示されない', () => {
    const members = Object.freeze([])
    const wrapper = mountFunction(members)
    helper.blankTest(wrapper)
  })
  it('[2件]表示される', () => {
    // TODO
  })
})
