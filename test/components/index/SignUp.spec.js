import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/index/SignUp.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('SignUp.vue', () => {
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

    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/users/sign_up')).toBe(true) // アカウント登録
    expect(links.includes('/users/sign_in')).toBe(true) // ログイン
  })
})
