import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/Processing.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Processing.vue', () => {
  const mountFunction = () => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テストケース
  it('表示される', () => {
    const wrapper = mountFunction()
    helper.presentTest(wrapper)
  })
})
