import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/Loading.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Loading.vue', () => {
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
    const wrapper = mountFunction(true)
    helper.presentTest(wrapper)
  })
})
