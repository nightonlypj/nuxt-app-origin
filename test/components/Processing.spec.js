import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/Processing.vue'

describe('Processing.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = () => {
    return mount(Component, {
      localVue,
      vuetify
    })
  }

  it('表示される', () => {
    const wrapper = mountFunction()
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.html()).not.toBe('')
  })
})
