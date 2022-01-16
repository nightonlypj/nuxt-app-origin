import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/index/SignUp.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('SignUp.vue', () => {
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

  const commonViewTest = (wrapper) => {
    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/users/sign_up')).toBe(true) // アカウント登録
    expect(links.includes('/users/sign_in')).toBe(true) // ログイン
  }

  it('表示される', () => {
    const wrapper = mountFunction()
    commonViewTest(wrapper)
  })
})
