import Vuetify from 'vuetify'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Component from '~/components/index/SignUp.vue'

describe('SignUp.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = (options) => {
    return shallowMount(Component, {
      localVue,
      vuetify,
      ...options
    })
  }

  it('成功', () => {
    const wrapper = mountFunction()
    // console.log(wrapper.html())
    expect(wrapper.vm).toBeTruthy()
  })
})
