import Vuetify from 'vuetify'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Component from '~/components/users/edit/InfoEdit.vue'

describe('InfoEdit.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = (options) => {
    return shallowMount(Component, {
      localVue,
      vuetify,
      propsData: {
        user: {
          name: 'user1の氏名',
          email: 'user1@example.com',
          unconfirmed_email: null
        }
      },
      ...options
    })
  }

  it('成功', () => {
    const wrapper = mountFunction()
    // console.log(wrapper.html())
    expect(wrapper.vm).toBeTruthy()
  })
})
