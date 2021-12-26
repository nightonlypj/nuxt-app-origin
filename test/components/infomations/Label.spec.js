import Vuetify from 'vuetify'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Component from '~/components/infomations/Label.vue'

describe('Label.vue', () => {
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
        list: {
          label: 'Maintenance',
          label_i18n: 'メンテナンス'
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
